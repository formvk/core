import { ref, Ref } from '@vue/reactivity'

export function Reactive<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }
  const { addInitializer } = context
  let valueRef: Ref<Value>

  addInitializer(function (this: This) {
    const initialValue = target.get.call(this)
    valueRef = ref(initialValue)
  })

  return {
    set(value) {
      valueRef.value = value
    },
    get(this) {
      return valueRef.value
    },
  }
}
