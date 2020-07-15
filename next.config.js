const withSass = require('@zeit/next-sass')
const withLess = require('@zeit/next-less')

module.exports = withSass(withLess({
  lessLoaderOptions: {
    javascriptEnabled: true
  }
}))