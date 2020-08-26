import { spawn } from 'child_process'
import { dev } from './config'
import { createClient } from 'webdav'
import fs from 'fs'
import parseFilepath from 'parse-filepath'
import fetch from 'node-fetch'

const rclone = dev ? 'rclone' : './rclone'
const client = createClient('http://127.0.0.1:8080/stream')
const log = chunk => process.stdout.write(chunk.toString())

export function serve () {
  const serve = spawn(rclone, [
    '--config=./rclone.conf', 'serve', 'webdav', 'dropper-cache:', '-vv',
    '--cache-db-purge',
    '--etag-hash', 'MD5',
    '--baseurl', '/stream',
    '--poll-interval', '0',
    '--dir-cache-time', '24h',
    '--cache-dir', 'tmp/cache',
    '--vfs-cache-mode', 'writes',
    '--vfs-read-chunk-size', '32M',
    '--vfs-read-chunk-size-limit', '5G'
  ])
  serve.stdout.on('data', log)
  serve.stderr.on('data', log)
}

function transformName (filename: string) {
  return filename.replace('.', '/_.')
}

export function rcloneFileUrl (filename: string) {
  return `http://127.0.0.1:8080/stream/${transformName(filename)}`
}

export async function move (path: string) {
  const { base, name } = parseFilepath(path)
  const { size } = await fs.promises.stat(path)

  const mkdir = await fetch(rcloneFileUrl(name), { method: 'MKCOL' })

  if (!mkdir.ok) {
    console.error('webdav mkdir issue')
    return mkdir.status
  }

  const upload = await fetch(rcloneFileUrl(base), {
    method: 'PUT',
    headers: { 'Content-Length': String(size) },
    body: fs.createReadStream(path)
  })

  if (!upload.ok) {
    console.error('webdav upload issue')
    return upload.status
  }

  await fs.promises.unlink(path)
}

export function exists (path: string): Promise<boolean> {
  return client.exists(transformName(path))
}
