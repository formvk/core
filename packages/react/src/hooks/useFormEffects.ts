import type { Form } from '@formvk/core'
import { uid } from '@formvk/shared'
import { useEffect } from 'react'

import { useForm } from './useForm'

export function useFormEffects(effects?: (form: Form) => void): void {
  const form = useForm()

  useEffect(() => {
    if (!form || !effects) return
    const id = uid()
    form.addEffects(id, effects)
    return () => {
      // 捕获注册时的 form，避免 form 替换后清理到了新实例上
      form.removeEffects(id)
    }
  }, [form, effects])
}
