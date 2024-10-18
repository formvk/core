export type JSXComponent = any

export interface IModelSetter<P = any> {
  (setter: (state: P) => void): void
  (setter: Partial<P>): void
  (): void
}

export interface IModelGetter<P = any> {
  <Getter extends (state: P) => any>(getter: Getter): ReturnType<Getter>
  (): P
}
