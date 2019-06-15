import React, { FC } from 'react'
import ReactDOM from 'react-dom'
import { App } from './app'
import { AppProvider } from './store'
;(window as any).electron = require('electron') // for debug

const Container: FC = () => (
  <AppProvider>
    <App />
  </AppProvider>
)

ReactDOM.render(<Container />, document.getElementById('root'))
