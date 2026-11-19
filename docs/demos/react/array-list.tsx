import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { useState } from 'react'

import { ArrayItems, components, FormItem } from './components'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

// New rows carry a stable id so recordKey can keep their component instances across delete/reorder.
let memberUid = 1
function createMember() {
  return { id: `member-${++memberUid}` }
}

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // Hidden but part of the item model: recordKey needs a declared key
      id: f.Input({ hidden: true }),
      name: f.Input({
        title: 'Name',
        required: true,
        validator: [{ required: true, message: 'Name is required' }],
        componentProps: { placeholder: 'Jane' },
      }),
      email: f.Input({
        title: 'Email',
        componentProps: { placeholder: 'jane@example.com' },
      }),
    }),
    {
      title: 'Members',
      // The default decorator only applies to string fields; arrays must opt in explicitly
      decorator: 'FormItem',
      // `id` is immutable per row, so it is safe as the rendering key
      recordKey: 'id',
      componentProps: { createItem: createMember },
    }
  ),
})

export default function ArrayListDemo() {
  const [form] = useState(() =>
    createForm({
      values: {
        members: [{ id: 'member-1', name: 'Alice', email: 'alice@example.com' }],
      },
    })
  )
  const [submitted, setSubmitted] = useState('')

  async function onSubmit() {
    try {
      setSubmitted(JSON.stringify(await form.submit(), null, 2))
    } catch {
      setSubmitted('Please fix the highlighted fields.')
    }
  }

  return (
    <OptionsProvider>
      <FormProvider form={form}>
        <div className="dr-demo">
          <SchemaField schema={schema} />
          <div className="dr-actions">
            <button type="button" className="dr-btn" onClick={onSubmit}>
              Submit
            </button>
          </div>
          {submitted ? (
            <div className="dr-result">
              <pre>{submitted}</pre>
            </div>
          ) : null}
        </div>
      </FormProvider>
    </OptionsProvider>
  )
}
