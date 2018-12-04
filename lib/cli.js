#!/usr/bin/env node

const program = require('commander')
const { startDebugging, startInteractiveDebugging } = require('./index')

program
  .version(require('../package.json').version)
  .arguments('[appPath]')
  .action(appPath => {
    if (appPath) {
      startDebugging(appPath)
    } else {
      startInteractiveDebugging()
    }
  })

  .parse(process.argv)
