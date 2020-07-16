import { NextPage } from 'next'

import 'rsuite/lib/styles/themes/dark/index.less'

interface IProps {
  statusCode: number
  statusMessage: string
}

const Error: NextPage<IProps> = ({ statusCode, statusMessage }) => {
  return (
    <div data-error>
      <h3>Error {statusCode}</h3>
      <p>{statusMessage || 'an error occured'}</p>
    </div>
  )
}

Error.getInitialProps = ({ res }): IProps => {
  return {
    statusCode: res.statusCode !== 200 && res.statusCode,
    statusMessage: res.statusMessage
  }
}

export default Error
