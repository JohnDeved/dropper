import './style.sass'
import 'rsuite/lib/styles/themes/dark/index.less'
import Head from 'next/head'
import { useEffect } from 'react'
import { Workbox } from 'workbox-window'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp ({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'vendor' in navigator && !navigator.vendor.includes('Apple')) {
      const wb = new Workbox('/sw.js')
      wb.register()
    }
  })

  return <>
    <Head>
      <title>Dropper</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="preload" as="style"/>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="stylesheet"/>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
      <link rel="manifest" href="/site.webmanifest"></link>
    </Head>
    <Component {...pageProps} />
  </>
}
