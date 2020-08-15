import fs from 'fs'

export function fsExists (path: string) {
  return new Promise((resolve) => {
    fs.promises.access(path)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}
