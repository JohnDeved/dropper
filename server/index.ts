import express from 'express'
import morgan from 'morgan'
import * as Sentry from '@sentry/node'
import { serve } from './modules/rclone'
import upload from './routes/upload'
import stream from './routes/stream'
import { nextjs, handle } from './modules/next'
import oembed from './routes/oembed'
import { dev } from './modules/config'
import crypto from './routes/crypto'
import cors from 'cors'
import { getDimensions } from './modules/ffmpeg'

if (!dev) {
  Sentry.init({
    dsn: 'https://0ec6c589070e455c971972cb634fb8fc@sentry.up1.dev/4',
    environment: 'server'
  })
}

serve()

nextjs.prepare().then(() => {
  const app = express()

  app.use(morgan('dev'))
  app.use(cors())

  app.use('/upload', upload)
  app.use('/stream', stream)
  app.use('/crypto', crypto)
  app.use('/oembed', oembed)

  app.get('*', (req, res) => handle(req, res))

  app.listen(3000)
})
