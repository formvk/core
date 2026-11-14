import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from './components'

// The schema and component factory are static and built once at module level;
// the form is created lazily inside the component and follows the instance lifecycle
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  username: f.Input({
    title: 'Username',
    componentProps: { placeholder: 'Your name' },
  }),
})

export default observer(function GettingStartedDemo() {
  const [form] = useState(() => createForm({ values: { username: 'alice' } }))

  return (
    <div className="demo">
      <FormProvider form={form}>
        <SchemaField schema={schema} />
        <div className="demo-result">values: {JSON.stringify(form.values)}</div>
      </FormProvider>
    </div>
  )
})
