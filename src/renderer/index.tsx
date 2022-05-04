import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import reducers from '../reducers'
import { createStore, applyMiddleware } from 'redux'
import { composeWithStateSync } from 'electron-redux/renderer'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

// For debug
;(window as any).electron = require('electron')

const store = createStore(
  reducers,
  composeWithStateSync(applyMiddleware(thunk))
)

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
)
