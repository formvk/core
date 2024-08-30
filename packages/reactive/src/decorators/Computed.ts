import { computed } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, getDecoratorSymbolValue } = createDecoratorSymbol('Shallow')

export function Computed<This, Value>(
  getter: () => Value,
  { kind, addInitializer, name }: ClassGetterDecoratorContext<This, Value>
) {
  if (kind !== 'getter') {
    throw new Error(`Invalid context, expected getter`)
  }

  addInitializer(function (this: This) {
    setDecoratorSymbolByName(
      this,
      name,
      computed(() => {
        return getter.call(this)
      })
    )
  })

  return function (this: This) {
    return getDecoratorSymbolValue(this, name)
  }
}
