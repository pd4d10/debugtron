import fs from 'fs'

export async function readdirSafe(p: string) {
  try {
    return await fs.promises.readdir(p)
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function readFileSafe(p: string) {
  try {
    return await fs.promises.readFile(p, { encoding: 'utf8' })
  } catch (err) {
    console.error(err)
    return ''
  }
}

export async function readFileAsBufferSafe(p: string) {
  try {
    return await fs.promises.readFile(p)
  } catch (err) {
    console.error(err)
    return
  }
}
