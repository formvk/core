import type { Ref } from '@vue/reactivity'

export function createDecoratorSymbol(name: string) {
  const decoratorSymbol = Symbol(name)
  const getDecoratorSymbol = (target: any): Map<any, Ref<any>> => {
    let refSymbol = target[decoratorSymbol]
    if (!refSymbol) {
      refSymbol = new Map()
      target[decoratorSymbol] = refSymbol
    }
    return refSymbol
  }

  const setDecoratorSymbolByName = (target: any, name: string | symbol, value: Ref<any>) => {
    const refSymbol = getDecoratorSymbol(target)
    refSymbol.set(name, value)
  }

  const getDecoratorSymbolValue = (target: any, name: string | symbol) => {
    const valueRef = getDecoratorSymbol(target).get(name)
    if (!valueRef) {
      throw new Error(`Symbol ${name.toString()} not found in ${target}`)
    }
    return valueRef.value
  }

  const setDecoratorSymbolValue = (target: any, name: string | symbol, value: any) => {
    const valueRef = getDecoratorSymbol(target).get(name)
    if (!valueRef) {
      throw new Error(`Symbol ${name.toString()} not found in ${target}`)
    }
    valueRef.value = value
  }
  return {
    setDecoratorSymbolByName,
    getDecoratorSymbolValue,
    setDecoratorSymbolValue,
  }
}
