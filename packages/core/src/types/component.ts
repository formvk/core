export type JSXComponent = any

export type FieldComponent<Component extends JSXComponent, ComponentProps = any> =
  | [Component]
  | [Component, ComponentProps]
  | boolean
  | any[]

export type FieldDecorator<Decorator extends JSXComponent, ComponentProps = any> =
  | [Decorator]
  | [Decorator, ComponentProps]
  | boolean
  | any[]
