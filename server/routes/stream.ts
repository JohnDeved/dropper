import express from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileModel } from '../modules/mongo'
import { nextjs } from '../modules/next'
import { exists } from '../modules/rclone'
import { getVideoThumb } from '../modules/ffmpeg'
import path from 'path'
import { isVideo, isImage } from '../modules/mime'

const router = express.Router()
const serveUrl = 'http://127.0.0.1:8080'

const proxy = createProxyMiddleware({
  target: serveUrl,
  changeOrigin: true,
  async onProxyRes (proxyRes, req) {
    const { filename } = req.params

    if (['text/html'].includes(proxyRes.headers['content-type'])) {
      proxyRes.headers['content-disposition'] = 'attachment;'
    } else {
      proxyRes.headers['content-disposition'] = 'inline;'
    }

    if (filename) proxyRes.headers['content-disposition'] += `filename=${filename}`
    proxyRes.headers['cache-control'] = 'public'
  }
})

router.get('/thumb/:filename', async (req, res, next) => {
  const { filename } = req.params

  if (isVideo(filename)) {
    const thumb = await getVideoThumb(filename)
    return res.sendFile(path.resolve(thumb))
  }

  if (isImage(filename)) {
    const thumb = await fetch(`http://127.0.0.1:8080/stream/${filename}`)
    return thumb.body.pipe(res)
  }

  return res.sendFile(path.resolve('public/thumbnail.svg'))
})

router.get('/:filename', async (req, res, next) => {
  const { filename } = req.params

  if (req.get('range')) return next()

  const exist = await exists(filename)
  if (!exist) return nextjs.render404(req, res)

  const file = await fileModel.findOne({ _id: req.params.filename })
  const response = await fetch(`${serveUrl}/stream/${filename}`, { method: 'HEAD' })

  if (!response.ok && file) {
    res.statusCode = 425
    res.statusMessage = 'This file is still beeing processed.'
    return nextjs.render(req, res, '/_error')
  }

  if (!file) return next()

  file.downloads++
  file.uploaded = true
  await file.save()

  req.params.filename = file.filename
  next()
}, proxy)

router.post('/:filename', async (req, res, next) => {
  const { filename } = req.params

  const file = await fileModel.findOne({ _id: filename })
  if (file?.fragments?.length > 0) return res.json(file.fragments.flat())
  if (!file) return res.sendStatus(404)
  res.sendStatus(400)
})

export default router
