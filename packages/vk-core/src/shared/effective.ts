import { isFn, isValid } from '@formvk/shared'
import type { Form, LifeCycle } from '../models/types'
import { isForm } from './checkers'
import { GlobalState } from './constants'

export const createEffectContext = <T = any>(defaultValue?: T) => {
  let index: number
  return {
    provide(value?: T) {
      if (GlobalState.effectStart) {
        index = GlobalState.context.length
        GlobalState.context[index] = isValid(value) ? value : defaultValue
      } else {
        throw new Error('Provide method cannot be used in asynchronous function body')
      }
    },
    consume(): T {
      if (!GlobalState.effectStart) {
        throw new Error('Consume method cannot be used in asynchronous function body')
      }
      return GlobalState.context[index]
    },
  }
}

const FormEffectContext = createEffectContext<Form>()

export const runEffects = <Context>(context: Context, ...args: ((context: Context) => void)[]): LifeCycle[] => {
  GlobalState.lifecycles = []
  GlobalState.context = []
  GlobalState.effectStart = true
  GlobalState.effectEnd = false
  if (isForm(context)) {
    FormEffectContext.provide(context)
  }
  args.forEach(effects => {
    if (isFn(effects)) {
      effects(context)
    }
  })
  GlobalState.context = []
  GlobalState.effectStart = false
  GlobalState.effectEnd = true
  return GlobalState.lifecycles
}
