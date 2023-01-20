import { MacosAppInfo } from '../../types'
import plist from 'simple-plist'

export async function readPlistFile(path: string): Promise<MacosAppInfo> {
  return new Promise((resolve, reject) => {
    plist.readFile<MacosAppInfo>(path, (error, data) => {
      // console.log(error, data)

      if (error || !data) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}
