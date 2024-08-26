export type OperationType = 'add' | 'delete' | 'clear' | 'set' | 'get' | 'iterate' | 'has'
export interface IOperation {
  target?: any
  oldTarget?: any
  key?: PropertyKey
  value?: any
  oldValue?: any
  type?: OperationType
  receiver?: any
}

/**
 * 使用 @vue/reactivity 中的方法，实现对对象的观察
 * @param target 要观察的对象
 * @param observer 当对象发生变化时的回调函数 且知道对对象的变化进行了什么操作
 * @param deep 是否深度观察
 * @returns
 */
export function observe(target: object, observer: (operation: IOperation) => void, deep = false) {
  deep
  return () => {}
}
