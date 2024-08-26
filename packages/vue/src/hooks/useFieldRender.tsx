import { each, FormPath } from '@formvk/shared'
import { isVoidField, type GeneralField, type IFieldProps, type IVoidFieldProps } from '@formvk/vk-core'
import type { ComputedRef, Ref } from 'vue'
import { computed, shallowRef, unref, watch } from 'vue'
import { getPropsTransformer, getReadPrettyInfo, isVueOptions, mergeRender } from '../shared'
import { useAttach } from './useAttach'
import { provideField, useField } from './useField'
import { useForm } from './useForm'
import { useSchemaOptions } from './useSchemaOptions'

const mergeSlots = (
  field: GeneralField,
  slots: Record<string, any>,
  content: any
): Record<string, (...args: any) => any> => {
  const slotNames = Object.keys(slots)
  if (!slotNames.length) {
    if (!content) {
      return {}
    }
    if (typeof content === 'string') {
      return {
        default: () => content,
      }
    }
  }
  const patchSlot = (slotName: string) => (params: any) =>
    slots[slotName]?.({ field, form: field.form, ...params[0] }) ?? []

  const patchedSlots: Record<string, (...args: any) => any> = {}
  slotNames.forEach(name => {
    patchedSlots[name] = patchSlot(name)
  })

  // for named slots
  if (content && typeof content === 'object' && !isVueOptions(content)) {
    Object.keys(content).forEach(key => {
      const child = content[key]
      const slot = patchedSlots[key] ?? (() => [])
      patchedSlots[key] = mergeRender(slot, child)
    })
    return patchedSlots
  }
  // maybe default slot is empty
  patchedSlots['default'] = mergeRender(patchedSlots['default'] ?? (() => []), content)
  return patchedSlots
}

const transformEventName = (eventKey: string) => {
  const eventName = eventKey.slice(1)
  return `on${eventName[0].toUpperCase()}${eventName.slice(1)}`
}

export type FieldType = 'Field' | 'ArrayField' | 'ObjectField' | 'VoidField'

/**
 * @param options 响应式字段选项
 */
export function useFieldRender(
  fieldType: FieldType | Ref<FieldType>,
  fieldProps: ComputedRef<IFieldProps | IVoidFieldProps>,
  slots: Record<string, any>
) {
  const formRef = useForm()
  const parentRef = useField<GeneralField | null>()
  const createField = (): GeneralField => {
    const form = formRef.value
    const parent = parentRef.value
    const type = unref(fieldType)
    const fn = `create${type}` as const
    const props = fieldProps.value
    const field = form[fn]({
      ...props,
      basePath: props.basePath ?? parent?.address,
    })
    console.log('field', field)
    return field
  }

  const fieldRef = shallowRef(createField())
  watch(
    () => [unref(fieldType), fieldProps.value],
    () => (fieldRef.value = createField())
  )

  provideField(fieldRef)
  useAttach(fieldRef)
  const optionsRef = useSchemaOptions()

  const componentProps = computed(() => {
    const field = fieldRef.value
    return field?.componentProps
  })

  return () => {
    const field = fieldRef.value
    if (!field?.visible) {
      return null
    }
    console.log('renderField', field)

    const mergedSlots = mergeSlots(field, slots, field.content)

    const options = optionsRef.value

    const components = options?.components || {}

    const getComponents = (componentType: any) => {
      if (typeof componentType !== 'string') {
        return componentType
      }
      return FormPath.getIn(components, componentType) ?? field.componentType
    }

    const renderDecorator = (childNodes: any[]) => {
      if (!field.decoratorType) {
        return <>{childNodes}</>
      }
      const Decorator = getComponents(field.decoratorType)
      const decoratorProps = field.decorator[1]
      console.log('decoratorProps', field.decorator[1])

      each(decoratorProps, (value, eventKey) => {
        const atEvent = eventKey.startsWith('@')
        if (!atEvent) return
        if (atEvent) {
          decoratorProps[transformEventName(eventKey)] = value
          delete decoratorProps[eventKey]
        }
      })

      return <Decorator {...decoratorProps}>{childNodes}</Decorator>
    }

    const renderComponent = () => {
      if (!field.componentType) {
        return <>{mergedSlots?.default?.()}</>
      }

      let Component = getComponents(field.componentType)
      let componentProps = { ...field.component[1] }

      const readPrettyInfo = getReadPrettyInfo(Component)
      if (field.readPretty && readPrettyInfo.component) {
        Component = readPrettyInfo.component
        componentProps = {
          ...componentProps,
          ...readPrettyInfo.props,
        }
      }
      const propsTransformer = getPropsTransformer(Component)

      if (propsTransformer) {
        componentProps = propsTransformer(componentProps, field)
      }

      const originChange = componentProps['@change'] || componentProps['onChange']
      const originFocus = componentProps['@focus'] || componentProps['onFocus']
      const originBlur = componentProps['@blur'] || componentProps['onBlur']

      each(componentProps, (value, eventKey) => {
        const atEvent = eventKey.startsWith('@')
        if (!atEvent) return
        if (atEvent) {
          componentProps[transformEventName(eventKey)] = value
          delete componentProps[eventKey]
        }
      })

      if (!isVoidField(field)) {
        componentProps.onChange = (...args: any[]) => {
          field.onInput(...args)
          originChange?.(...args)
        }
        componentProps.onFocus = (...args: any[]) => {
          field.onFocus(...args)
          originFocus?.(...args)
        }
        componentProps.blur = (...args: any[]) => {
          field.onBlur(...args)
          originBlur?.(...args)
        }
      }

      return (
        <Component
          {...componentProps}
          value={!isVoidField(field) ? field.value : componentProps.value}
          v-slots={mergedSlots}
        />
      )
    }

    return (
      <>
        {componentProps.value.msg}
        {renderDecorator([renderComponent()])}
      </>
    )
  }
}
