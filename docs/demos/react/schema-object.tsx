import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { ArrayItems, components, FormItem } from './components'

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: 'Name' }),
    role: f.Select({
      title: 'Role',
      componentProps: {
        options: [
          { label: 'Developer', value: 'developer' },
          { label: 'Designer', value: 'designer' },
        ],
      },
    }),
  }),
})

export default observer(function SchemaObjectDemo() {
  const [form] = useState(() => createForm({ values: { profile: { name: 'Alice', role: 'developer' } } }))

  return (
    <OptionsProvider>
      <div className="dr-demo">
        <FormProvider form={form}>
          <SchemaField schema={schema} />
          <div className="dr-result">values: {JSON.stringify(form.values)}</div>
        </FormProvider>
      </div>
    </OptionsProvider>
  )
})
