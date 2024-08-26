import type { Field } from '@formvk/core'
import { useObserver } from '@formvk/reactive-vue'
import { isArr, isValid } from '@formvk/shared'
import { useField } from '@formvk/vue'
import type { CascaderProps, DatePickerProps, SelectProps, TimePickerProps, TreeSelectProps } from 'ant-design-vue'
import { Tag } from 'ant-design-vue'
import type { CascaderOptionType } from 'ant-design-vue/es/cascader'
import type { RangePickerProps } from 'ant-design-vue/es/date-picker'
import { computed, defineComponent } from 'vue'
import {
  createContext,
  formatDayjsValue,
  resolveComponent,
  resolveSlot,
  useContext,
  usePrefixCls,
} from '../__builtins__'
import { Space } from '../space'
import useStyle from './style'

const PlaceholderContext = createContext('N/A')

export const usePlaceholder = (value?: any) => {
  const placeholderCtx = useContext(PlaceholderContext)
  const placeholder = computed(() => {
    return isValid(value) && value !== '' ? value : resolveComponent(placeholderCtx.value) || 'N/A'
  })

  return placeholder
}

const Select = defineComponent({
  name: 'PreviewTextSelect',
  props: [],
  setup(_props, { attrs }) {
    useObserver()
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const fieldRef = useField<Field>()
    const props = attrs as unknown as SelectProps
    const placeholder = usePlaceholder()
    const getSelected = () => {
      const value = props.value
      if (props.mode === 'multiple' || props.mode === 'tags') {
        if (props.labelInValue) {
          return isArr(value) ? value : []
        }
        return isArr(value) ? value.map(val => ({ label: val, value: val })) : []
      } else {
        if (props.labelInValue) {
          return isValid(value) ? [value] : []
        }
        return isValid(value) ? [{ label: value, value }] : []
      }
    }

    const getLabels = () => {
      const field = fieldRef.value
      const selected = getSelected()
      const dataSource: any[] = field?.dataSource?.length
        ? field.dataSource
        : props?.options?.length
          ? props.options
          : []
      if (!selected.length) {
        return <Tag>{placeholder.value}</Tag>
      }
      return selected.map((target, key) => {
        const text = dataSource?.find(item => item.value == target?.value)?.label || target?.label
        return <Tag key={key}>{text || placeholder.value}</Tag>
      })
    }

    return () => {
      return wrapSSR(<Space class={[prefixCls, hashId.value]}>{getLabels()}</Space>)
    }
  },
})

const Input = defineComponent({
  name: 'PreviewTextInput',
  setup(_props, { attrs, slots }) {
    useObserver()
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)

    return () => {
      const placeholder = usePlaceholder(attrs.value)
      return wrapSSR(
        <Space class={[prefixCls, hashId.value]}>
          {resolveSlot(slots, attrs, 'prefix')}
          {resolveSlot(slots, attrs, 'addonBefore')}
          {placeholder.value}
          {resolveSlot(slots, attrs, 'addonAfter')}
          {resolveSlot(slots, attrs, 'suffix')}
        </Space>
      )
    }
  },
})

const Text = defineComponent({
  name: 'PreviewText',
  setup(_props, { attrs }) {
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const placeholder = usePlaceholder()

    return () => {
      return wrapSSR(<div class={[prefixCls, hashId.value]}>{placeholder.value}</div>)
    }
  },
})

export type PreviewCascaderProps = CascaderProps & {
  options: CascaderOptionType[]
}
const Cascader = defineComponent({
  name: 'PreviewTextCascader',
  props: [],
  setup(_props, { attrs }) {
    useObserver()
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const fieldRef = useField<Field>()
    const field = fieldRef.value
    const props = attrs as unknown as PreviewCascaderProps

    const placeholder = usePlaceholder()
    const getSelected = (): any[] => {
      return isArr(props.value) ? props.value : []
    }

    const getLabels = () => {
      const dataSource: any[] = field?.dataSource?.length
        ? field.dataSource
        : props?.options?.length
          ? props.options
          : []
      const selected = getSelected()
      if (!selected?.length) {
        return <Tag>{placeholder.value}</Tag>
      }

      return selected
        .reduce<{
          dataSource?: any[]
          labels: any[]
        }>(
          (pre, cur) => {
            const result = pre.dataSource?.find(item => item.value == cur)
            if (result) {
              pre.labels.push(result.label)
              pre.dataSource = result.children
            } else {
              pre.labels.push(cur)
              pre.dataSource = []
            }
            return pre
          },
          {
            dataSource,
            labels: [] as any[],
          }
        )
        .labels.map((label, key) => {
          return <Tag key={key}>{label || placeholder.value}</Tag>
        })
    }

    return () => {
      return wrapSSR(<Space class={[prefixCls, hashId.value]}>{getLabels()}</Space>)
    }
  },
})

const TreeSelect = defineComponent({
  name: 'PreviewTextTreeSelect',
  setup(_props, { attrs }) {
    useObserver()
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const fieldRef = useField<Field>()
    const props = attrs as unknown as TreeSelectProps
    const placeholder = usePlaceholder()
    const getSelected = () => {
      const value = props.value
      if (props.multiple || props.treeCheckable) {
        if (props.labelInValue) {
          return isArr(value) ? value : []
        } else {
          return isArr(value) ? value.map(val => ({ label: val, value: val })) : []
        }
      } else {
        if (props.labelInValue) {
          return value ? [value] : []
        } else {
          return value ? [{ label: value, value }] : []
        }
      }
    }

    const findLabel = (value: any, dataSource: any[], treeNodeLabelProp?: string) => {
      for (let i = 0; i < dataSource?.length; i++) {
        const item = dataSource[i]
        if (item?.value === value) {
          return item?.label ?? item[treeNodeLabelProp]
        } else {
          const childLabel = findLabel(value, item?.children, treeNodeLabelProp)
          if (childLabel) return childLabel
        }
      }
    }
    const getDataSource = () => {
      const field = fieldRef.value
      const dataSource = field?.dataSource?.length ? field.dataSource : props?.treeData?.length ? props.treeData : []
      return dataSource
    }

    const getLabels = () => {
      const selected = getSelected()
      if (!selected?.length) return <Tag>{placeholder}</Tag>
      const dataSource = getDataSource()
      return selected.map(({ value, label }, key) => {
        return <Tag key={key}>{findLabel(value, dataSource, props.treeNodeLabelProp) || label || placeholder}</Tag>
      })
    }

    return () => {
      return wrapSSR(<Space class={[prefixCls, hashId.value]}>{getLabels()}</Space>)
    }
  },
})

const TimePicker = defineComponent({
  name: 'PreviewTextTimePicker',
  setup(_props, { attrs }) {
    const props = attrs as unknown as TimePickerProps
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const placeholder = usePlaceholder()
    const getLabels = () => {
      const labels = formatDayjsValue(props.value, props.format, placeholder.value)
      return isArr(labels) ? labels.join('~') : labels
    }
    return () => {
      return wrapSSR(<div class={[prefixCls, hashId.value]}>{getLabels()}</div>)
    }
  },
})

const DatePicker = defineComponent({
  name: 'PreviewTextDatePicker',
  setup(_props, { attrs }) {
    const props = attrs as unknown as DatePickerProps
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const placeholder = usePlaceholder()
    const getLabels = () => {
      const labels = formatDayjsValue(props.value, props.format, placeholder.value)
      return isArr(labels) ? labels.join('~') : labels
    }
    return () => {
      return wrapSSR(<div class={[prefixCls, hashId.value]}>{getLabels()}</div>)
    }
  },
})

const DateRangePicker = defineComponent({
  name: 'PreviewTextDatePicker',
  setup(_props, { attrs }) {
    const props = attrs as unknown as RangePickerProps
    const prefixCls = usePrefixCls('formily-preview-text', attrs.prefixCls as string)
    const [wrapSSR, hashId] = useStyle(prefixCls)
    const placeholder = usePlaceholder()
    const getLabels = () => {
      const labels = formatDayjsValue(props.value, props.format, placeholder.value)
      return isArr(labels) ? labels.join('~') : labels
    }
    return () => {
      return wrapSSR(<div class={[prefixCls, hashId]}>{getLabels()}</div>)
    }
  },
})

export const PreviewText = Object.assign(Text, {
  Input,
  Select,
  Cascader,
  DatePicker,
  DateRangePicker,
  TimePicker,
  TreeSelect,
  Placeholder: PlaceholderContext.Provider,
  usePlaceholder,
})

export default PreviewText
