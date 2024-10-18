import { ref } from '../reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } =
  createDecoratorSymbol('Observable')

export function Observable<This, Value>(
  { get }: ClassAccessorDecoratorTarget<This, Value>,
  { kind, name, g }: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> {
  if (kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  return {
    init(this, value) {
      return ref(value) as any
    },
    set(this, value) {
      get.call(this).value = value
      // setDecoratorSymbolValue(this, name, value)
    },
    get(this) {
      return get.call(this).value
      getDecoratorSymbolValue(this, name)
    },
  }
}
