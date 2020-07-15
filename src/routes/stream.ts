import * as express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const router = express.Router()

router.get('/:filename', createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  pathRewrite: { '^/d': '/' },
}))

export default router