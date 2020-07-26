import { useEffect } from 'react'
import { Workbox } from 'workbox-window'

// This default export is required in a new `pages/_app.js` file.
export default function Install () {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'vendor' in navigator && !navigator.vendor.includes('Apple')) {
      new Workbox('/sw.js').register().then(() => {
        location.reload()
        setTimeout(close, 15000)
      })
    }
  })

  return <></>
}
