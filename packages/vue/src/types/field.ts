import type { FieldComponent, FieldDecorator, IFieldProps, IVoidFieldProps } from '@formvk/core'
import type { Component } from 'vue'

export type VueComponent = Component | Function

export type ComponentProps<T> = T extends { new (...args: any[]): infer R }
  ? Partial<R>
  : T extends (...args: any) => any
    ? Parameters<T>[0]
    : never

export type JSXComponent = any

export interface FieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> extends Exclude<IFieldProps<Decorator, Component, TextType, ValueType>, 'component' | 'decorator'> {
  decorator?: FieldDecorator<Decorator, ComponentProps<Decorator>>
  component?: FieldComponent<Component, ComponentProps<Component>>
}

export interface VoidFieldProps<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
> extends Exclude<IVoidFieldProps<Decorator, Component, TextType>, 'component' | 'decorator'> {
  decorator?: FieldDecorator<Decorator, ComponentProps<Decorator>>
  component?: FieldComponent<Component, ComponentProps<Component>>
}
