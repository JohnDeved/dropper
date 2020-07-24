importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
importScripts("https://cdn.jsdelivr.net/npm/idb@5.0.4/build/iife/with-async-ittr-min.js")

function getDB () {
  return idb.openDB<typeof idb.KeysDB>('dropper', 1, {
    upgrade(db) { db.createObjectStore('cryptkeys') }
  })
}

function exportCryptKey (rawKey: ArrayBuffer, iv: Uint8Array) {
  const raw = new Uint8Array(rawKey)
  const full = Uint8Array.from([...raw, ...iv])
  console.log({ raw, iv, full })
  return btoa(String.fromCharCode(...full))
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

  req.headers.set('Upload-Length', String(cryptLength))
  req.headers.set('Dropper-Encrypted', '1.0')

  const res = await fetch(req)
  const filename = res.headers.get('Location').replace('/upload/tus/', '')

  const iv = crypto.getRandomValues(new Uint8Array(4))
  const cryptKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt'])
  const rawKey = await crypto.subtle.exportKey('raw', cryptKey)

  const db = await getDB()
  await db.put('cryptkeys', { iv, cryptKey, rawKey }, filename)

  return res
}, 'POST')

workbox.routing.registerRoute(/upload\/tus/, async route => {
  const { request, url } = route
  const req = new Request(request.clone())
  const chunk = await request.arrayBuffer()

  const filename = url.pathname.replace('/upload/tus/', '')

  const db = await getDB()
  const { cryptKey, iv, rawKey } = await db.get('cryptkeys', filename)
  const encrypt = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptKey, chunk)
  req.headers.set('Cryptkey', exportCryptKey(rawKey, iv))

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

// (async () => {
//   const data = new TextEncoder().encode('test')



//   // const r = await crypto.subtle.exportKey('raw', keyOrignal)
//   // const k = btoa(String.fromCharCode(...new Uint8Array(r)))
//   // const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(k), c => c.charCodeAt(0)), { name: 'AES-GCM' }, false, ['decrypt'])

//   const decrypt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypt)

//   console.log({data, k, encrypt, decrypt})
// })()