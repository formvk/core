import { shallowRef } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } = createDecoratorSymbol('Ref')

export function Ref<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const { addInitializer } = context

  addInitializer(function (this: This) {
    const initialValue = target.get.call(this)
    setDecoratorSymbolByName(this, context.name, shallowRef(initialValue))
  })

  return {
    set(this, value) {
      setDecoratorSymbolValue(this, context.name, value)
    },
    get(this) {
      return getDecoratorSymbolValue(this, context.name)
    },
  }
}
