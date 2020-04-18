import fs from 'fs'
import path from 'path'
import { Adapter } from './adapter'
import { readdirSafe, readFileAsBufferSafe, readPlistFile } from './utils'

export class MacosAdapter extends Adapter {
  async readApps() {
    const dir = '/Applications'
    const appPaths = await readdirSafe(dir)
    return Promise.all(
      appPaths.map((p) => this.readAppByPath(path.join(dir, p)))
    )
  }

  async readAppByPath(p: string) {
    const isElectronBased = fs.existsSync(
      path.join(p, 'Contents/Frameworks/Electron Framework.framework')
    )
    if (!isElectronBased) return

    const info = await readPlistFile(path.join(p, 'Contents/Info.plist'))

    const icon = await this.readIcnsAsImageUri(
      path.join(p, 'Contents/Resources', info.CFBundleIconFile)
    )

    return {
      id: info.CFBundleIdentifier,
      name: info.CFBundleName,
      icon,
      exePath: path.resolve(p, 'Contents/MacOS', info.CFBundleExecutable),
    }
  }

  private async readIcnsAsImageUri(file: string) {
    let buf = await readFileAsBufferSafe(file)
    if (!buf) return ''

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
}
