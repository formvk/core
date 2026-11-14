import type { Field } from '@formvk/core'
import { createForm, createFragment, createSchema, FormProvider, SchemaField, useField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

// #region my-input
const MyInput = observer(() => {
  const field = useField<Field>()
  return (
    <div>
      <label>{field?.title as string}</label>
      <input value={(field?.value as string) ?? ''} onChange={event => field?.onInput(event)} />
      {field?.selfErrors?.length ? <span>{field.selfErrors[0]}</span> : null}
    </div>
  )
})
// #endregion

// #region register-app
// The schema is static data — build it once at module level
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: 'Name', component: 'Input' }),
})

export default function App() {
  // The form is a stateful model — create it lazily inside the component,
  // so the instance follows the component's lifecycle
  const [form] = useState(() => createForm({ values: { name: '' } }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} components={{ Input: MyInput }} />
    </FormProvider>
  )
}
// #endregion
