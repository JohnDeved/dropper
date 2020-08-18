import ffmpeg from 'ffmpeg-static'
import ffprobe from 'ffprobe-static'
import { spawn } from 'child_process'
import { fsExists } from './fsExtra'
import mime from 'mime-types'
import { fileModel } from './mongo'
import { rcloneFileUrl } from './rclone'

export function getVideoThumb (id: string) {
  return new Promise<string>(resolve => {
    const outPath = `tmp/thumb_${id}.png`
    fsExists(outPath).then(exists => {
      if (exists) return resolve(outPath)

      spawn(ffmpeg, ['-i', rcloneFileUrl(id), '-frames:v', '1', outPath, '-y']).on('close', () => {
        resolve(outPath)
      })
    })
  })
}

export function getDimensions (id: string) {
  return new Promise<{ width: string, height: string }>(resolve => {
    const type = mime.lookup(id).toString()

    fileModel.findOne({ _id: id }).then(({ height, width }) => {
      if (type.startsWith('video') || type.startsWith('image')) {
        if (height && width) {
          return resolve({ width, height })
        }

        return spawn(ffprobe.path, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', rcloneFileUrl(id)])
          .stdout.once('data', async (data: Buffer) => {
            const [width, height] = data.toString().trim().split(',')
            await fileModel.updateOne({ _id: id }, { width, height })
            resolve({ width, height })
          })
      }

      resolve({ width: '500', height: '500' })
    })
  })
}
