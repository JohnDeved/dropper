import * as fs from 'fs'
import * as express from 'express'
import * as crypto from 'crypto'
import * as mime from 'mime-types'
import base64url from "base64url"
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process'

const rclone = process.env.NODE_ENV === 'production' ? './rclone' : 'rclone'
const rootDomain = 'https://dropper.up1.dev'
spawn(rclone, ['--config=./rclone.conf', 'serve', 'http', 'dropper:'])

const app = express()
app.use('/oembed', (req, res) => {
  const url = req.query.url
  if (!url) return res.sendStatus(500)

  res.json({
    type: "rich",
    version: "1.0",
    title: "dropper file",
    provider_name: "dropper",
    provider_url: "https://dropper.file",
    cache_age: 3600,
    thumbnail_url: "https://dummyimage.com/600x400/000/fff",
    thumbnail_width: 600,
    thumbnail_height: 400,
    html: `<iframe src="${url}"></iframe>`,
  })
})

app.use('/d/:filename', createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  pathRewrite: { '^/d': '/' },
}))

app.post('/u', (req, res) => {
  const type = req.header('Content-Type')
  const ext = mime.extension(type)

  const hash = base64url(crypto.randomBytes(5))
  const filename = `${hash}.${ext}`
  const path = `tmp/${filename}`

  req.pipe(fs.createWriteStream(path))
  req.on('end', async () => {

    spawn(rclone, ['--config=./rclone.conf', 'move', path, 'dropper:']).on('close', () => {
      res.send(filename)
    })
  })
})

app.listen(3000)