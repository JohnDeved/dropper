import './style.sass'
import 'rsuite/lib/styles/themes/dark/index.less'
import Head from 'next/head'
import { useEffect } from 'react'
import { Workbox } from 'workbox-window'
import * as Sentry from '@sentry/browser'

// This default export is required in a new `pages/_app.js` file.
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
    <Component {...pageProps} />
  </>
}
