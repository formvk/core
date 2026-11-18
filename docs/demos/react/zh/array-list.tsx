import { createForm, createSchema, createSchemaField, FormProvider } from '@formvk/react'
import { useState } from 'react'

import { DemoArrayItems, demoComponents, FormItem } from '../components'

const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

// 新增行携带稳定 id，recordKey 才能在删除/重排时复用行组件实例
let memberUid = 1
function createMember() {
  return { id: `member-${++memberUid}` }
}

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // 隐藏字段，但属于数据模型：recordKey 需要 schema 声明过的 key
      id: f.Input({ hidden: true }),
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
      // 默认装饰器只作用于 string 字段，array 需要显式声明
      decorator: 'FormItem',
      // id 在行内不可变，适合作为渲染键
      recordKey: 'id',
      componentProps: { addText: '添加成员', removeText: '删除', createItem: createMember },
    }
  ),
})

export default function ArrayListDemo() {
  const [form] = useState(() =>
    createForm({
      values: {
        members: [{ id: 'member-1', name: 'Alice', email: 'alice@example.com' }],
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
      <div className="dr-demo">
        <SchemaField schema={schema} />
        <div className="dr-actions">
          <button type="button" className="dr-btn" onClick={onSubmit}>
            提交
          </button>
        </div>
        {submitted ? (
          <div className="dr-result">
            <pre>{submitted}</pre>
          </div>
        ) : null}
      </div>
    </FormProvider>
  )
}
