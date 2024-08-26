import { computed } from '@vue/reactivity'

export function Computed<This, Value>(getter: () => Value, { kind }: ClassGetterDecoratorContext<This, Value>) {
  if (kind !== 'getter') {
    throw new Error(`Invalid context, expected getter`)
  }
  let instance: This

  const computedRef = computed(() => {
    return getter.call(instance)
  })
  return function (this: This) {
    if (!instance) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      instance = this
    }

    return computedRef.value
  }
}
