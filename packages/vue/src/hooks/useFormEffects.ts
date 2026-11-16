import type { Form } from '@formvk/core'
import { uid } from '@formvk/shared'
import { onBeforeUnmount, watchEffect } from 'vue'

import { useForm } from './useForm'

export function useFormEffects(effects?: (form: Form) => void): void {
  const formRef = useForm()

  const stop = watchEffect(onCleanup => {
    const form = formRef.value
    if (!form) return
    const id = uid()
    form.addEffects(id, effects)

    onCleanup(() => {
      // 捕获注册时的 form，避免 form 替换后清理到了新实例上
      form.removeEffects(id)
    })
  })

  onBeforeUnmount(() => stop())
}
