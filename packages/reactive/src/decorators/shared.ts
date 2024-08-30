export function createDecoratorSymbol(name: string) {
  const decoratorSymbol = Symbol(name)
  const getDecoratorSymbol = (target: any): Map<any, any> => {
    let refSymbol = target[decoratorSymbol]
    if (!refSymbol) {
      refSymbol = new Map()
      target[decoratorSymbol] = refSymbol
    }
    return refSymbol
  }

  const setDecoratorSymbolByName = (target: any, name: string | symbol, value: any) => {
    const refSymbol = getDecoratorSymbol(target)
    refSymbol.set(name, value)
  }

  const getDecoratorSymbolValue = (target: any, name: string | symbol) => {
    const refSymbol = getDecoratorSymbol(target)
    return refSymbol.get(name).value
  }

  const setDecoratorSymbolValue = (target: any, name: string | symbol, value: any) => {
    const refSymbol = getDecoratorSymbol(target)
    refSymbol.get(name).value = value
  }
  return {
    setDecoratorSymbolByName,
    getDecoratorSymbolValue,
    setDecoratorSymbolValue,
  }
}
