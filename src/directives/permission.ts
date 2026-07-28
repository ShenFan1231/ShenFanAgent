import type { Directive, DirectiveBinding } from 'vue'

import { useUserStore } from '@/stores/user'
import type { PermissionInput, RoleKey } from '@/types/permission'

type Mode = 'remove' | 'disable'

interface PermissionEl extends HTMLElement {
  /** 记录占位注释节点，便于权限变化后还原 */
  __permissionPlaceholder?: Comment
}

function resolve(el: PermissionEl, allowed: boolean, mode: Mode): void {
  if (allowed) {
    if (mode === 'disable') {
      el.removeAttribute('disabled')
      el.classList.remove('is-permission-denied')
    }
    return
  }

  if (mode === 'disable') {
    el.setAttribute('disabled', 'disabled')
    el.classList.add('is-permission-denied')
    el.title = '当前账号没有该操作权限'
    return
  }

  // 直接从 DOM 移除，比 v-if 更彻底：模板里不需要到处写权限判断
  const placeholder = document.createComment('permission-denied')
  el.__permissionPlaceholder = placeholder
  el.parentNode?.replaceChild(placeholder, el)
}

function check(el: PermissionEl, binding: DirectiveBinding<PermissionInput>): void {
  const userStore = useUserStore()
  const mode: Mode = binding.modifiers.disable ? 'disable' : 'remove'
  resolve(el, userStore.hasPermission(binding.value), mode)
}

/**
 * 按钮级权限。
 *
 * ```vue
 * <AppButton v-permission="'user:create'">新增用户</AppButton>
 * <AppButton v-permission="['order:refund', 'order:update']">退款</AppButton>
 * <AppButton v-permission.disable="'user:delete'">删除</AppButton>
 * ```
 */
export const vPermission: Directive<PermissionEl, PermissionInput> = {
  mounted: check,
  updated(el, binding) {
    if (binding.value !== binding.oldValue) check(el, binding)
  },
}

/** 角色级显示控制：`v-role="['super_admin']"` */
export const vRole: Directive<PermissionEl, RoleKey | RoleKey[]> = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
    resolve(el, userStore.hasRole(roles), binding.modifiers.disable ? 'disable' : 'remove')
  },
}
