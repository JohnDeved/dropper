importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
importScripts('https://cdn.jsdelivr.net/npm/idb@5.0.4/build/iife/with-async-ittr-min.js')

workbox.core.clientsClaim()

function getDB () {
  return idb.openDB<typeof idb.KeysDB>('dropper', 1, {
    upgrade (db) { db.createObjectStore('cryptkeys') }
  })
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
  return Math.ceil(length / 1e7) * 16
}

function getEncryptedLength (length: number) {
  return length + getExtraBytes(length)
}

workbox.routing.registerRoute(/upload\/tus/, async route => {
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

workbox.routing.registerRoute(/upload\/tus/, async route => {
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
