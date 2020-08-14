import express from 'express'
import { fileModel } from '../modules/mongo'
import parseFilepath from 'parse-filepath'

const router = express.Router()

router.get('/', async (req, res) => {
  const { url, maxwidth, maxheight } = req.query
  const urlRegex = /\/([^/]+?)$/

  if (typeof url !== 'string' || !urlRegex.test(url)) return res.sendStatus(400)

  const [, filename] = url.match(urlRegex)
  const file = await fileModel.findOne({ _id: filename })

  if (!file) return res.sendStatus(404)

  const { ext } = parseFilepath(filename)
  const fileUrl = `https://dropper.link/stream/${filename}`
  const embedUrl = `https://dropper.link/embed/${filename}`

  if (['.mp4', '.webm'].includes(ext)) {
    return res.json({
      version: '1.0',
      type: 'video',
      title: file.filename,
      provider_name: 'Dropper',
      provider_url: 'https://dropper.link/',
      html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='1920' height='1080' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
      url: fileUrl,
      width: Number(maxwidth) || 1920,
      height: Number(maxheight) || 1080,
      thumbnail_url: 'https://dropper.link/thumbnail.png',
      thumbnail_width: 751,
      thumbnail_height: 500
    })
  }

  if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.bmp', '.apng', '.ico', '.tif', '.tiff', '.webp'].includes(ext)) {
    return res.json({
      version: '1.0',
      type: 'photo',
      title: file.filename,
      provider_name: 'Dropper',
      provider_url: 'https://dropper.link/',
      html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='1920' height='1080' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
      url: fileUrl,
      width: Number(maxwidth) || 1920,
      height: Number(maxheight) || 1080,
      thumbnail_url: embedUrl
    })
  }

  return res.json({
    version: '1.0',
    type: 'rich',
    title: file.filename,
    provider_name: 'Dropper',
    provider_url: 'https://dropper.link/',
    html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='1920' height='1080' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
    url: fileUrl,
    width: Number(maxwidth) || 1920,
    height: Number(maxheight) || 1080,
    thumbnail_url: 'https://dropper.link/thumbnail.png',
    thumbnail_width: 751,
    thumbnail_height: 500
  })
})

export default router
