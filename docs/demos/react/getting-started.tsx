import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents, FormItem } from './components'

// The schema and component factory are static and built once at module level;
// the form is created lazily inside the component and follows the instance lifecycle
const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
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
