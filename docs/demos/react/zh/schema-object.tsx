import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from '../components'

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: '姓名' }),
    role: f.Select({
      title: '角色',
      componentProps: {
        options: [
          { label: '开发', value: 'developer' },
          { label: '设计', value: 'designer' },
        ],
      },
    }),
  }),
})

export default observer(function SchemaObjectDemo() {
  const [form] = useState(() => createForm({ values: { profile: { name: 'Alice', role: 'developer' } } }))

  return (
    <div className="demo">
      <FormProvider form={form}>
        <SchemaField schema={schema} />
        <div className="demo-result">values: {JSON.stringify(form.values)}</div>
      </FormProvider>
    </div>
  )
})
