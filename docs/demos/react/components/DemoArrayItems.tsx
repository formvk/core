import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export interface DemoArrayItemsProps {
  addText?: string
  removeText?: string
  slots?: Record<string, unknown>
}

export const DemoArrayItems = observer((props: DemoArrayItemsProps) => {
  const field = useField<ArrayField>()
  const schema = useFieldSchema()

  const value = field?.value as unknown[] | undefined
  const items = Array.isArray(value) ? value : []
  const itemSchema = schema?.items
  const errors = (field?.selfErrors ?? []) as string[]

  function add() {
    field?.push({})
  }

  function remove(index: number) {
    field?.remove(index)
  }

  return (
    <div className="demo-field">
      <span className="demo-field__label">{field?.title as string}</span>
      <span className="demo-field__control">
        {items.map((_item, index) => (
          <div key={index} className="demo-array__item">
            <div className="demo-array__header">
              <span>#{index + 1}</span>
              <button type="button" className="demo-btn demo-btn--danger" onClick={() => remove(index)}>
                {props.removeText ?? 'Remove'}
              </button>
            </div>
            {itemSchema && !Array.isArray(itemSchema) ? <RecursionField schema={itemSchema} name={index} /> : null}
          </div>
        ))}
        <div>
          <button type="button" className="demo-btn demo-btn--ghost" onClick={add}>
            {props.addText ?? 'Add item'}
          </button>
        </div>
        {errors.map(error => (
          <span key={error} className="demo-field__error">
            {error}
          </span>
        ))}
      </span>
    </div>
  )
})

DemoArrayItems.displayName = 'DemoArrayItems'
