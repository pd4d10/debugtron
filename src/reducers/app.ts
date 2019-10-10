import { Reducer } from 'redux'
import { AppInfo, Dict } from '../types'

const GET_APPS = 'GET_APPS'

export const appInfo: Reducer<Dict<AppInfo>> = (state = {}, action) => {
  switch (action.type) {
    case GET_APPS:
      return action.payload
    default:
      return state
  }
}

export const getApps = (apps: Dict<AppInfo>) => ({
  type: GET_APPS,
  payload: apps,
})
