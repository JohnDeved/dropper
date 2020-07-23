importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
importScripts('https://unpkg.com/dexie@3.0.1/dist/dexie.js')

// import {Dexie} from 'dexie'

// var db = new Dexie('dropper-db')

// db

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

  return await fetch(req)
}, 'POST')

workbox.routing.registerRoute(/upload\/tus/, async route => {
  const { request } = route
  const req = new Request(request.clone())
  const chunk = await request.arrayBuffer()

  const iv = crypto.getRandomValues(new Uint8Array(4))
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt'])
  const encrypt = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, chunk)

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