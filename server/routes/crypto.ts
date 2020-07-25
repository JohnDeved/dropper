import express from 'express'
import fetch from 'node-fetch'
import { fileModel } from '../modules/mongo'
import { Transform } from 'stream'
import BlockStream from 'block-stream2'
import { Crypto } from '@peculiar/webcrypto'
import { nextjs } from '../modules/next'

const webcrypto = new Crypto()
const router = express.Router()
const streamUrl = 'http://127.0.0.1:3000/stream/'

router.get('/:filename', async (req, res) => {
  const { filename } = req.params
  const { key: cryptString } = req.query

  console.log(req.headers)

  if (req.headers?.accept?.includes('html')) {
    const agent = req.headers['user-agent']
    const isSafari = agent.includes('Safari') && !agent.includes('Chrome')

    if (!isSafari) {
      return nextjs.render(req, res, '/install')
    }
  }

  if (typeof cryptString !== 'string') return res.sendStatus(400)

  const response = await fetch(streamUrl + filename)
  if (!response.ok) return res.sendStatus(response.status)

  const { keyhash } = await fileModel.findOne({ _id: filename })
  if (!keyhash) return res.status(400).send('file is not encrypted')

  const cryptBuffer = Buffer.from(cryptString, 'base64')
  const compHash = Buffer.from(keyhash, 'base64')
  const hash = Buffer.from(await webcrypto.subtle.digest('SHA-256', cryptBuffer))
  if (!hash.equals(compHash)) return res.status(400).send('wrong key')

  const decrypt = new Transform({
    async transform (chunk: Buffer, _encode, next) {
      const cryptBuffer = Buffer.from(cryptString, 'base64')
      const key = cryptBuffer.slice(0, 16)
      const iv = cryptBuffer.slice(-4)

      const cryptkey = await webcrypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt'])
      const decrypt = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptkey, chunk)

      this.push(Buffer.from(decrypt))
      next()
    }
  })

  response.headers.forEach((value, name) => {
    if (name === 'content-length') {
      const length = Number(value)
      const extraBytes = Math.ceil(length / 1e7) * 16
      return res.set('content-length', String(length - extraBytes))
    }
    res.header(name, value)
  })

  response.body
    .pipe<Transform>(new BlockStream({ size: 1e7 + 16, zeroPadding: false }))
    .pipe(decrypt)
    .pipe(res)
})

export default router
