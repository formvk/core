import { onFieldValueChange } from '@formvk/core'
import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'
import { useState } from 'react'

import { ArrayItems, components, FormItem } from '../components'

type Plan = 'free' | 'pro' | 'enterprise'

interface Member {
  name?: string
  email?: string
  role?: string
}

interface TeamInviteValues {
  teamName: string
  plan: Plan
  seats?: number
  billingEmail?: string
  members: Member[]
  inviteNow: boolean
  message?: string
}

// 每个套餐包含的成员数。校验和底部汇总都读取这张表，业务规则只有一处定义。
const PLAN_SEATS: Record<Plan, number> = { free: 3, pro: 20, enterprise: 100 }

// 模拟后端通讯录：下面的异步规则会拒绝这些地址。
const TAKEN_EMAILS = new Set(['taken@acme.com'])

async function ensureEmailAvailable(value: unknown) {
  await new Promise(resolve => setTimeout(resolve, 150))
  return !TAKEN_EMAILS.has(String(value)) || '该邮箱已被邀请'
}

// schema 与组件工厂是静态的，放在模块级只执行一次。
const { OptionsProvider, fragment: f } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

const schema = createSchema<TeamInviteValues>({
  teamName: f.Input({
    title: '团队名称',
    required: true,
    validator: [
      { required: true, message: '请输入团队名称' },
      { minLength: 3, message: '至少输入 3 个字符' },
      { maxLength: 30, message: '最多输入 30 个字符' },
    ],
    componentProps: { placeholder: '例如：Acme Design' },
  }),
  plan: f.Select({
    title: '套餐',
    componentProps: {
      placeholder: '请选择套餐',
      options: [
        { label: '免费版 · 3 名成员', value: 'free' },
        { label: '专业版 · 20 名成员', value: 'pro' },
        { label: '企业版 · 100 名成员', value: 'enterprise' },
      ],
    },
  }),
  seats: f.NumberInput({
    title: '席位数',
    description: '可以加入这个团队的人数',
    validator: [
      { required: true, message: '请输入席位数' },
      {
        validator: (value, _rule, { form }) => {
          const plan = (form.values.plan ?? 'free') as Plan
          const limit = PLAN_SEATS[plan]
          return typeof value !== 'number' || value <= limit || `${plan} 套餐最多包含 ${limit} 个席位`
        },
      },
      {
        validator: (value, _rule, { form }) => {
          const invited = ((form.values.members ?? []) as Member[]).length
          return typeof value !== 'number' || value >= invited || `你已经邀请了 ${invited} 名成员`
        },
      },
    ],
    componentProps: { type: 'number', placeholder: '3' },
    reactions: field => {
      const paid = field.record.plan !== 'free'
      field.visible = paid
      field.required = paid
    },
  }),
  billingEmail: f.Input({
    title: '账单邮箱',
    description: '付费套餐的发票会发送到这里',
    validator: [{ format: 'email', message: '请输入有效的账单邮箱' }],
    componentProps: { placeholder: 'finance@acme.com' },
    reactions: field => {
      const paid = field.record.plan !== 'free'
      field.visible = paid
      field.required = paid
    },
  }),
  members: f.ArrayItems(
    f.Object({
      name: f.Input({
        title: '姓名',
        required: true,
        validator: [{ required: true, message: '请输入成员姓名' }],
        componentProps: { placeholder: '例如：张三' },
      }),
      email: f.Input({
        title: '邮箱',
        required: true,
        validator: [
          { required: true, message: '请输入成员邮箱' },
          { format: 'email', message: '请输入有效的邮箱地址' },
          {
            validator: (value, _rule, { form }) => {
              const matches = ((form.values.members ?? []) as Member[]).filter(member => member?.email === value)
              return matches.length <= 1 || '该邮箱已被其他成员使用'
            },
          },
          // 开销较大的校验放在失焦时，而不是每次按键都请求。
          { triggerType: 'onBlur', validator: ensureEmailAvailable },
        ],
        componentProps: { placeholder: 'zhangsan@acme.com' },
      }),
      role: f.Select({
        title: '角色',
        componentProps: {
          options: [
            { label: '成员', value: 'member' },
            { label: '管理员', value: 'admin' },
            { label: '账单联系人', value: 'billing' },
          ],
        },
      }),
    }),
    {
      title: '成员',
      required: true,
      validator: [
        { required: true, message: '至少邀请一名成员' },
        {
          validator: (value, _rule, { form }) => {
            const plan = (form.values.plan ?? 'free') as Plan
            const limit = PLAN_SEATS[plan]
            return !Array.isArray(value) || value.length <= limit || `${plan} 套餐最多允许 ${limit} 名成员`
          },
        },
      ],
      // 默认装饰器只作用于 string 字段，数组节点需要显式声明。
      decorator: 'FormItem',
      componentProps: { addText: '添加成员', removeText: '移除' },
    }
  ),
  inviteNow: f.Checkbox({
    title: '立即发送邀请邮件',
  }),
  message: f.Textarea({
    title: '邀请文案',
    componentProps: { rows: 3, placeholder: '欢迎加入！这里是我们的协作方式……' },
    reactions: field => {
      field.visible = field.record.inviteNow === true
    },
  }),
})

export default observer(function TeamInviteDemo() {
  // form 在组件内惰性创建：每个挂载实例持有独立模型，卸载时由 FormProvider 清理。
  const [form] = useState(() =>
    createForm<TeamInviteValues>({
      values: {
        teamName: '',
        plan: 'free',
        seats: 3,
        billingEmail: '',
        members: [{ name: '', email: '', role: 'member' }],
        inviteNow: true,
        message: '',
      },
      effects() {
        // 保持列表可编辑：删掉最后一行时自动补一行空行。
        onFieldValueChange('members', (_field, form) => {
          if (form.values.members.length === 0) {
            form.setValuesIn('members', [{}])
          }
        })
        // 跨字段规则只在自己的字段被校验时执行，
        // 因此切换套餐后要主动重新校验依赖它的字段。
        onFieldValueChange('plan', (_field, form) => {
          form.validate('seats')
          form.validate('members')
        })
        // 对另一个字段“值”的副作用用命令式写法更直接：
        // 关闭邀请邮件时清空还没发出去的文案。
        onFieldValueChange('inviteNow', (field, form) => {
          if (!field.value) {
            form.setValuesIn('message', '')
          }
        })
      },
    })
  )
  const [submitted, setSubmitted] = useState('')
  const [error, setError] = useState('')

  const plan = form.values.plan ?? 'free'
  const members = form.values.members ?? []
  const ready = members.filter(member => member?.email).length
  const summary = `${ready}/${members.length} 份邀请已就绪 · ${plan} 套餐允许 ${PLAN_SEATS[plan]} 名成员`

  // 基于路径的批量更新：同样的写法适用于任何可重复分组。
  function assignMemberRoleToAll() {
    form.setFieldState('members.*.role', field => {
      field.value = 'member'
    })
  }

  async function onSubmit() {
    setError('')
    try {
      setSubmitted(JSON.stringify(await form.submit(), null, 2))
    } catch {
      setSubmitted('')
      setError('请先修正高亮的字段。')
    }
  }

  function onReset() {
    form.reset()
    setSubmitted('')
    setError('')
  }

  return (
    <OptionsProvider>
      <FormProvider form={form}>
        <div className="dr-demo">
          <SchemaField schema={schema} />
          <div className="dr-actions">
            <button type="button" className="dr-btn dr-btn--ghost" onClick={assignMemberRoleToAll}>
              全部设为「成员」
            </button>
            <button type="button" className="dr-btn" disabled={form.submitting} onClick={onSubmit}>
              {form.submitting ? '创建中…' : '创建团队'}
            </button>
            <button type="button" className="dr-btn dr-btn--ghost" onClick={onReset}>
              重置
            </button>
          </div>
          <div className="dr-result">{summary}</div>
          {error ? <div className="dr-result">{error}</div> : null}
          {submitted ? (
            <div className="dr-result">
              <pre>{submitted}</pre>
            </div>
          ) : null}
        </div>
      </FormProvider>
    </OptionsProvider>
  )
})
