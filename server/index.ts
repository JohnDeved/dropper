import express from 'express'
import path from 'path'
import Next from 'next'
import { serve } from './modules/rclone'
import upload from './routes/upload'
import stream from './routes/stream'
import { dev } from './modules/config'

const next = Next({ dev })
const handle = next.getRequestHandler()

serve()

next.prepare().then(() => {
  const app = express()

  app.use('/upload', upload)
  app.use('/stream', stream)

  app.get('*', (req, res) => handle(req, res))

  app.listen(3000)
})