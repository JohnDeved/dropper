import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { postModel } from '../modules/mongo'

const router = express.Router()

const proxy = createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  pathRewrite: { '^/stream': '/' },
  onProxyRes (proxyRes, req) {
    const { filename } = req.params
    if (filename) proxyRes.headers['content-disposition'] = `inline; filename=${filename}`
  }
})

router.get('/:filename', async (req, res, next) => {
  const { filename } = req.params
  if (!filename) return next()

  const post = await postModel.findOne({ _id: req.params.filename })
  if (!post) return next()

  post.downloads++
  await post.save()

  req.params.filename = post.filename
  next()
}, proxy)

export default router