import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from '../components'

// schema 与组件工厂是静态的，模块级只构建一次；form 放进组件内惰性创建，实例随组件生命周期走
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  username: f.Input({
    title: '用户名',
    componentProps: { placeholder: '请输入用户名' },
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
