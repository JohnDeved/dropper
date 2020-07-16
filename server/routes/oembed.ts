import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  const { filename } = req.params
  console.log(filename)

  res.render('embed', { filename })
})

export default router