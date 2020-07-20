import './style.sass'
import 'rsuite/lib/styles/themes/dark/index.less'
import Head from 'next/head'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return (
    <html>
      <Head>
        <title>Dropper</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="stylesheet"/>
      </Head>
      <body>
        <Component {...pageProps} />
      </body>
    </html>
  )
}