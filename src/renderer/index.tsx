import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './app'

window.remote = require('electron').remote // for debug

ReactDOM.render(<App />, document.getElementById('root'))
