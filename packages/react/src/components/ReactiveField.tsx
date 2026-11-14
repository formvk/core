import { isVoidField } from '@formvk/core'
import type { GeneralField, IFieldFactoryProps } from '@formvk/core'
import { toJS } from '@formvk/reactive'
import { observer } from '@formvk/reactive-react'
import { each, isFn, isStr } from '@formvk/shared'
import { createElement, isValidElement, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

import { useAttach } from '../hooks/useAttach'
import { useField } from '../hooks/useField'
import { useForm } from '../hooks/useForm'
import { FieldContext, SchemaOptionsContext } from '../shared/context'
import type { IReactiveFieldProps, ISchemaFieldRuntimeOptions } from '../types'
import { getRawComponent } from '../utils/getRawComponent'
import { toArray } from '../utils/slots'
import type { SlotMap } from '../utils/slots'

function isReactComponentLike(value: any): boolean {
  if (!value) return false
  if (isFn(value)) return true
  return typeof value === 'object' && ('$$typeof' in value || isFn(value.render))
}

function renderContent(content: any): ReactNode {
  if (isValidElement(content) || isStr(content)) return content
  if (isReactComponentLike(content)) return createElement(content)
  return content
}

/** 合并 RecursionField 生成的具名插槽与 schema 上的 content 声明。 */
function mergeSlots(slots: SlotMap, content: any): SlotMap {
  const result: SlotMap = { ...slots }

  if (!content) return result

  function appendToSlot(name: string, value: any) {
    const rendered = renderContent(value)
    const origin = result[name]
    result[name] = origin === undefined ? rendered : ([] as ReactNode[]).concat(toArray(origin), toArray(rendered))
  }

  if (isStr(content) || isValidElement(content) || isReactComponentLike(content)) {
    appendToSlot('default', content)
  } else if (typeof content === 'object') {
    // 普通对象视为具名插槽内容映射
    each(content, (value, key) => {
      appendToSlot(key, value)
    })
  }

  return result
}

function normalizeProps(origin: Record<string, any>) {
  const props: Record<string, any> = {}
  const events: Record<string, any> = {}
  each(origin, (value, key) => {
    if (key.startsWith('on')) {
      const eventName = `${key[2].toLowerCase()}${key.slice(3)}`
      events[eventName] = events[eventName] ?? value
    } else if (key.startsWith('@')) {
      events[key.slice(1)] = value
    } else {
      props[key] = value
    }
  })
  return { props, events }
}

function toReactEventProps(events: Record<string, any>) {
  const props: Record<string, any> = {}
  each(events, (handler, name) => {
    props[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = handler
  })
  return props
}

export const ReactiveField = observer((props: IReactiveFieldProps) => {
  const form = useForm()
  const parent = useField()
  const options = useContext(SchemaOptionsContext) as ISchemaFieldRuntimeOptions | undefined

  const { fieldType = 'Field', fieldProps, slots: incomingSlots, children } = props

  // 与 Vue 侧 watch(fieldProps) 重建对齐：fieldProps 引用变化即创建新字段，旧实例由 useAttach 卸载
  const field = useMemo(() => {
    const factoryProps = (fieldProps ?? {}) as IFieldFactoryProps<any, any>
    return (form as any)?.[`create${fieldType}`]?.({
      ...factoryProps,
      basePath: factoryProps.basePath ?? parent?.address,
    }) as GeneralField | undefined
  }, [form, fieldType, fieldProps, parent])

  useAttach(field)

  let content: ReactNode = null

  if (!field) {
    content = children ?? null
  } else if (field.display !== 'visible') {
    content = null
  } else {
    const mergedSlots = mergeSlots(incomingSlots ?? {}, field.content)

    function renderDecorator(inner: ReactNode) {
      if (!field!.decoratorType) return inner
      const Decorator = getRawComponent(options?.components, field!.decoratorType)
      const { props: decoratorProps, events } = normalizeProps(toJS((field!.decorator as any)[1]) || {})
      return createElement(Decorator, { ...decoratorProps, ...toReactEventProps(events) }, inner)
    }

    function renderComponent(): ReactNode {
      if (!field!.componentType) return mergedSlots.default ?? null

      const Component = getRawComponent(options?.components, field!.componentType)
      const { props: originProps, events } = normalizeProps(toJS((field!.component as any)[1]) || {})
      const originChange = events.change
      const originFocus = events.focus
      const originBlur = events.blur

      events.change = (...args: any[]) => {
        if (!isVoidField(field!)) field!.onInput(...args)
        originChange?.(...args)
      }
      events.focus = (...args: any[]) => {
        if (!isVoidField(field!)) field!.onFocus(...args)
        originFocus?.(...args)
      }
      events.blur = (...args: any[]) => {
        if (!isVoidField(field!)) field!.onBlur(...args)
        originBlur?.(...args)
      }

      const componentProps: Record<string, any> = {
        ...(isVoidField(field!)
          ? {}
          : {
              disabled: field!.pattern === 'disabled' || field!.pattern === 'readPretty',
              readOnly: field!.pattern === 'readOnly',
            }),
        ...originProps,
        ...(isVoidField(field!) ? {} : { value: field!.value }),
        ...toReactEventProps(events),
      }

      if (isStr(Component)) {
        // 原生标签不接收 slots 对象，所有具名插槽拍平成 children
        const slotChildren = Object.keys(mergedSlots).flatMap(name => toArray(mergedSlots[name]))
        return createElement(Component, componentProps, ...slotChildren)
      }
      // React 组件通过 props.slots 读取具名插槽，default 同时作为 children 透传
      return createElement(Component, { ...componentProps, slots: mergedSlots }, mergedSlots.default)
    }

    content = renderDecorator(renderComponent())
  }

  return <FieldContext.Provider value={field}>{content}</FieldContext.Provider>
})

ReactiveField.displayName = 'ReactiveField'
