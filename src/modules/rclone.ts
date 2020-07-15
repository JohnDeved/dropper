import { spawn } from 'child_process'

const rclone = process.env.NODE_ENV === 'production' ? './rclone' : 'rclone'

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