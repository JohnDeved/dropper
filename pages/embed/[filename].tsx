import { useRouter } from 'next/router'
import { isArray } from 'util'
import { useRef, useEffect } from 'react'
import Head from 'next/head'
import { fileModel, FileClass } from '../../server/modules/mongo'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { filename } = context.params

  if (!isArray(filename) && filename) {
    const files = await fileModel.findOne({ _id: filename })
    if (!files) return
    const props: typeof files = files.toObject()
    return { props: { ...props, date: props.date.getTime() } }
  }
}

export default ({ filename: name }: FileClass) => {
  const router = useRouter()
  const video = useRef()

  const { filename } = router.query
  const streamRoute = `/stream/${filename}`

  useEffect(() => {
    if (video.current) {
      const player = require('player.js')
      player.HTML5Adapter(video.current).ready()
    }
  })

  function getEmbed () {
    if (!isArray(filename) && filename?.endsWith('.mp4')) {
      return <video className="embed" ref={video} controls src={streamRoute}></video>
    }

    if (filename) {
      return <embed className="embed" src={streamRoute}></embed>
    }
  }

  return <div>
    <Head>
      <meta property="og:title" content={name} />
      <meta property="og:type" content="video.other" />
      <meta property="og:url" content={`http://dropper.link${streamRoute}`} />
      <style>{`
        #__next {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        html,body {
          width: 100%
          height: 100%
        }
      `}</style>
    </Head>
    {getEmbed()}
  </div>
}