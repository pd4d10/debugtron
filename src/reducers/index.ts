import { combineReducers } from 'redux'
import { AppInfo, Dict, SessionInfo } from '../types'
import { appInfo, appLoading } from './app'
import { sessionInfo } from './session'

export interface State {
  appLoading: boolean
  appInfo: Dict<AppInfo>
  sessionInfo: Dict<SessionInfo>
}

export default combineReducers({
  appLoading,
  appInfo,
  sessionInfo,
})
