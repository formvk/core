import { isVoidField } from '@formvk/core'
import type { GeneralField, IFieldFactoryProps } from '@formvk/core'
import { toJS } from '@formvk/reactive'
import { each, isFn, isStr } from '@formvk/shared'
import { Fragment, defineComponent, h, inject, isVNode, provide, ref, shallowRef, watch } from 'vue'
import type { Ref, VNode } from 'vue'

import { useAttach } from '../hooks/useAttach'
import { useField } from '../hooks/useField'
import { useForm } from '../hooks/useForm'
import { FieldSymbol, SchemaOptionsSymbol } from '../shared/context'
import type { IReactiveFieldProps, ISchemaFieldRuntimeOptions } from '../types'
import { getRawComponent } from '../utils/getRawComponent'

type SlotFn = (props?: any) => any

function isVueComponentLike(value: any): boolean {
  if (!value) return false
  if (isFn(value)) return true
  return typeof value === 'object' && (isFn(value.setup) || isFn(value.render) || isStr(value.template))
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value
  return value === undefined || value === null ? [] : [value]
}

function wrapFragment(child: VNode | VNode[] | null): VNode | VNode[] | null {
  if (Array.isArray(child)) {
    if (child.length > 1) return h(Fragment, null, child)
    return child[0] ?? null
  }
  return child
}

function renderContent(content: any): any {
  if (isVNode(content) || isStr(content)) return content
  if (isVueComponentLike(content)) return h(content)
  return content
}

function mergeSlots(field: GeneralField, slots: Record<string, any>, content: any): Record<string, SlotFn> {
  const result: Record<string, SlotFn> = {}
  Object.keys(slots).forEach(name => {
    result[name] = (slotProps?: any) => slots[name]?.({ field, form: field.form, ...slotProps }) ?? []
  })

  if (!content) return result

  function appendToSlot(name: string, value: any) {
    const origin = result[name]
    result[name] = (slotProps?: any) => [...toArray(origin?.(slotProps)), ...toArray(renderContent(value))]
  }

  if (isStr(content) || isVNode(content) || isVueComponentLike(content)) {
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

function toVueEventProps(events: Record<string, any>) {
  const props: Record<string, any> = {}
  each(events, (handler, name) => {
    props[`on${name.charAt(0).toUpperCase()}${name.slice(1)}`] = handler
  })
  return props
}

export const ReactiveField = defineComponent({
  name: 'ReactiveField',
  inheritAttrs: false,
  props: {
    fieldType: {
      type: String,
      default: 'Field',
    },
    fieldProps: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { slots }) {
    const formRef = useForm()
    const parentRef = useField()
    const optionsRef = inject(SchemaOptionsSymbol, ref({})) as Ref<ISchemaFieldRuntimeOptions>

    function createField(): GeneralField {
      const fieldType = (props as IReactiveFieldProps).fieldType ?? 'Field'
      const fieldProps = ((props as IReactiveFieldProps).fieldProps ?? {}) as IFieldFactoryProps<any, any>
      return (formRef.value as any)?.[`create${fieldType}`]?.({
        ...fieldProps,
        basePath: fieldProps.basePath ?? parentRef.value?.address,
      })
    }

    const fieldRef = shallowRef(createField()) as Ref<GeneralField>
    watch(
      () => props.fieldProps,
      () => {
        fieldRef.value = createField()
      }
    )
    useAttach(fieldRef)
    provide(FieldSymbol, fieldRef)

    return () => {
      const field = fieldRef.value
      const options = optionsRef.value
      if (!field) return slots.default?.()
      if (field.display !== 'visible') return null

      const mergedSlots = mergeSlots(field, slots, field.content)

      function renderDecorator(children: VNode | VNode[] | null) {
        if (!field.decoratorType) return wrapFragment(children)
        const Decorator = getRawComponent(options?.components, field.decoratorType)
        const { props: decoratorProps, events } = normalizeProps(toJS((field.decorator as any)[1]) || {})
        return h(
          Decorator,
          { ...decoratorProps, ...toVueEventProps(events) },
          {
            default: () => children,
          }
        )
      }

      function renderComponent() {
        if (!field.componentType) return mergedSlots.default?.() ?? null

        const Component = getRawComponent(options?.components, field.componentType)
        const { props: originProps, events } = normalizeProps(toJS((field.component as any)[1]) || {})
        const originChange = events.change
        const originFocus = events.focus
        const originBlur = events.blur

        events.change = (...args: any[]) => {
          if (!isVoidField(field)) field.onInput(...args)
          originChange?.(...args)
        }
        events.focus = (...args: any[]) => {
          if (!isVoidField(field)) field.onFocus(...args)
          originFocus?.(...args)
        }
        events.blur = (...args: any[]) => {
          if (!isVoidField(field)) field.onBlur(...args)
          originBlur?.(...args)
        }

        const componentProps: Record<string, any> = {
          ...(isVoidField(field)
            ? {}
            : {
                disabled: field.pattern === 'disabled' || field.pattern === 'readPretty',
                readOnly: field.pattern === 'readOnly',
              }),
          ...originProps,
          ...(isVoidField(field) ? {} : { value: field.value }),
          ...toVueEventProps(events),
        }

        if (isStr(Component)) {
          return h(
            Component,
            componentProps,
            Object.keys(mergedSlots).map(name => mergedSlots[name]())
          )
        }
        return h(Component, componentProps, mergedSlots)
      }

      return renderDecorator(renderComponent())
    }
  },
})
