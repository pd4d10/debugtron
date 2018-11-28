const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

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

  execSync(`"${path.resolve(exesDir, exes[0])}" --inspect-brk`)
}

main()
