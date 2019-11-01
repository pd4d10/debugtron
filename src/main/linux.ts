import path from 'path'
import { Adapter } from './adapter'

export class LinuxAdapter extends Adapter {
  async readApps() {
    // TODO:
    return []
  }
  async readAppByPath(p: string) {
    return {
      id: p,
      name: path.basename(p),
      icon: '',
      exePath: p,
    }
  }
}
