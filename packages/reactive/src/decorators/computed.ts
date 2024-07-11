import { computed, ComputedRef } from '@vue/reactivity'

export function Computed<This, Value>(
  getter: () => Value,
  { kind, addInitializer }: ClassGetterDecoratorContext<This, Value>
) {
  if (kind !== 'getter') {
    throw new Error(`Invalid context, expected getter`)
  }

  let computedRef: ComputedRef<Value>

  addInitializer(function (this: This) {
    computedRef = computed(() => {
      return getter.call(this)
    })
  })

  return function (this: This) {
    return computedRef.value
  }
}
