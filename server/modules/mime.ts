import parseFilepath from 'parse-filepath'

export function isVideo (filename: string) {
  const { ext } = parseFilepath(filename)
  return ['.mp4', '.webm'].includes(ext)
}

export function isImage (filename: string) {
  const { ext } = parseFilepath(filename)
  return ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.bmp', '.apng', '.ico', '.tif', '.tiff', '.webp'].includes(ext)
}
