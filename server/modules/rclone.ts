import { spawn } from 'child_process'
import { dev } from './config'

const rclone = dev ? 'rclone' : './rclone'

export function serve () {
  spawn(rclone, ['--config=./rclone.conf', 'serve', 'http', 'dropper:'])
}

export function move (path: string) {
  return new Promise(resolve => {
    spawn(rclone, ['--config=./rclone.conf', 'move', path, 'dropper:']).on('close', () => {
      resolve()
    })
  })
}