const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { spawn } = require('child_process')

async function main() {
  console.log('Scanning Electron based applications, please wait...')

  const appRoot = '/Applications'
  const apps = fs.readdirSync(appRoot)

  const electronApps = apps.filter(app => {
    return fs.existsSync(
      path.resolve(
        appRoot,
        app,
        'Contents/Frameworks/Electron Framework.framework',
      ),
    )
  })

  // console.log(electronApps)

  const { app } = await inquirer.prompt([
    {
      name: 'app',
      message: 'Select the app you want to debug',
      type: 'list',
      choices: electronApps,
    },
  ])

  const exesDir = path.resolve(appRoot, app, 'Contents/MacOS')
  const exes = fs.readdirSync(exesDir)

  const ls = spawn(path.resolve(exesDir, exes[0]), ['--inspect'])

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
