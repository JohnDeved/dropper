import { spawn } from 'child_process'
import { dev } from './config'

const rclone = dev ? 'rclone' : './rclone'
const log = chunk => process.stdout.write(chunk.toString())

export function serve () {
  const serve = spawn(rclone, [
    '--config=./rclone.conf', 'serve', 'http', 'dropper-cache:', '-vv',
    '--baseurl', '/stream',
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
    const move = spawn(rclone, ['--config=./rclone.conf', 'move', path, 'dropper-cache:']).on('close', () => {
      resolve()
    })
    move.stdout.on('data', log)
    move.stderr.on('data', log)
  })
}

export function exists (path: string) {
  return new Promise<boolean>(resolve => {
    const exists = spawn(rclone, ['--config=./rclone.conf', 'lsf', `dropper:${path}`]).on('close', code => {
      resolve(code === 0)
    })
    exists.stdout.on('data', log)
    exists.stderr.on('data', log)
  })
}
