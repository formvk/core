import { shallowReactive, shallowRef, ShallowRef } from '@vue/reactivity'

function isObj(val: any): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function Shallow<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value> | undefined,
  context: ClassFieldDecoratorContext<This, Value> | ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> | void {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }
  const { addInitializer } = context
  let valueRef: ShallowRef<Value>

  addInitializer(function (this: This) {
    const initialValue = target!.get.call(this)
    valueRef = shallowRef(isObj(initialValue) ? shallowReactive(initialValue) : initialValue)
  })

  return {
    set(value) {
      valueRef.value = isObj(value) ? shallowReactive(value) : value
    },
    get(this) {
      return valueRef.value
    },
  }
}
