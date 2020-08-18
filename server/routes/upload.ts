import fs from 'fs'
import crypto from 'crypto'
import base64url from 'base64url'
import Busboy from 'busboy'
import express from 'express'
import { move } from '../modules/rclone'
import { fileModel } from '../modules/mongo'
import parseFile from 'parse-filepath'
import { Buffer } from 'buffer'
import { PassThrough } from 'stream'
import { fsExists } from '../modules/fsExtra'
import { nextjs } from '../modules/next'

const router = express.Router()

function getRandomName () {
  return base64url(crypto.randomBytes(5))
}

router.post('/xhr', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  const length = Number(req.get('Content-Length'))
  if (length > 1e8) return res.sendStatus(400)

  busboy.on('file', async (key, file, filename) => {
    let filehash = getRandomName()
    const { ext } = parseFile(filename)
    if (ext) filehash += ext

    const path = `tmp/${filehash}`
    file.pipe(fs.createWriteStream(path))

    busboy.on('finish', async () => {
      await fileModel.create({ _id: filehash, filename, uploaded: true, length })
      const err = await move(path)
      if (err) return res.sendStatus(err)
      res.setHeader('Cache-Control', 'no-store')
      res.send(`https://dropper.link/embed/${filehash}`)
    })
  })

  req.pipe(busboy)
})

interface IUploadMetadata {
  filetype?: string
  filename?: string
}

function getMetaData (req: express.Request): IUploadMetadata {
  const rawMetadata = req.get('Upload-Metadata')
  return rawMetadata.split(',')
    .map(raw => {
      const [key, base64] = raw.split(' ')
      const value = Buffer.from(base64, 'base64').toString()
      return { key, value }
    })
    .reduce((obj, val) => {
      obj[val.key] = val.value
      return obj
    }, {})
}

router.post('/tus', async (req, res) => {
  const { filename } = getMetaData(req)
  const length = Number(req.get('Upload-Length'))
  const vcrypto = req.get('Dropper-Crypto')
  const keyhash = req.get('Dropper-Hash')
  const embeddable = !!req.get('Dropper-Embed')

  let filehash = getRandomName()
  const { ext } = parseFile(filename)
  if (ext) filehash += ext

  await fileModel.create({ _id: filehash, filename, length, vcrypto, keyhash, embeddable })

  fs.promises.writeFile(`tmp/${filehash}`, Buffer.from([]))

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Location', `/upload/tus/${filehash}`)
  res.sendStatus(201)
})

router.patch('/tus/:filename', async (req, res) => {
  const { filename } = req.params
  const length = Number(req.get('Content-Length'))
  const offset = Number(req.get('Upload-Offset'))

  const total = offset + length
  const path = `tmp/${filename}`

  if (!await fsExists(path)) res.sendStatus(404)

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Upload-Offset', total)

  const pass = new PassThrough()
  const hash = crypto.createHash('sha256')
  const stream = fs.createWriteStream(path, { start: offset, flags: 'r+' })

  req.pipe(pass)
  pass.pipe(hash)
  pass.pipe(stream)

  pass.once('end', async () => {
    hash.end()

    const file = await fileModel.findOne({ _id: filename })
    file.fragments.push(hash.digest('base64'))

    if (file.length === total) {
      file.uploaded = true
      const err = await move(path)
      if (err) return res.sendStatus(err)
    }

    await file.save()
    res.sendStatus(204)
  })
})

router.delete('/tus/:filename', async (req, res) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) res.sendStatus(404)

  await fs.promises.unlink(path)
  await fileModel.deleteOne({ _id: filename })

  res.setHeader('Tus-Resumable', '1.0.0')
  res.setHeader('Cache-Control', 'no-store')
  res.sendStatus(204)
})

router.head('/tus/:filename', async (req, res, next) => {
  const { filename } = req.params
  const path = `tmp/${filename}`
  if (!await fsExists(path)) return next()

  const { length } = await fileModel.findOne({ _id: filename })
  const { size } = await fs.promises.stat(path)

  res.setHeader('Upload-Length', length)
  res.setHeader('Upload-Offset', size)
  res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
  res.setHeader('Tus-Resumable', '1.0.0')
  res.sendStatus(204)
})

export default router
