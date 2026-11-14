import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from './components'

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
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
    }
  ),
})

export default function ArrayListDemo() {
  const [form] = useState(() =>
    createForm({
      values: {
        members: [{ name: 'Alice', email: 'alice@example.com' }],
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
    <FormProvider form={form}>
      <div className="demo">
        <SchemaField schema={schema} />
        <div className="demo-actions">
          <button type="button" className="demo-btn" onClick={onSubmit}>
            Submit
          </button>
        </div>
        {submitted ? (
          <div className="demo-result">
            <pre>{submitted}</pre>
          </div>
        ) : null}
      </div>
    </FormProvider>
  )
}
