import os from 'os'
import path from 'path'
import ini from 'ini'
import fs from 'fs'
import { Adapter } from './adapter'
import { readdirSafe, readFileSafe } from './utils'
import { AppInfo } from '../types'
import { findIconPath } from './linux/find-icon'

const userAppsDir = path.join(os.homedir(), '.local/share/applications')
const sysAppsDir = '/usr/share/applications'

export class LinuxAdapter extends Adapter {
  async readAppDir(dir: string) {
    const files = await readdirSafe(dir)
    const apps = await Promise.all(
      files.map((file) => {
        if (!file.endsWith('.desktop')) return
        return this.readAppInfo(path.join(dir, file))
      })
    )
    return apps
  }
  async readApps() {
    const userApps = await this.readAppDir(userAppsDir)
    const sysApps = await this.readAppDir(sysAppsDir)
    return [...userApps, ...sysApps]
  }
  async readAppByPath(p: string) {
    return {
      id: p,
      name: path.basename(p),
      icon: '',
      exePath: p,
    }
  }

  private async readAppInfo(desktopFile: string): Promise<AppInfo | undefined> {
    const content = await readFileSafe(desktopFile)

    const entry = ini.parse(content)['Desktop Entry'] as {
      Name?: string
      Icon?: string
      Exec?: string
    }
    if (!entry || !entry.Exec) return

    let exePath = ''
    if (entry.Exec.startsWith('"')) {
      exePath = entry.Exec.replace(/^"(.*)".*/, '$1')
    } else {
      // Remove arg
      exePath = entry.Exec.split(/\s+/)[0]
    }

    if (!exePath.startsWith('/')) return

    const exeDir = path.dirname(exePath)
    // if (!fs.existsSync(path.join(exePath, '../resources/electron.asar'))) return
    if (
      !fs.existsSync(path.join(exeDir, 'LICENSE.electron.txt'))
      && !fs.existsSync(path.join(exeDir, 'chrome-sanbox'))
      && !fs.existsSync(path.join(exeDir, 'resources/electron.asar'))
    ) return

    let icon = ''
    let iconPath = '' // todo: set default icon
    if (entry.Icon) {
      if (path.isAbsolute(entry.Icon)) {
        iconPath = entry.Icon
      } else {
        iconPath = findIconPath(entry.Icon) || iconPath
      }

      if (fs.existsSync(iconPath)) {
        const base64 = await fs.promises.readFile(iconPath, 'base64')

        const ext = path.extname(iconPath)
        if (ext === '.svg') {
          icon = 'data:image/svg+xml;base64,' + base64
        }
        if (ext === '.png') {
          icon = 'data:image/png;base64,' + base64
        }
        // todo: if (ext === 'xpm') {}
      }
    }

    return {
      id: exePath,
      icon: icon, // TODO: Read icon
      name: entry.Name || path.basename(exePath),
      exePath: exePath,
    }
  }
}
