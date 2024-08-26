import type { ShallowRef as VueShallowRef } from '@vue/reactivity'
import { shallowReactive, shallowRef } from '@vue/reactivity'

export function Shallow<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const { addInitializer } = context
  const valueRef = shallowRef() as VueShallowRef<Value>

  const setValue = (value: Value) => {
    if (value && typeof value === 'object') {
      valueRef.value = shallowReactive(value)
    } else {
      valueRef.value = value
    }
  }

  addInitializer(function (this: This) {
    const initialValue = target.get.call(this)
    setValue(initialValue)
  })

  return {
    set(value) {
      setValue(value)
    },
    get(this) {
      return valueRef.value
    },
  }
}
