import fs from 'fs'
import path from 'path'
import plist from 'plist'
import { AppInfo } from '../types'

async function readIcnsAsImageUri(file: string) {
  let buf = await fs.promises.readFile(file)
  const totalSize = buf.readInt32BE(4) - 8
  buf = buf.slice(8)

  const icons = []

  let start = 0
  while (start < totalSize) {
    const type = buf.slice(start, start + 4).toString()
    const size = buf.readInt32BE(start + 4)
    const data = buf.slice(start + 8, start + size)

    icons.push({ type, size, data })
    start += size
  }

  icons.sort((a, b) => b.size - a.size)
  const imageData = icons[0].data
  if (imageData.slice(1, 4).toString() === 'PNG') {
    return 'data:image/png;base64,' + imageData.toString('base64')
  }

  // TODO: other image type
  return ''
}

export async function getMacOsAppInfo(
  appPath: string,
): Promise<AppInfo | undefined> {
  const isElectronBased = fs.existsSync(
    path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
  )
  if (!isElectronBased) return

  const infoContent = await fs.promises.readFile(
    path.join(appPath, 'Contents/Info.plist'),
    { encoding: 'utf8' },
  )
  const info = plist.parse(infoContent) as {
    CFBundleIdentifier: string
    CFBundleName: string
    CFBundleExecutable: string
    CFBundleIconFile: string
  }

  const icon = await readIcnsAsImageUri(
    path.join(appPath, 'Contents', 'Resources', info.CFBundleIconFile),
  )

  return {
    id: info.CFBundleIdentifier,
    name: info.CFBundleName,
    icon,
    exePath: path.resolve(appPath, 'Contents/MacOS', info.CFBundleExecutable),
  }
}

async function readdirAbsolute(dir: string) {
  try {
    const dirs = await fs.promises.readdir(dir)
    return dirs.map(file => path.join(dir, file))
  } catch (err) {
    return []
  }
}

export async function getAppsOfMacos() {
  const appPaths = await readdirAbsolute('/Applications')
  return Promise.all(appPaths.map(p => getMacOsAppInfo(p)))
}
