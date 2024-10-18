import { SCOPE_SET } from './constants'

export function batchScopeStart() {
  SCOPE_SET.forEach(scope => {
    scope.pause()
  })
}

export function batchScopeEnd() {
  SCOPE_SET.forEach(scope => {
    scope.resume()
  })
}
