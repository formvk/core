import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents } from '../components'

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  arrayComponents: { ArrayItems: DemoArrayItems },
})

const schema = createSchema({
  username: f.Input({
    title: '用户名',
    required: true,
    validator: [
      { required: true, message: '请输入用户名' },
      { minLength: 3, message: '至少输入 3 个字符' },
    ],
    componentProps: { placeholder: '请输入用户名' },
  }),
  role: f.Select({
    title: '角色',
    required: true,
    validator: [{ required: true, message: '请选择角色' }],
    componentProps: {
      placeholder: '请选择角色',
      options: [
        { label: '开发', value: 'developer' },
        { label: '设计', value: 'designer' },
        { label: '产品经理', value: 'pm' },
      ],
    },
  }),
  subscribe: f.Checkbox({
    title: '订阅产品更新',
  }),
  bio: f.Textarea({
    title: '个人简介',
    componentProps: { placeholder: '简单介绍一下自己', rows: 3 },
  }),
})

export default observer(function BasicFormDemo() {
  // form 在组件内惰性创建：每个组件实例持有独立表单，卸载时由 FormProvider 清理
  const [form] = useState(() =>
    createForm({
      values: {
        username: '',
        role: '',
        subscribe: false,
        bio: '',
      },
    })
  )
  const [submitted, setSubmitted] = useState('')

  async function onSubmit() {
    try {
      const values = await form.submit()
      setSubmitted(JSON.stringify(values, null, 2))
    } catch {
      setSubmitted('请修正高亮的字段。')
    }
  }

  function onReset() {
    form.reset()
    setSubmitted('')
  }

  return (
    <FormProvider form={form}>
      <div className="demo">
        <SchemaField schema={schema} />
        <div className="demo-actions">
          <button type="button" className="demo-btn" disabled={form.submitting} onClick={onSubmit}>
            {form.submitting ? '提交中…' : '提交'}
          </button>
          <button type="button" className="demo-btn demo-btn--ghost" onClick={onReset}>
            重置
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
})
