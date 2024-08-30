import { shallowReactive, shallowRef } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } = createDecoratorSymbol('Shallow')
export function Shallow<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const { addInitializer } = context

  const getValue = (value: Value) => {
    if (value && typeof value === 'object') {
      return shallowReactive(value)
    } else {
      return value
    }
  }

  addInitializer(function (this: This) {
    const initialValue = target.get.call(this)

    setDecoratorSymbolByName(this, context.name, shallowRef(getValue(initialValue)))
  })

  return {
    set(value) {
      setDecoratorSymbolValue(this, context.name, getValue(value))
    },
    get(this) {
      return getDecoratorSymbolValue(this, context.name)
    },
  }
}
