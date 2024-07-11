import { ShallowRef, shallowRef } from '@vue/reactivity'

export function Ref<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  { kind, addInitializer }: ClassAccessorDecoratorContext<This, Value>
) {
  if (kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }
  let valueRef: ShallowRef<Value>
  addInitializer(function (this: This) {
    const initialValue = target.get.call(this)
    valueRef = shallowRef<Value>(initialValue)
  })

  return {
    get(this: This) {
      return valueRef.value
    },
    set(value: Value) {
      valueRef.value = value
    },
  }
}
