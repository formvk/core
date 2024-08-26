import type { ArrayField } from '@formvk/core'
import type { ISchema } from '@formvk/json-schema'
import { observer } from '@formvk/reactive-vue'
import { isFn } from '@formvk/shared'
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'
import { Card, Empty } from 'ant-design-vue'
import { defineComponent } from 'vue'
import { usePrefixCls } from '../__builtins__'
import { ArrayBase } from '../array-base'

const isAdditionComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Addition') > -1
}

const isIndexComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Index') > -1
}

const isRemoveComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('Remove') > -1
}

const isMoveUpComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('MoveUp') > -1
}

const isMoveDownComponent = (schema: ISchema) => {
  return schema['x-component']?.indexOf('MoveDown') > -1
}

const isOperationComponent = (schema: ISchema) => {
  return (
    isAdditionComponent(schema) || isRemoveComponent(schema) || isMoveDownComponent(schema) || isMoveUpComponent(schema)
  )
}

const ArrayCardsInner = observer(
  defineComponent({
    name: 'ArrayCards',
    props: ['renderTitle'],
    emits: ['change'],
    setup(_props, { attrs }) {
      const fieldRef = useField<ArrayField>()
      const schemaRef = useFieldSchema()
      const prefixCls = usePrefixCls('formily-array-cards', attrs.prefixCls as string)
      const { getKey, keyMap } = ArrayBase.useKey(schemaRef.value)
      return () => {
        const props = { ...attrs }
        const field = fieldRef.value
        const schema = schemaRef.value
        const dataSource = Array.isArray(field.value) ? field.value : []
        if (!schema) throw new Error('can not found schema object')
        const renderTitle = _props.renderTitle
        const renderItems = () => {
          return dataSource?.map((item, index) => {
            const items = Array.isArray(schema.items) ? schema.items[index] || schema.items[0] : schema.items
            const title = isFn(renderTitle)
              ? renderTitle(dataSource[index], dataSource, index)
              : `${props.title || field.componentProps?.title || field.title || 'Untitled'} ${index + 1}`
            return (
              <ArrayBase.Item key={getKey(item, index)} index={index} record={item}>
                <Card
                  {...attrs}
                  class={`${prefixCls}-item`}
                  title={
                    <span>
                      <RecursionField
                        schema={items}
                        name={index}
                        filterProperties={(schema: ISchema) => {
                          if (!isIndexComponent(schema)) return false
                          return true
                        }}
                        onlyRenderProperties
                      />
                      {title}
                    </span>
                  }
                  extra={
                    <span>
                      <RecursionField
                        schema={items}
                        name={index}
                        filterProperties={(schema: ISchema) => {
                          if (!isOperationComponent(schema)) return false
                          return true
                        }}
                        onlyRenderProperties
                      />
                      {props.extra}
                    </span>
                  }
                >
                  <RecursionField
                    schema={items}
                    name={index}
                    filterProperties={(schema: ISchema) => {
                      if (isIndexComponent(schema)) return false
                      if (isOperationComponent(schema)) return false
                      return true
                    }}
                  />
                </Card>
              </ArrayBase.Item>
            )
          })
        }

        const renderAddition = () => {
          return schema.reduceProperties((addition, schema, key) => {
            if (isAdditionComponent(schema)) {
              return <RecursionField schema={schema} name={key} />
            }
            return addition
          }, null)
        }

        const renderEmpty = () => {
          if (dataSource?.length) return
          return (
            <Card {...attrs} class={`${prefixCls}-item`} title={props.title || field.title}>
              <Empty />
            </Card>
          )
        }

        return (
          <ArrayBase keyMap={keyMap}>
            {renderEmpty()}
            {renderItems()}
            {renderAddition()}
          </ArrayBase>
        )
      }
    },
  })
)

export const ArrayCards = Object.assign(ArrayCardsInner, {
  Index: ArrayBase.Index,
  SortHandle: ArrayBase.SortHandle,
  Addition: ArrayBase.Addition,
  Remove: ArrayBase.Remove,
  MoveDown: ArrayBase.MoveDown,
  MoveUp: ArrayBase.MoveUp,
  useArray: ArrayBase.useArray,
  useIndex: ArrayBase.useIndex,
  useRecord: ArrayBase.useRecord,
})

export default ArrayCards
