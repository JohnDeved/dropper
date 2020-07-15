import * as express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import * as path from 'path'
import { serve } from './modules/rclone'
import upload from './routes/upload'

serve()

const app = express()
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '..', 'views'))

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

app.use('/e/:filename', (req, res) => {
  const { filename } = req.params
  console.log(filename)

  res.render('embed', { filename })
})

app.use('/stream/:filename', createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  pathRewrite: { '^/d': '/' },
}))

app.use('/upload', upload)

app.listen(3000)