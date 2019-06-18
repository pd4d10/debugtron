import fs from 'fs'

export class PortPool {
  initialPort = 10000

  getPort() {
    // TODO: test port available
    this.initialPort++
    return this.initialPort
  }
}

export const readIcnsAsImageUri = async (file: string) => {
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
