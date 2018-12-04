const inquirer = require('inquirer')
const os = require('os')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const fetch = require('node-fetch')
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
  const sp = spawn(executable, [
    '--inspect=9229',
    '--remote-debugging-port=9222',
  ])

  let fetched = false

  sp.stdout.on('data', data => {
    process.stdout.write(data)
  })

  sp.stderr.on('data', async data => {
    // waiting for stderr output to ensure debugger port is already listening
    if (!fetched) {
      fetched = true
      const res = await fetch('http://127.0.0.1:9229/json/list')
      const json = await res.json()

      console.log(
        '\n' +
          chalk.green(
            'To start debugging, open the following URL in Chrome:\n\n' +
              '[main process]:     ' +
              chalk.underline(json[0].devtoolsFrontendUrl) +
              '\n' +
              '[renderer process]: ' +
              chalk.underline('http://127.0.0.1:9222') +
              '\n',
          ),
      )
    }

    process.stderr.write(data)
  })

  sp.on('close', code => {
    console.log(`child process exited with code ${code}`)
  })
}

main()
