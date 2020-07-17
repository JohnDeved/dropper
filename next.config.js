const withCSS = require('@zeit/next-css')
const withSass = require('@zeit/next-sass')
const withLess = require('@zeit/next-less')

module.exports = withCSS(
  withSass(
    withLess({
      lessLoaderOptions: {
        javascriptEnabled: true
      }
    })
  )
)