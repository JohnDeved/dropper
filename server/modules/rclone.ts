import { spawn } from 'child_process'
import { dev } from './config'
import { createClient } from 'webdav'
import fs from 'fs'
import parseFilepath from 'parse-filepath'

const rclone = dev ? 'rclone' : './rclone'
const client = createClient('http://127.0.0.1:8080/stream')
const log = chunk => process.stdout.write(chunk.toString())

export function serve () {
  const serve = spawn(rclone, [
    '--config=./rclone.conf', 'serve', 'webdav', 'dropper-cache:', '-vv',
    '--baseurl', '/stream',
    '--cache-db-purge',
    '--poll-interval', '24h',
    '--dir-cache-time', '24h',
    '--cache-dir', 'tmp/cache',
    '--vfs-cache-mode', 'writes',
    '--vfs-read-chunk-size', '32M',
    '--vfs-read-chunk-size-limit', '5G'
  ])
  serve.stdout.on('data', log)
  serve.stderr.on('data', log)
}

export function move (path: string) {
  return new Promise(resolve => {
    const { base } = parseFilepath(path)
    console.log({ base, path })
    fs.createReadStream(path)
      .pipe(client.createWriteStream(base) as ReturnType<typeof fs.createWriteStream>)
      .once('end', () => {
        fs.promises.unlink(path).then(resolve)
      })
  })
}

export function exists (path: string): Promise<boolean> {
  return client.exists(path)
}
