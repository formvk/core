import { isFn } from '@formvk/shared'
import type { DefineComponent } from 'vue'
import { isVNode, toRaw } from 'vue'
import type { SlotTypes } from './types'

export const resolveComponent = (child?: SlotTypes, props?: Record<string, any>) => {
  if (child) {
    if (typeof child === 'string' || typeof child === 'number') {
      return child
    } else if (isVNode(child)) {
      return child
    } else {
      const Com = toRaw(child as DefineComponent)
      return <Com {...props} />
    }
  }

  return null
}

export const resolveSlot = (slots: any, props: Record<string, any>, name: string) => {
  const _slot = slots[name]
  if (isFn(_slot)) {
    return _slot(props)
  }

  return props[name] ?? null
}
