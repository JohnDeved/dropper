// ffmpeg -i http://127.0.0.1:8080/stream/ib59IaI.mp4 -frames:v 1 tmp/thumb_out.png
import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process'
import { fsExists } from './fsExtra'

export function getVideoThumb (id: string) {
  return new Promise<string>(resolve => {
    const outPath = `tmp/thumb_${id}.png`
    fsExists(outPath).then(exists => {
      if (exists) return resolve(outPath)

      spawn(ffmpeg, ['-i', `http://127.0.0.1:8080/stream/${id}`, '-frames:v', '1', outPath, '-y']).on('close', () => {
        resolve(outPath)
      })
    })
  })
}
