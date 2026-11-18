import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export interface DemoArrayItemsProps {
  addText?: string
  removeText?: string
  /** 新增数组项；配合 schema 的 recordKey 生成稳定键 */
  createItem?: () => any
}

export const DemoArrayItems = observer((props: DemoArrayItemsProps) => {
  const field = useField<ArrayField>()
  const schema = useFieldSchema()

  const value = field?.value as unknown[] | undefined
  const items = Array.isArray(value) ? value : []
  const itemSchema = schema?.items

  function add() {
    field?.push(props.createItem ? props.createItem() : {})
  }

  function remove(index: number) {
    field?.remove(index)
  }

  return (
    <div className="dr-array">
      {items.map((_item, index) => (
        // 优先使用 recordKey 生成的稳定键，删除/重排时保留行组件实例
        <div key={field?.getRecordKey(index) ?? index} className="dr-array__item">
          <div className="dr-array__header">
            <span>#{index + 1}</span>
            <button type="button" className="dr-btn dr-btn--danger" onClick={() => remove(index)}>
              {props.removeText ?? '删除'}
            </button>
          </div>
          {itemSchema && !Array.isArray(itemSchema) ? <RecursionField schema={itemSchema} name={index} /> : null}
        </div>
      ))}
      <div>
        <button type="button" className="dr-btn dr-btn--ghost" onClick={add}>
          {props.addText ?? '添加一项'}
        </button>
      </div>
    </div>
  )
})

DemoArrayItems.displayName = 'DemoArrayItems'
