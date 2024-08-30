import { ref } from '@vue/reactivity'
import { createDecoratorSymbol } from './shared'

const { setDecoratorSymbolByName, setDecoratorSymbolValue, getDecoratorSymbolValue } =
  createDecoratorSymbol('Observable')

export function Observable<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorTarget<This, Value> {
  if (context.kind !== 'accessor') {
    throw new Error(`Invalid context, expected accessor`)
  }

  const { addInitializer } = context

  addInitializer(function (this: This) {
    const initialValue = target!.get.call(this)
    setDecoratorSymbolByName(this, context.name, ref(initialValue))
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
