import express from 'express'

const router = express.Router()

router.get('/:filename', (req, res) => {
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

export default router