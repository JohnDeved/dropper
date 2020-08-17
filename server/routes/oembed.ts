import express from 'express'
import { fileModel } from '../modules/mongo'
import { isVideo, isImage } from '../modules/mime'
import { getDimensions } from '../modules/ffmpeg'

const router = express.Router()

router.get('/', async (req, res) => {
  const { url, maxwidth, maxheight } = req.query
  const urlRegex = /\/([^/]+?)$/

  if (typeof url !== 'string' || !urlRegex.test(url)) return res.sendStatus(400)

  const [, filename] = url.match(urlRegex)
  const file = await fileModel.findOne({ _id: filename })
  const { height, width } = await getDimensions(filename)

  if (!file) return res.sendStatus(404)

  const embedUrl = `https://dropper.link/embed/${filename}`
  const thumbUrl = `https://dropper.link/stream/thumb/${filename}`

  if (isVideo(filename)) {
    return res.json({
      version: '1.0',
      type: 'video',
      title: file.filename,
      provider_name: 'Dropper',
      provider_url: 'https://dropper.link/',
      html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='${width}' height='${height}' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
      width: Number(maxwidth) || Number(width),
      height: Number(maxheight) || Number(height),
      thumbnail_url: thumbUrl
    })
  }

  if (isImage(filename)) {
    return res.json({
      version: '1.0',
      type: 'photo',
      title: file.filename,
      provider_name: 'Dropper',
      provider_url: 'https://dropper.link/',
      html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='${width}' height='${height}' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
      width: Number(maxwidth) || Number(width),
      height: Number(maxheight) || Number(height),
      thumbnail_url: embedUrl
    })
  }

  return res.json({
    version: '1.0',
    type: 'rich',
    title: file.filename,
    provider_name: 'Dropper',
    provider_url: 'https://dropper.link/',
    html: `<iframe src='${embedUrl}' frameborder='0' scrolling='no' width='${width}' height='${height}' style='position:absolute;top:0;left:0;' allowfullscreen></iframe>`,
    width: Number(maxwidth) || Number(width),
    height: Number(maxheight) || Number(height),
    thumbnail_url: 'https://dropper.link/thumbnail.png'
  })
})

export default router
