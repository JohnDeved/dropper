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
      <link rel='shortcut icon' href='/favicon.ico' />
      <link rel="manifest" href="/site.webmanifest"></link>

      <meta name="theme-color" content="#101820" />
      <link rel='mask-icon' href='/logo.svg' color='#101820' />

      <meta name='application-name' content='Dropper Upload' />
      <meta name='apple-mobile-web-app-title' content='Dropper Upload' />
      <meta name='twitter:title' content='Dropper Upload' />
      <meta property='og:title' content='Dropper Upload' />
      <meta property='og:site_name' content='Dropper Upload' />

      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='mobile-web-app-capable' content='yes' />

      <meta name='description' content='Dropper offers free encrypted file uploads, without any file size limit.' />
      <meta name='twitter:description' content='Dropper offers free encrypted file uploads, without any file size limit.' />
      <meta property='og:description' content='Dropper offers free encrypted file uploads, without any file size limit.' />

      <meta name='twitter:card' content='summary' />
      <meta name='twitter:url' content='https://dropper.link' />
      <meta name='twitter:image' content='https://dropper.link/android-chrome-192x192.png' />
      <meta name='twitter:creator' content='@undefined_prop' />

      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://dropper.link' />
      <meta property='og:image' content='https://dropper.link/apple-touch-icon.png' />
      <meta name='format-detection' content='telephone=no' />

      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover' />
    </Head>
    <Component {...pageProps} />
  </>
}
