import type { App } from 'vue'

import { vPermission, vRole } from './permission'
import { vReveal } from './reveal'
import { vRipple } from './ripple'
import { vSpotlight } from './spotlight'

export function setupDirectives(app: App): void {
  app.directive('permission', vPermission)
  app.directive('role', vRole)
  app.directive('spotlight', vSpotlight)
  app.directive('ripple', vRipple)
  app.directive('reveal', vReveal)
}

export { vPermission, vReveal, vRipple, vRole, vSpotlight }
