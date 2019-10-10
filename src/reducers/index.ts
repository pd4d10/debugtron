import { combineReducers } from 'redux'
import { AppInfo, Dict, InstancePayload } from '../types'
import { appInfo } from './app'
import { instanceInfo } from './instance'

export interface State {
  appInfo: Dict<AppInfo>
  instanceInfo: Dict<InstancePayload>
}

export default combineReducers({
  appInfo,
  instanceInfo,
})
