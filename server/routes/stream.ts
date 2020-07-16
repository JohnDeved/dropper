import express from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { postModel } from '../modules/mongo'
import { nextjs } from '../modules/next'
import { exists } from '../modules/rclone'

const router = express.Router()
const serveUrl = 'http://127.0.0.1:8080'

const proxy = createProxyMiddleware({
  target: serveUrl,
  changeOrigin: true,
  pathRewrite: { '^/stream': '/' },
  async onProxyRes (proxyRes, req) {
    const { filename } = req.params
    if (filename) proxyRes.headers['content-disposition'] = `inline; filename=${filename}`
  }
})

router.get('/:filename', async (req, res, next) => {
  const { filename } = req.params
  if (!filename) return next()

  const exist = await exists(filename)
  if (!exist) return nextjs.render404(req, res)

  const post = await postModel.findOne({ _id: req.params.filename })
  const response = await fetch(`${serveUrl}/${filename}`, {method: 'HEAD'})

  if (!response.ok && post) {
    res.statusMessage = 'This file is still beeing processed.'
    return nextjs.render(req, res, '/_error')
  }

  if (!post) return next()

  post.downloads++
  await post.save()

  req.params.filename = post.filename
  next()
}, proxy)

export default router