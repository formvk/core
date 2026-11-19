import { isVoidField } from '@formvk/core'
import type { GeneralField, IFieldFactoryProps } from '@formvk/core'
import { toJS } from '@formvk/reactive'
import { FormPath, each, isFn, isStr } from '@formvk/shared'
import {
  Fragment,
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  provide,
  ref,
  shallowRef,
  vModelDynamic,
  watch,
  withDirectives,
} from 'vue'
import type { Directive, Ref, VNode } from 'vue'

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

// 原生标签没有组件的 props/emits，v-model 需要手动挂运行时指令，
// 才能获得 IME 拼字、type=number 转换等与模板编译一致的行为。
// vModelDynamic 会在运行时按元素标签与 type 选择对应的具体指令。
const nativeModelTags = new Set(['input', 'select', 'textarea'])

function resolveNativeModelDirective(tag: string, props: Record<string, any>): Directive | null {
  const normalizedTag = tag.toLowerCase()
  if (!nativeModelTags.has(normalizedTag)) return null
  // file input 的 value 只读：Vue 编译器直接禁止 v-model，运行时挂指令会在赋值时抛错
  if (normalizedTag === 'input' && props.type === 'file') return null
  return vModelDynamic as Directive
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

    function getFieldProps() {
      return ((props as IReactiveFieldProps).fieldProps ?? {}) as IFieldFactoryProps<any, any>
    }

    function createField(): GeneralField {
      const fieldType = (props as IReactiveFieldProps).fieldType ?? 'Field'
      const fieldProps = getFieldProps()
      return (formRef.value as any)?.[`create${fieldType}`]?.({
        ...fieldProps,
        basePath: fieldProps.basePath ?? parentRef.value?.address,
      })
    }

    function resolveFieldAddress() {
      const fieldProps = getFieldProps()
      return FormPath.parse(fieldProps.basePath ?? parentRef.value?.address)
        .concat(fieldProps.name)
        .toString()
    }

    const addressRef = computed(resolveFieldAddress)

    const fieldRef = shallowRef(createField()) as Ref<GeneralField>
    watch(
      () => props.fieldProps,
      () => {
        fieldRef.value = createField()
      }
    )
    // fields 是浅响应式的地址表：数组迁移会把同一地址上的字段换成另一个实例（字段实例随行移动，被删行销毁）。
    // 这里只负责兜底重建；实例替换不再回写 fieldRef，由下方派生 computed 在渲染期直接读取。
    watch(
      () => formRef.value?.fields[addressRef.value],
      next => {
        if (!next) fieldRef.value = createField()
      },
      { flush: 'post' }
    )
    // 渲染与生命周期使用派生实例：读地址表会让渲染 effect 自然订阅该地址键，
    // 实例被替换时第一趟渲染就拿到新实例，省掉 post watcher 纠正的第二趟。
    // 地址上没有实例时才回退到 fieldRef（创建字段有副作用，不能放进 computed）。
    const currentFieldRef = computed(() => formRef.value?.fields[addressRef.value] ?? fieldRef.value)
    useAttach(currentFieldRef)
    provide(FieldSymbol, currentFieldRef)

    // v-model 的读写统一收口在 setup 层，渲染函数只负责把当前 schema 声明的
    // update:modelValue 处理器记录下来，供 setter 写回字段后继续调用。
    let modelUpdateHandler: ((...args: any[]) => void) | undefined
    const modelRef = computed({
      get: () => {
        const field = currentFieldRef.value
        return field && !isVoidField(field) ? field.value : undefined
      },
      set: value => {
        const field = currentFieldRef.value
        if (!field || isVoidField(field)) return
        field.onInput(value)
        modelUpdateHandler?.(value)
      },
    })

    return () => {
      const field = currentFieldRef.value
      const options = optionsRef.value
      if (!field) return slots.default?.()
      if (field.display !== 'visible') return null

      const mergedSlots = mergeSlots(field, slots, field.content)

      function renderDecorator(children: VNode | VNode[] | null) {
        if (!field.decoratorType) return wrapFragment(children)
        const Decorator = getRawComponent(options?.components, field.decoratorType)
        const { props: decoratorProps, events } = normalizeProps(toJS((field.decorator as any)[1]) || {})
        return <Decorator {...decoratorProps} {...toVueEventProps(events)} v-slots={{ default: () => children }} />
      }

      function renderComponent() {
        if (!field.componentType) return mergedSlots.default?.() ?? null

        const Component = getRawComponent(options?.components, field.componentType)
        const { props: originProps, events } = normalizeProps(toJS((field.component as any)[1]) || {})
        // Vue 侧统一使用 v-model 契约：modelValue + update:modelValue
        const originFocus = events.focus
        const originBlur = events.blur

        events.focus = (...args: any[]) => {
          if (!isVoidField(field)) field.onFocus(...args)
          originFocus?.(...args)
        }
        events.blur = (...args: any[]) => {
          if (!isVoidField(field)) field.onBlur(...args)
          originBlur?.(...args)
        }

        // 写回统一走 v-model 的 setter；schema 里声明的 update:modelValue 也在 setter 中触发
        const originModelUpdate = events['update:modelValue']
        delete events['update:modelValue']

        const componentProps: Record<string, any> = {
          ...(isVoidField(field)
            ? {}
            : {
                disabled: field.pattern === 'disabled' || field.pattern === 'readPretty',
                readOnly: field.pattern === 'readOnly',
              }),
          ...originProps,
          ...toVueEventProps(events),
        }

        const children = Object.keys(mergedSlots).map(name => mergedSlots[name]?.())

        // void 字段不绑定值，只保留 schema 声明的处理器
        if (isVoidField(field)) {
          if (originModelUpdate) componentProps['onUpdate:modelValue'] = originModelUpdate
          if (isStr(Component)) return h(Component, componentProps, children)
          return <Component {...componentProps} v-slots={mergedSlots} />
        }

        // 渲染只记录当前字段的处理器，读写统一走 setup 层的 modelRef
        modelUpdateHandler = originModelUpdate

        if (isStr(Component)) {
          // 原生标签手动挂 v-model 指令，与模板编译产物保持一致
          const directive = resolveNativeModelDirective(Component, componentProps)
          if (directive) {
            const nativeProps = {
              ...componentProps,
              'onUpdate:modelValue': (value: any) => {
                modelRef.value = value
              },
            }
            return withDirectives(h(Component, nativeProps, children), [[directive, modelRef.value]])
          }
          // file input 的 value 只读，不注入值也不写回
          if (Component.toLowerCase() === 'input') return h(Component, componentProps, children)
          // 其余字符串标签（自定义元素等）没有 v-model 语义，保留 value + change 兼容契约
          const originChange = componentProps.onChange
          componentProps.value = modelRef.value
          componentProps.onChange = (event: any) => {
            modelRef.value = event
            originChange?.(event)
          }
          return h(Component, componentProps, children)
        }

        return <Component {...componentProps} v-model={modelRef.value} v-slots={mergedSlots} />
      }

      return renderDecorator(renderComponent())
    }
  },
})
