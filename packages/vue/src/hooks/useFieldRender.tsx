import { isVoidField, type GeneralField, type IFieldProps, type IVoidFieldProps } from '@formvk/core'
import { each, FormPath } from '@formvk/shared'
import type { Ref } from 'vue'
import { computed, shallowRef, unref, watch } from 'vue'
import { getPropsTransformer, getReadPrettyInfo, getValueProp, isVueOptions, mergeRender } from '../shared'
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
    slots[slotName]?.({ field, form: field.form, ...params }) ?? []

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
export function useFieldRender(fieldType: FieldType | Ref<FieldType>, fieldProps: Ref<IFieldProps | IVoidFieldProps>) {
  const formRef = useForm()
  const parentRef = useField<GeneralField | null>()
  const createField = (): GeneralField => {
    const props = fieldProps.value
    if (!props.name) return null!
    const form = formRef.value
    const parent = parentRef.value
    const type = unref(fieldType)
    const fn = `create${type}` as const
    const field = form[fn]({
      ...props,
      basePath: props.basePath ?? parent?.address,
    })
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

  const getComponents = (componentType: any) => {
    const options = optionsRef.value
    const components = options?.components || {}
    if (typeof componentType !== 'string') {
      return componentType
    }
    return FormPath.getIn(components, componentType) ?? componentType
  }

  const valueRef = computed({
    get() {
      if (isVoidField(fieldRef.value)) {
        return
      }

      return fieldRef.value.value
    },
    set(value: any) {
      if (isVoidField(fieldRef.value)) {
        return
      }

      fieldRef.value.onInput(value)
    },
  })

  return (slots: any) => {
    const field = fieldRef.value
    if (!field?.visible) {
      return null
    }

    const mergedSlots = mergeSlots(field, slots, field.content)

    const renderDecorator = (childNodes: any) => {
      if (!field.decoratorType) {
        return childNodes
      }
      const Decorator = getComponents(field.decoratorType)
      const decoratorProps = field.decorator[1]

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
        return mergedSlots.default?.()
      }

      let Component = getComponents(field.componentType)
      const valueProp = getValueProp(Component)

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

      each(componentProps, (value, eventKey) => {
        const atEvent = eventKey.startsWith('@')
        if (!atEvent) return
        if (atEvent) {
          componentProps[transformEventName(eventKey)] = value
          delete componentProps[eventKey]
        }
      })

      if (isVoidField(field)) {
        return <Component {...componentProps} v-slots={mergedSlots} />
      }

      const getModifiers = () => {
        const modifiers = field.modifiers
        if (!modifiers) return
        return modifiers.reduce((prev, next) => {
          prev[next] = true
          return prev
        }, {})
      }

      return (
        <Component
          {...componentProps}
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          {...{
            [valueProp]: valueRef.value,
            [`onUpdate:${valueProp}`]: (value: any) => {
              valueRef.value = value
            },
            [`${valueProp}Modifiers`]: getModifiers(),
          }}
          v-slots={mergedSlots}
        />
      )
    }

    const nodes = renderComponent()

    return renderDecorator(nodes)
  }
}
