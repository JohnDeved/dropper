import * as fs from 'fs'
import { promisify } from 'util'
import express from 'express'
import fetch from 'node-fetch'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileModel } from '../modules/mongo'
import { nextjs } from '../modules/next'
import { exists, move } from '../modules/rclone'
import next from 'next'

const fsExists = promisify(fs.exists)
const router = express.Router()
const serveUrl = 'http://127.0.0.1:8080'

router.patch('/:filename', async (req, res) => {
  const { filename } = req.params
  const length = Number(req.get('Content-Length'))
  const offset = Number(req.get('Upload-Offset'))
  const total = offset + length
  const path = `tmp/${filename}`

  if (!await fsExists(path)) res.sendStatus(404)

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Upload-Offset', total)

  const stream = fs.createWriteStream(path, { start: offset, flags: 'r+' })
  req.pipe(stream)
  req.on('end', async () => {
    const file = await fileModel.findOne({ _id: filename })

    if (file.length === total) {
      await move(path)
    }

    res.sendStatus(204)
  })
})

router.delete('/:filename', async (req, res) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) res.sendStatus(404)

  await fs.promises.unlink(path)
  await fileModel.deleteOne({ _id: filename })

  res.setHeader('Tus-Resumable', '1.0.0')
  res.sendStatus(204)
})

router.head('/:filename', async (req, res, next) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) return next()

  const { length } = await fileModel.findOne({ _id: filename })
  const { size } = await fs.promises.stat(path)

  res.setHeader('Upload-Length', length)
  res.setHeader('Upload-Offset', size)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Tus-Resumable', '1.0.0')
  res.sendStatus(204)
})

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

  const file = await fileModel.findOne({ _id: req.params.filename })
  const response = await fetch(`${serveUrl}/${filename}`, { method: 'HEAD' })

  if (!response.ok && file) {
    res.statusMessage = 'This file is still beeing processed.'
    return nextjs.render(req, res, '/_error')
  }

  if (!file) return next()

  file.downloads++
  await file.save()

  req.params.filename = file.filename
  next()
}, proxy)

export default router