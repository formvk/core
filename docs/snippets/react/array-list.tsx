import type { ArrayField } from '@formvk/core'
import { RecursionField, useField, useFieldSchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

export const ArrayList = observer(() => {
  const field = useField<ArrayField>()
  const schema = useFieldSchema()
  const itemSchema = schema?.items

  return (
    <div>
      {field?.value?.map((_item, index) => (
        <div key={index}>
          {itemSchema && !Array.isArray(itemSchema) ? <RecursionField schema={itemSchema} name={index} /> : null}
          <button type="button" onClick={() => field.remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => field?.push({})}>
        Add item
      </button>
    </div>
  )
})
