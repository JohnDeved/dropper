import * as express from 'express'
import * as path from 'path'
import { serve } from './modules/rclone'
import upload from './routes/upload'
import stream from './routes/stream'
import oembed from './routes/oembed'
import embed from './routes/embed'

serve()

const app = express()
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '..', 'views'))

app.use('/upload', upload)
app.use('/stream', stream)
app.use('/embed', embed)
app.use('/oembed', oembed)

app.listen(3000)