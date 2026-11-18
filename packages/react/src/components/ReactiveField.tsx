import { isVoidField } from '@formvk/core'
import type { GeneralField, IFieldFactoryProps } from '@formvk/core'
import { Tracker, toJS, untracked } from '@formvk/reactive'
import { observer } from '@formvk/reactive-react'
import { FormPath, each, isFn, isStr } from '@formvk/shared'
import { createElement, isValidElement, useContext, useEffect, useMemo, useReducer } from 'react'
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

  const factoryProps = (fieldProps ?? {}) as IFieldFactoryProps<any, any>
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0)

  // 字段地址只由 basePath 与 name 决定，二者引用稳定后地址字符串也稳定
  const identifier = useMemo(
    () =>
      FormPath.parse(factoryProps.basePath ?? parent?.address)
        .concat(factoryProps.name)
        .toString(),
    [fieldProps, parent]
  )

  // 渲染期按地址取当前字段实例；读取放在 untracked 中，
  // 因为新建字段会写入 fields，不能让这次读取把自身登记成订阅者而在渲染期反向更新。
  const addressField = form ? untracked(() => form.fields[identifier]) : undefined

  // 与 Vue 侧 watch(fieldProps) 重建对齐：地址上没有实例时（首次渲染 / 新增行）才创建
  const field = useMemo(() => {
    if (addressField) return addressField
    return (form as any)?.[`create${fieldType}`]?.({
      ...factoryProps,
      basePath: factoryProps.basePath ?? parent?.address,
    }) as GeneralField | undefined
  }, [addressField, form, fieldType, fieldProps, parent, identifier])

  // fields 是浅响应式的地址表：数组迁移会把同一地址上的字段换成另一个实例。
  // 按地址精确订阅，只有该地址上的实例被替换或删除时才重渲染，不依赖全局版本号。
  // 新建（undefined → 实例）不触发重渲染：实例就是本次渲染刚创建的；
  // hotReload 重挂载时旧订阅者仍可能收到新建通知，跳过可避免渲染期跨组件更新告警。
  useEffect(() => {
    if (!form || !identifier) return
    let last: GeneralField | undefined = form.fields[identifier]
    const tracker = new Tracker(() => {
      const next: GeneralField | undefined = form.fields[identifier]
      const isCreate = last === undefined && next !== undefined
      last = next
      if (!isCreate) forceUpdate()
    })
    tracker.track(() => form.fields[identifier])
    return () => tracker.dispose()
  }, [form, identifier])

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
        // 原生标签不接收具名 props，所有插槽内容拍平成 children
        const slotChildren = Object.keys(mergedSlots).flatMap(name => toArray(mergedSlots[name]))
        return createElement(Component, componentProps, ...slotChildren)
      }
      // React 组件：具名插槽拍平为同名 props，default 作为 children 透传，不再注入 slots prop。
      // componentProps 为显式声明通道，与插槽同名时优先于插槽。
      const { default: defaultSlot, ...namedSlots } = mergedSlots
      return createElement(Component, { ...namedSlots, ...componentProps }, defaultSlot)
    }

    content = renderDecorator(renderComponent())
  }

  return <FieldContext.Provider value={field}>{content}</FieldContext.Provider>
})

ReactiveField.displayName = 'ReactiveField'
