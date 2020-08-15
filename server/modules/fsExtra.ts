import fs from 'fs'
import parseFilepath from 'parse-filepath'

export function fsExists (path: string) {
  return new Promise((resolve) => {
    fs.promises.access(path)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

export function isVideo (filename: string) {
  const { ext } = parseFilepath(filename)
  return ['.mp4', '.webm'].includes(ext)
}

export function isImage (filename: string) {
  const { ext } = parseFilepath(filename)
  return ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.bmp', '.apng', '.ico', '.tif', '.tiff', '.webp'].includes(ext)
}
