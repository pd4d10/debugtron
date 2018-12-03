const inquirer = require('inquirer')
const os = require('os')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { spawn } = require('child_process')

// read absolute directories
function readdirAbsolute(dir) {
  return fs.readdirSync(dir).map(file => path.join(dir, file))
}

function getPossibleAppPaths() {
  switch (process.platform) {
    case 'win32': {
      const apps = [
        ...readdirAbsolute(os.homedir() + '/AppData/Local'),
        ...readdirAbsolute('c:/Program Files'),
      ]
      return apps
    }
    case 'darwin':
      return readdirAbsolute('/Applications')
  }
}

function isElectronApp(appPath) {
  switch (process.platform) {
    case 'win32': {
      try {
        const [dir] = fs
          .readdirSync(appPath)
          .filter(name => name.startsWith('app-'))
        return (
          dir &&
          fs.existsSync(path.join(appPath, dir, 'resources/electron.asar'))
        )
      } catch (err) {
        // catch errors of readdir
        // 1. file: ENOTDIR: not a directory
        // 2. no permission at windows: EPERM: operation not permitted
        // console.error(err.message)
        return false
      }
    }
    case 'darwin':
      return fs.existsSync(
        path.join(appPath, 'Contents/Frameworks/Electron Framework.framework'),
      )
  }
}

function getExecutable(appPath) {
  switch (process.platform) {
    case 'win32': {
      const appName = path.basename(appPath)
      return path.join(appPath, appName + '.exe')
    }
    case 'darwin': {
      const exesDir = path.join(appPath, 'Contents/MacOS')
      const [exe] = fs.readdirSync(exesDir)
      return path.join(exesDir, exe)
    }
  }
}

async function main() {
  console.log('Scanning Electron based applications, please wait...')

  const choices = getPossibleAppPaths()
    .filter(isElectronApp)
    .map(appPath => ({
      name: path.basename(appPath),
      value: appPath,
    }))

  const { appPath } = await inquirer.prompt([
    {
      name: 'appPath',
      message: 'Select the app you want to debug',
      type: 'list',
      choices,
    },
  ])

  const executable = getExecutable(appPath)
  const ls = spawn(executable, ['--inspect'])

  ls.stdout.on('data', data => {
    const message = data.toString()
    process.stdout.write(message)
  })

  ls.stderr.on('data', data => {
    const message = data.toString()
    if (message.startsWith('Debugger listening on ws://')) {
      const wsUrl = message.replace(/^.*ws:\/\/(\S+)[\s\S]*$/, '$1')
      console.log(
        '\n' +
          chalk.yellow(
            'To start debugging, open the following URL in Chrome:\n' +
              chalk.underline(
                'chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=' +
                  wsUrl,
              ) +
              '\n',
          ),
      )
    }

    process.stderr.write(message)
  })

  ls.on('close', code => {
    console.log(`child process exited with code ${code}`)
  })
}

main()
