importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
importScripts('https://cdn.jsdelivr.net/npm/idb@5.0.4/build/iife/with-async-ittr-min.js')

// todo: check cryptkey hash
// todo: opt-out embed fallback
// todo: stop download after abort

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
  return idb.openDB<typeof idb.KeysDB>('dropper', 1, {
    upgrade (db) {
      db.createObjectStore('cryptkeys')
      db.createObjectStore('settings')
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

  const iv = crypto.getRandomValues(new Uint8Array(4))
  const cryptKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt'])
  const rawKey = await crypto.subtle.exportKey('raw', cryptKey)
  const extKey = exportCryptKey(rawKey, iv)
  const hash = await getCryptHash(extKey)

  req.headers.set('Upload-Length', String(cryptLength))
  req.headers.set('Dropper-Crypto', '1.0')
  req.headers.set('Dropper-Hash', hash)

  const res = await fetch(req)
  const filename = res.headers.get('Location').replace('/upload/tus/', '')

  const db = await getDB()
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

  const keyEnc = url.searchParams.get('key')
  const rawKey = Uint8Array.from(atob(keyEnc), c => c.charCodeAt(0))
  const rawHash = new Uint8Array(await crypto.subtle.digest('SHA-256', rawKey))
  if (String(hash) !== String(rawHash)) return new Response('wrong key', { status: 400 })

  const [, fileid] = url.pathname.match(/crypto\/([^/]+)/)
  const streamUrl = location.origin + '/stream/' + fileid
  const key = rawKey.slice(0, 16)
  const iv = rawKey.slice(-4)

  const res = await fetch(streamUrl)

  const resClone = new Response(res.body, { headers: res.headers })
  const length = Number(res.headers.get('content-length'))
  const extraBytes = getExtraBytes(length)
  resClone.headers.set('content-length', String(length - extraBytes))

  const mime = res.headers.get('content-type')
  if (mime.includes('video') || mime.includes('audio')) {
    const content = res.headers.get('content-disposition')
    resClone.headers.set('content-disposition', content.replace('inline', 'attachment'))
  }

  const reader = res.body.getReader()
  const stream = new ReadableStream({
    start (controller) {
      async function decryptChunk (chunk: Uint8Array) {
        console.log('decrypting chunk', chunk.byteLength)
        const cryptkey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt'])
        const decrypt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptkey, chunk)
        return new Uint8Array(decrypt)
      }

      async function push (rest?: Uint8Array) {
        let { done, value: chunk } = await reader.read()

        if (rest && chunk) {
          console.log('chunk', rest.byteLength, 'collecting', chunk.byteLength, 'bytes')
          const full = new Uint8Array(rest.byteLength + chunk.byteLength)
          full.set(rest)
          full.set(chunk, rest.byteLength)
          chunk = full
        }

        if (!chunk) {
          chunk = rest
        }

        const chunkSize = 5e5 + 16
        if (chunk.byteLength >= chunkSize) {
          const cryptChunk = chunk.slice(0, chunkSize)
          const rest = chunk.slice(chunkSize)

          const decrypt = await decryptChunk(cryptChunk)
          controller.enqueue(decrypt)
          return push(rest)
        }

        if (done) {
          console.log('last chunk', chunk.byteLength)
          if (chunk.byteLength !== 0) {
            const decrypt = await decryptChunk(chunk)
            controller.enqueue(decrypt)
          }
          return controller.close()
        }

        push(chunk)
      }

      push()
    }
  })

  return new Response(stream, { headers: resClone.headers })
}, 'GET')
