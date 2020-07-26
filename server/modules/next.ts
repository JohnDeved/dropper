import Next from 'next'
import { dev } from './config'

export const nextjs = Next({ dev })
export const handle = nextjs.getRequestHandler()
