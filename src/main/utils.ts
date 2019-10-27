import fs from 'fs'

export async function readdirSafe(dir: string) {
  try {
    return fs.promises.readdir(dir)
  } catch (err) {
    return []
  }
}
