importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
importScripts('https://cdn.jsdelivr.net/npm/idb@5.0.4/build/iife/with-async-ittr-min.js')

workbox.core.skipWaiting()
workbox.core.clientsClaim()

let shouldEncrypt = false

addEventListener('message', ({ data }) => {
  shouldEncrypt = data
})

addEventListener('install', async () => {
  console.log('service worker installed')
  shouldEncrypt = await encraptionEnabled()
})

function getDB () {
  return idb.openDB<typeof idb.KeysDB>('dropper', 2, {
    upgrade (db, oldv) {
      if (oldv < 1) {
        db.createObjectStore('cryptkeys')
        db.createObjectStore('settings')
      }
      if (oldv < 2) {
        db.createObjectStore('fragments')
      }
    }
  })
}

async function encraptionEnabled () {
  const db = await getDB()
  const { encryption } = await db.get('settings', 0) || {}
  return !!encryption
}

function exportCryptKey (rawKey: ArrayBuffer, iv: Uint8Array) {
  const raw = new Uint8Array(rawKey)
  const full = Uint8Array.from([...raw, ...iv])
  return btoa(String.fromCharCode(...full))
}

async function getCryptHash (extKey: string) {
  const ext = Uint8Array.from(atob(extKey), c => c.charCodeAt(0))
  const hash = await crypto.subtle.digest('SHA-256', ext)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

function getExtraBytes (length: number) {
  return Math.ceil(length / 5e5) * 16
}

function getEncryptedLength (length: number) {
  return length + getExtraBytes(length)
}

function getDecryptedLength (length: number) {
  return length - getExtraBytes(length)
}

type RouteMatchCallback = Parameters<typeof workbox.routing.registerRoute>[0]
const shouldCapture: RouteMatchCallback = ({ url }) => {
  return /upload\/tus/.test(url.href) && shouldEncrypt
}

const shouldDecrypt: RouteMatchCallback = ({ url }) => {
  return /crypto/.test(url.href) && !!ReadableStream
}

workbox.routing.registerRoute(shouldCapture, async route => {
  const { request } = route
  const req = new Request(request.clone())
  const length = Number(req.headers.get('Upload-Length'))
  const cryptLength = getEncryptedLength(length)
  const db = await getDB()

  const { embed } = await db.get('settings', 0)
  const iv = crypto.getRandomValues(new Uint8Array(4))
  const cryptKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt'])
  const rawKey = await crypto.subtle.exportKey('raw', cryptKey)
  const extKey = exportCryptKey(rawKey, iv)
  const hash = await getCryptHash(extKey)

  req.headers.set('Upload-Length', String(cryptLength))
  req.headers.set('Dropper-Crypto', '1.0')
  req.headers.set('Dropper-Hash', hash)
  req.headers.set('Dropper-Embed', String(embed))

  const res = await fetch(req)
  const filename = res.headers.get('Location').replace('/upload/tus/', '')

  await db.put('cryptkeys', { iv, cryptKey, rawKey, extKey }, filename)

  return res
}, 'POST')

workbox.routing.registerRoute(shouldCapture, async route => {
  const { request, url } = route
  const req = new Request(request.clone())
  const chunk = await request.arrayBuffer()

  const filename = url.pathname.replace('/upload/tus/', '')

  const db = await getDB()
  const { cryptKey, iv } = await db.get('cryptkeys', filename)
  const encrypt = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptKey, chunk)

  const offset = Number(request.headers.get('Upload-Offset'))
  if (offset) {
    const extraBytes = getExtraBytes(offset)
    req.headers.set('Upload-Offset', String(offset + extraBytes))
  }

  const response = await fetch(new Request(req, { body: encrypt }))

  const fragmentHash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', encrypt))))
  console.log(fragmentHash)
  await db.put('fragments', new Uint8Array(encrypt), `${filename}-${fragmentHash}`)

  const res = new Response(null, {
    headers: response.headers,
    status: response.status
  })
  res.headers.set('Upload-Offset', String(chunk.byteLength + offset))

  return res
}, 'PATCH')

workbox.routing.registerRoute(shouldCapture, async route => {
  const { request, url } = route

  const res = await fetch(url.href, { headers: request.headers, method: 'HEAD' })
  const resClone = new Response(res.body, { headers: res.headers })

  let length = Number(res.headers.get('Upload-Length'))
  length = getDecryptedLength(length)
  if (length) {
    resClone.headers.set('Upload-Length', String(length))
  }

  let offset = Number(res.headers.get('Upload-Offset'))
  offset = Math.floor(offset / 5e5) * 5e5
  if (offset) {
    resClone.headers.set('Upload-Offset', String(offset))
  }

  return new Response(null, { headers: resClone.headers, status: res.status })
}, 'HEAD')

workbox.routing.registerRoute(shouldDecrypt, async route => {
  const { url } = route

  const hashRes = await fetch(url.href, { method: 'POST' })
  if (!hashRes.ok) return new Response('something went wrong on your end', { status: 400 })
  const hash = new Uint8Array(await hashRes.arrayBuffer())

  let keyEnc = url.searchParams.get('key')
  if (!keyEnc) keyEnc = decodeURIComponent(url.hash.slice(1))
  const rawKey = Uint8Array.from(atob(keyEnc), c => c.charCodeAt(0))
  const rawHash = new Uint8Array(await crypto.subtle.digest('SHA-256', rawKey))
  if (String(hash) !== String(rawHash)) return new Response('wrong key', { status: 400 })

  const [, fileid] = url.pathname.match(/crypto\/([^/]+)/)
  const streamUrl = location.origin + '/stream/' + fileid
  const key = rawKey.slice(0, 16)
  const iv = rawKey.slice(-4)

  const res = await fetch(streamUrl, { method: 'HEAD' })
  if (!res.ok) return res

  const resClone = new Response(null, { headers: res.headers })
  const length = Number(res.headers.get('content-length'))
  const extraBytes = getExtraBytes(length)
  resClone.headers.set('content-length', String(length - extraBytes))

  const mime = res.headers.get('content-type')
  if (mime.includes('video') || mime.includes('audio')) {
    const content = res.headers.get('content-disposition')
    resClone.headers.set('content-disposition', content.replace('inline', 'attachment'))
  }

  const fragmentReq = await fetch(streamUrl, { method: 'POST' })
  const fragments: string[] = await fragmentReq.json()

  const stream = new ReadableStream({
    async start (controller) {
      const db = await getDB()
      const cryptkey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt'])
      let chunkNum = 0

      function getChunkSize (offset: number) {
        const chunkSize = 5e5 + 16
        if (offset + chunkSize > length) return length - offset
        return chunkSize
      }

      async function getChunk (offset: number, chunkSize: number) {
        const fragmentHash = fragments?.[chunkNum]
        chunkNum++

        if (fragmentHash) {
          const fragmentData = db.get('fragments', `${fileid}-${fragmentHash}`)
          if (fragmentData) {
            return fragmentData
          }
        }

        const res = await fetch(streamUrl, {
          headers: {
            Range: `bytes=${offset}-${chunkSize + offset - 1}`
          }
        })
        return new Uint8Array(await res.arrayBuffer())
      }

      async function push (offset = 0) {
        const chunkSize = getChunkSize(offset)
        const chunk = await getChunk(offset, chunkSize)

        if (chunk.byteLength === chunkSize) {
          console.log('decrypting chunk', offset, offset + chunk.byteLength)
          const decrypt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptkey, chunk))
          controller.enqueue(decrypt)

          if (offset + chunk.byteLength === length) return controller.close()
          return push(chunkSize + offset)
        }

        console.error('malformed chunk', chunk.byteLength, chunkSize)
      }

      push()
    }
  })

  return new Response(stream, { headers: resClone.headers })
}, 'GET')
