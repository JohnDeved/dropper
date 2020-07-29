import express from 'express'
import { serve } from './modules/rclone'
import upload from './routes/upload'
import stream from './routes/stream'
import * as Sentry from '@sentry/node'
import { nextjs, handle } from './modules/next'
import oembed from './routes/oembed'
import { dev } from './modules/config'
import crypto from './routes/crypto'

if (!dev) {
  Sentry.init({
    dsn: 'https://0ec6c589070e455c971972cb634fb8fc@sentry.up1.dev/4',
    environment: 'server'
  })
}

serve()

nextjs.prepare().then(() => {
  const app = express()

  app.use('/upload', upload)
  app.use('/stream', stream)
  app.use('/crypto', crypto)
  app.use('/oembed', oembed)

  app.get('*', (req, res) => handle(req, res))

  app.listen(3000)
})
