export interface IChange {
  type: 'add' | 'set' | 'delete'
  key: PropertyKey
  value?: any
  oldValue?: any
  /** 内层 Vue reactive 对象，即变更发生的那个对象 */
  target: any
  /** 相对当前观察者视角的路径 */
  path: PropertyKey[]
}

export type Observer = (change: IChange) => void
