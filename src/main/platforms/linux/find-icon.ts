import os from 'os'
import path from 'path'
import fs from 'fs'

const sizeReg = /^\d+(x\d+)?(@\d+x?)?$/
const pixelIgnoreReg = /x\d+$/
const scalaIgnoreReg = /x$/

const MAX_SIZE = 9999

const DEFAULT_XDG_DATA_DIRS = [
    path.join(os.homedir(), '.local/share'),
    '/usr/local/share',
    '/usr/share'
]

const themeIconBases = (process.env.XDG_DATA_DIRS?.split(path.delimiter) || DEFAULT_XDG_DATA_DIRS)
    // If dir is not named with 'icons', append 'icons'
    .map(dir => path.basename(dir) === 'icons' ? dir : path.join(dir, 'icons'))

const backwards_userIconBase = path.join(os.homedir(), '.icons')
// for backwards compatibility
if (!themeIconBases.includes(backwards_userIconBase) && !themeIconBases.includes(backwards_userIconBase + '/')) {
    themeIconBases.unshift(backwards_userIconBase)
}

const themeLeveledBase = [
    /* 'xxx', */ // todo: get current theme
    'hicolor',
    'Papirus',
    'default',
    'locolor'
]

function initThemeLeveledNames() {
    function findThemeNames(base: string): string[] {
        if (!fs.existsSync(base)) return []

        const files = fs.readdirSync(base)
        return files.filter(name => fs.statSync(path.join(base, name)).isDirectory())
    }

    const themeNames = themeIconBases.map(findThemeNames).flat()

    return [
        ...themeLeveledBase.filter(theme => themeNames.includes(theme)),
        ...themeNames.filter(theme => !themeLeveledBase.includes(theme))
    ]
}

type SizeDir = { size: number, path: string }

// theme name sorted by leveled
const themeLeveledNames = initThemeLeveledNames()
const themeSortedDirs = new Map<string, SizeDir[]>(themeLeveledNames.map(theme => [
    theme,
    themeIconBases.map(base => iconDirSortBySize(findAllIconDirs(base, path.join(base, theme)))).flat()
]))

function parseSize(name: string): number {
    if (name === 'scalable') return MAX_SIZE
    if (name === 'symbolic') return 0.8
    if (!sizeReg.test(name)) return -1
    let [ pixel, scala ] = name.split('@')
    let size = Number(pixel.replace(pixelIgnoreReg, ''))
    let wight = Number(scala?.replace(scalaIgnoreReg, ''))
    return (isNaN(size) ? 0 : size) + (isNaN(wight) ? 0 : wight) / 100
}

function findAllIconDirs(base: string, parent = base): SizeDir[] {
    if (!fs.existsSync(parent)) return []

    const files = fs.readdirSync(parent)
    const dirs = files
        .map(name => path.join(parent, name))
        .filter(path => fs.statSync(path).isDirectory())
    if (dirs.length) {
        return dirs.map(findAllIconDirs.bind(void 0, base)).flat()
    }
    // resolve while cannot find child
    const relative = path.relative(base, parent)
    const pathNames = relative.split(path.sep)
    // ignore dir that do not contain 'apps' in the path
    if (!pathNames.includes('apps')) return []
    // remove that path with 'apps' compatible theme/size/apps and theme/apps/size
    const [ _theme, size ] = relative.split('/').filter(name => name !== 'apps')
    return [ { path: parent, size: parseSize(size) } ]
}

function findThemeIconDirs(theme: string) {
    // return themeIconBases.map(base => findAllIconDirs(base, path.join(base, theme))).flat()
    return themeSortedDirs.get(theme) || []
}

function iconDirSortBySize(dirs: SizeDir[]): SizeDir[] {
    return dirs.sort((a, b) => b.size - a.size)
}

function accessSync(path: string): boolean {
    try {
        fs.accessSync(path)
        return true
    } catch (e) {
        return false
    }
}

function tryFile(parent: string, name: string, ext?: string): string | undefined {
    const fileName = ext ? `${name}.${ext}` : name
    const filePath = path.join(parent, fileName)
    if (accessSync(filePath)) return filePath
}

const supportIconExt = [ 'png', 'xpm', 'svg' ]

function findIconPathFromSizeDir(name: string, dir: SizeDir): string | undefined {
    for (const ext of supportIconExt) {
        const tried = tryFile(dir.path, name, ext)
        if (tried) return tried
    }
}

function findIconPathByTheme(finder: (dir: SizeDir) => string | void, theme: string): string | undefined {
    for (const dir of findThemeIconDirs(theme)) {
        const found = finder(dir)
        if (found) return found
    }
}

// pixmaps
const pixmapsBase = '/usr/share/pixmaps'

function findIconFromPixmaps(name: string): string | undefined {
    if (!fs.existsSync(pixmapsBase)) return

    for (const ext of supportIconExt) {
        const tried = tryFile(pixmapsBase, name, ext)
        if (tried) return tried
    }
}

export function findIconPath(name: string, theme?: string): string | undefined {
    const _findIconPathFromSizeDir = findIconPathFromSizeDir.bind(void 0, name)
    const _findIconPathByTheme = findIconPathByTheme.bind(void 0, _findIconPathFromSizeDir)
    if (theme) {
        const found = _findIconPathByTheme(theme)
        if (found) return found
    }
    for (const themeLeveled of themeLeveledNames) {
        if (themeLeveled === theme) continue
        const found = _findIconPathByTheme(themeLeveled)
        if (found) return found
    }
    const found = findIconFromPixmaps(name)
    if (found) return found
}
