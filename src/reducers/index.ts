import { combineReducers } from 'redux'
import { AppInfo, Dict, SessionInfo } from '../types'
import { appInfo } from './app'
import { sessionInfo } from './session'

export interface State {
  appInfo: Dict<AppInfo>
  sessionInfo: Dict<SessionInfo>
}

export default combineReducers({
  appInfo,
  sessionInfo,
})
