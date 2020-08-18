import { spawn } from 'child_process'
import { dev } from './config'

const rclone = dev ? 'rclone' : './rclone'

export function serve () {
  const log = chunk => process.stdout.write(chunk.toString())

  const serve = spawn(rclone, [
    '--config=./rclone.conf', 'serve', 'http', 'dropper-cache:', '-vv',
    '--baseurl', '/stream',
    '--cache-dir', 'tmp/cache',
    '--vfs-cache-mode', 'full',
    '--vfs-read-chunk-size', '32M',
    '--vfs-read-chunk-size-limit', '5G'
  ])
  serve.stdout.on('data', log)
  serve.stderr.on('data', log)
}

export function move (path: string) {
  return new Promise(resolve => {
    spawn(rclone, ['--config=./rclone.conf', 'move', path, 'dropper:']).on('close', () => {
      resolve()
    })
  })
}

export function exists (path: string) {
  return new Promise<boolean>(resolve => {
    spawn(rclone, ['--config=./rclone.conf', 'lsf', `dropper:${path}`]).on('close', code => {
      resolve(code === 0)
    })
  })
}
