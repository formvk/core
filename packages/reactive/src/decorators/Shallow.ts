import { shallowReactive, shallowRef } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } = createDecoratorSymbol('Shallow')
export function Shallow<This, Value>(
  _: ClassAccessorDecoratorTarget<This, Value>,
  { kind, name }: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  if (kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const getValue = (value: Value) => {
    if (value && typeof value === 'object') {
      return shallowReactive(value)
    } else {
      return value
    }
  }

  return {
    init(this, value) {
      setDecoratorSymbolByName(this, name, shallowRef(getValue(value)))
      return value
    },
    set(value) {
      setDecoratorSymbolValue(this, name, getValue(value))
    },
    get(this) {
      return getDecoratorSymbolValue(this, name)
    },
  }
}
