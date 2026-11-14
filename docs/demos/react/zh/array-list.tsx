import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from '../components'

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      name: f.Input({
        title: '姓名',
        required: true,
        validator: [{ required: true, message: '请输入姓名' }],
        componentProps: { placeholder: '例如：张三' },
      }),
      email: f.Input({
        title: '邮箱',
        componentProps: { placeholder: 'you@example.com' },
      }),
    }),
    {
      title: '成员',
      componentProps: { addText: '添加成员', removeText: '删除' },
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
      setSubmitted('请修正高亮的字段。')
    }
  }

  return (
    <FormProvider form={form}>
      <div className="demo">
        <SchemaField schema={schema} />
        <div className="demo-actions">
          <button type="button" className="demo-btn" onClick={onSubmit}>
            提交
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
