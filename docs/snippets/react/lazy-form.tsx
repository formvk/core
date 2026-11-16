import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

function Input(props: { value?: string }) {
  return <input value={props.value ?? ''} readOnly />
}

// The schema and component factory are static and built once at module level
const { SchemaField, fragment: f } = createSchemaField({
  components: { Input },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})

export default function App() {
  // The form is a stateful model — create it lazily inside the component
  const [form] = useState(() => createForm({ values: { name: '' } }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>
  )
}
