import type { ShallowRef as VueShallowRef } from '@vue/reactivity'
import { shallowRef } from '@vue/reactivity'

export function Ref<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const { addInitializer } = context
  let valueRef: VueShallowRef<Value>

  addInitializer(function (this: This) {
    const initialValue = target!.get.call(this)
    valueRef = shallowRef<Value>(initialValue)
  })

  return {
    set(this, value) {
      target!.set.call(this, value)
      const newValue = target!.get.call(this)
      valueRef.value = newValue
    },
    get(this) {
      return valueRef.value
    },
  }
}
