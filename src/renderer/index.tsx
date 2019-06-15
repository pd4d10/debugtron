import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './app'

;(window as any).remote = require('electron').remote // for debug

ReactDOM.render(<App />, document.getElementById('root'))
