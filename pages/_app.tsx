import './style.sass'
import 'rsuite/lib/styles/themes/dark/index.less'
import { useEffect } from 'react'
import { Workbox } from 'workbox-window'
import * as Sentry from '@sentry/browser'
import Head from 'next/head'

export default function MyApp ({ Component, pageProps }) {
  useEffect(() => {
    if (!location.hostname.includes('localhost')) {
      Sentry.init({
        dsn: 'https://0ec6c589070e455c971972cb634fb8fc@sentry.up1.dev/4',
        environment: 'client'
      })
    }

    if ('serviceWorker' in navigator && 'vendor' in navigator && !navigator.vendor.includes('Apple')) {
      const wb = new Workbox('/sw.js')
      wb.register()
    }
  })

  return <>
    <Head>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="preload" as="style"/>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap" rel="stylesheet"/>

      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
      <link rel='shortcut icon' href='/favicon.ico' />
      <link rel="manifest" href="/site.webmanifest"></link>

      <meta name="theme-color" content="#101820" />
      <link rel='mask-icon' href='/logo.svg' color='#101820' />
    </Head>
    <Component {...pageProps} />
  </>
}
