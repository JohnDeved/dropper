import express from 'express'
import Next from 'next'
import { serve } from './modules/rclone'
import upload from './routes/upload'
import stream from './routes/stream'
import { dev } from './modules/config'
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://0ec6c589070e455c971972cb634fb8fc@sentry.up1.dev/4'
})

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