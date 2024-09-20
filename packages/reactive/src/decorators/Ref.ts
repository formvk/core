import { shallowRef } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } = createDecoratorSymbol('Ref')

export function Ref<This, Value>(
  _: ClassAccessorDecoratorTarget<This, Value>,
  { kind, name }: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  if (kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  return {
    init(this, value) {
      setDecoratorSymbolByName(this, name, shallowRef(value))

      return value
    },
    set(this, value) {
      setDecoratorSymbolValue(this, name, value)
    },
    get(this) {
      return getDecoratorSymbolValue(this, name)
    },
  }
}
