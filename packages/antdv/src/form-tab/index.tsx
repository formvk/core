import type { GeneralField } from '@formvk/core'
import type { Schema, SchemaKey } from '@formvk/json-schema'
import { autorun, model } from '@formvk/reactive'
import { observer } from '@formvk/reactive-vue'
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'
import type { TabPaneProps, TabsProps } from 'ant-design-vue'
import { Badge, Tabs } from 'ant-design-vue'
import { computed, defineComponent, onBeforeUnmount, reactive, watchEffect } from 'vue'
import { usePrefixCls } from '../__builtins__'

const { TabPane } = Tabs

export interface IFormTab {
  activeKey: string
  setActiveKey(key: string): void
}

export interface IFormTabProps extends TabsProps {
  formTab?: IFormTab
}

export interface IFormTabPaneProps extends TabPaneProps {
  key: string
}

interface ITab {
  name: SchemaKey
  props: any
  schema: Schema
  field: GeneralField
}

const useTabs = () => {
  const tabsFieldRef = useField()
  const schemaRef = useFieldSchema()
  const tabs: ITab[] = reactive([])
  let dispose: any
  watchEffect(() => {
    dispose?.()
    dispose = autorun(() => {
      tabs.length = 0
      schemaRef.value.mapProperties((schema, name) => {
        const field = tabsFieldRef.value.query(tabsFieldRef.value.address.concat(name)).take()
        if (field?.display === 'none' || field?.display === 'hidden') return
        if (schema['x-component']?.indexOf('TabPane') > -1) {
          tabs.push({
            name,
            props: {
              key: schema?.['x-component-props']?.key || name,
              ...schema?.['x-component-props'],
              ...field?.componentProps,
            },
            schema,
            field,
          })
        }
      })
    })
  })

  onBeforeUnmount(() => {
    dispose?.()
  })

  return tabs
}

const createFormTab = (defaultActiveKey?: string) => {
  const formTab = model({
    activeKey: defaultActiveKey,
    setActiveKey(key: string) {
      formTab.activeKey = key
    },
  })
  return formTab
}

const FormTabInner = observer(
  defineComponent({
    name: 'FormTab',
    props: ['formTab', 'activeKey'],
    emits: ['change'],
    setup(props, { attrs, emit }) {
      const fieldRef = useField()
      const formTabRef = computed(() => props.formTab ?? createFormTab())

      const prefixCls = usePrefixCls('formily-form-tab', attrs.prefixCls as string)
      const tabs = useTabs()

      return () => {
        const field = fieldRef.value
        const formTab = formTabRef.value
        const activeKey = props.activeKey || formTab?.activeKey || tabs?.[0]?.name
        const badgedTab = (key: SchemaKey, props: any) => {
          const errors = field.form.queryFeedbacks({
            type: 'error',
            address: `${field.address.concat(key)}.*`,
          })
          if (errors.length) {
            return () => (
              <Badge class={`${prefixCls}-errors-badge`} count={errors.length} size="small">
                {props.tab}
              </Badge>
            )
          }
          return props.tab
        }

        const getTabs = (tabs: ITab[]) => {
          return tabs.map(({ props, schema, name, field }) => {
            if (field?.hidden === true) return null
            if (field?.visible === false) return null
            return (
              <TabPane {...props} key={name} tab={badgedTab(name, props)} forceRender>
                <RecursionField schema={schema} name={name}></RecursionField>
              </TabPane>
            )
          })
        }
        return (
          <Tabs
            class={prefixCls}
            {...attrs}
            activeKey={activeKey}
            onChange={(key: string) => {
              emit('change', key)
              formTab.setActiveKey?.(key)
            }}
          >
            {getTabs(tabs)}
          </Tabs>
        )
      }
    },
  })
)

const FormTabPane = defineComponent<IFormTabPaneProps>({
  name: 'FormTabPane',
  inheritAttrs: false,
  setup(_props, { slots }) {
    return () => <>{slots.default?.()}</>
  },
})

export const FormTab = Object.assign(FormTabInner, {
  TabPane: FormTabPane,
  createFormTab,
})

export default FormTab
