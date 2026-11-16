# 业务实战：团队邀请

其他示例都在单独演示一个能力，这个示例是一条完整的产品流程：SaaS 的 onboarding 表单，管理员创建团队、选择套餐、邀请成员。它按照真实功能的开发顺序编写——先列业务规则，再写 schema——用来回答参考页回答不了的问题：**每个能力到底什么时候该用？**

<ReactMount :component="ReactTeamInviteDemo" />

演示本身就是一个 TSX 组件，完整源码如下。下文每一节都会指出实现对应规则的位置。

<<< @/demos/react/zh/team-invite.tsx

<script setup lang="ts">
import ReactTeamInviteDemo from '../../../demos/react/zh/team-invite'
</script>

## 这个功能需要什么

| #   | 业务规则                                         | 用到的能力                           | 参考                                       |
| --- | ------------------------------------------------ | ------------------------------------ | ------------------------------------------ |
| 1   | 一份类型化的取值模型，schema、校验与提交共用     | `createForm<TeamInviteValues>`       | [表单模型](/zh/core/)                      |
| 2   | 团队名必填，长度 3–30                            | 规则数组                             | [校验](/zh/core/validation)                |
| 3   | 席位与账单邮箱只在付费套餐存在，且变为必填       | `reactions`                          | [动态联动](/zh/schema/#reactions)          |
| 4   | 勾选“立即发送邀请”时才显示邀请文案               | `reactions`                          | [Schema 概览](/zh/schema/#reactions)       |
| 5   | 成员是可增删的可重复分组                         | `ArrayField` + `ArrayItems`          | [数组列表](/zh/react/examples/array-list)  |
| 6   | 席位数不能少于已邀请人数，也不能超过套餐上限     | 读取 `ctx.form` 的自定义 `validator` | [校验](/zh/core/validation#编写自定义规则) |
| 7   | 同一邮箱不能重复邀请；已被占用的邮箱在失焦时校验 | 跨字段 + 异步校验                    | [校验](/zh/core/validation#控制校验时机)   |
| 8   | 删掉最后一行成员时自动补一行；关闭邮件时清空文案 | `effects`                            | [Effects](/zh/core/#effects)               |
| 9   | 工具栏按钮把所有人的角色批量设为「成员」         | 路径通配符 + `form.setFieldState`    | [路径系统](/zh/core/paths)                 |
| 10  | 底部实时汇总“已就绪的邀请数”                     | 在 `observer` 内读取可观察值         | [响应式](/zh/core/reactivity)              |

下面按顺序拆解。

## 1. 先定义取值类型

先写接口，再写 schema。`createForm<T>` 让 `form.values` 在所有地方都有类型，同时这份接口本身就是提交给后端的 payload 说明：

```ts
interface TeamInviteValues {
  teamName: string
  plan: 'free' | 'pro' | 'enterprise'
  seats?: number
  billingEmail?: string
  members: Array<{ name?: string; email?: string; role?: string }>
  inviteNow: boolean
  message?: string
}
```

**为什么不从 schema 反推类型？** 可以（`createSchema` 会携带 `_$types$_`），但这份类型还要给校验函数和提交逻辑用。先声明它，schema 里的字段名写错会直接变成类型错误，而不是运行时悄无声息地少一个值。

## 2. 工厂建一次，form 按实例创建

React 函数组件每次渲染都会重跑函数体，所以两类状态按生命周期拆开：

```tsx
// 静态：整个模块只构建一次
const { SchemaField, fragment: f } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

const schema = createSchema({ ... })

export default observer(function TeamInviteDemo() {
  // 按实例：惰性创建一次，卸载时由 FormProvider 清理
  const [form] = useState(() => createForm<TeamInviteValues>({ ... }))

  return (
    <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>
  )
})
```

在函数体里直接 `createForm()` 会每次渲染都重建模型；放在模块级则会让所有挂载实例共享同一份状态。完整说明见 [React 绑定](/zh/react/#createform)。

## 3. 条件区块：`reactions`

**什么时候用：** 字段的显隐、必填、标题或组件 props 依赖其他字段的值。这是最常见的场景。

付费专属区块（`seats`、`billingEmail`）共用同一个联动形态：

```ts
seats: f.NumberInput({
  title: 'Seats',
  reactions: field => {
    const paid = field.form.values.plan !== 'free'
    field.visible = paid
    field.required = paid
  },
})
```

- reaction 就是一个普通函数 `(field) => void`。函数里读取 `field.form.values.plan` 就把 `plan` 变成了依赖 —— 不需要再维护一份与代码同步的路径列表。
- 给 `field.visible` / `field.required` 赋值就是全部更新。`plan` 变化时函数会自动重跑。
- `visible: false` 等价于 `display: 'none'`：节点不渲染、`form.validate()` 跳过它，**它的值也会从 `form.values` 中移除**——免费套餐提交时不会带 `seats` 和 `billingEmail`。通常这正是“这个套餐里没有这个区块”的语义。
- 如果希望隐藏但保留值，用 `hidden: true`：节点不显示，值仍在 payload 里。

邀请文案是同一个函数，只读取 `inviteNow`，并且不碰 `required`。

## 4. 成员：可重复分组

数组节点就是一个值为数组的普通字段。`ArrayItems` 组件负责布局，并用 `RecursionField` 渲染每一项；schema 只描述每一项的形状：

```ts
members: f.ArrayItems(
  f.Object({
    name: f.Input({ title: 'Name', required: true }),
    email: f.Input({ title: 'Email', required: true }),
    role: f.Select({ title: 'Role' }),
  }),
  { title: 'Members', decorator: 'FormItem' }
)
```

- 取值类型被推断为 `Member[]`，`form.values.members[0].email` 有类型。
- `push`、`insert`、`remove`、`move` 等方法在 `ArrayField` 上；组件实现见[数组列表](/zh/react/examples/array-list)。在 React 里，`field.push({})` 更新可观察数组后，被 `observer` 包裹的数组组件会重新渲染。
- 每一项字段的 address 与 path 相同（`members.0.email`），因为中间没有 `void` 节点。

**批量更新。** 工具栏按钮演示了路径的价值：一个通配符就能触达所有项，不需要自己遍历字段。

```ts
form.setFieldState('members.*.role', field => {
  field.value = 'member'
})
```

需要跨分组读取时，用 `form.query('members.*.email').map(field => field.value)`，例如查重或生成汇总。

## 5. 依赖其他字段的校验

静态规则键（`minLength`、`format`、`maximum`）覆盖单字段校验。这里的业务规则需要上下文，所以用自定义校验函数。第三个参数带有 `{ field, form }`：

```ts
// 席位数不能超过套餐上限
{
  validator: (value, _rule, { form }) => {
    const plan = (form.values.plan ?? 'free') as Plan
    return typeof value !== 'number' || value <= PLAN_SEATS[plan] || `${plan} 套餐最多包含 ${PLAN_SEATS[plan]} 个席位`
  },
},
// 席位数不能少于已邀请人数
{
  validator: (value, _rule, { form }) => {
    const invited = (form.values.members ?? []).length
    return typeof value !== 'number' || value >= invited || `你已经邀请了 ${invited} 名成员`
  },
},
```

另外两种值得直接抄的形态：

- **数组内查重。** 过滤 `form.values.members` 与兄弟项比较；规则挂在该字段上，可以同时标红两条重复记录。
- **开销大的校验。** 邮箱可用性规则标记了 `triggerType: 'onBlur'`，用户离开字段时才执行，而不是每次按键都发请求。`form.submit()` 仍然会执行它。

```ts
{ triggerType: 'onBlur', validator: ensureEmailAvailable }
```

空值会跳过除 `required` 之外的所有规则，所以清空的选填字段不会报格式错误。数组级规则（套餐人数上限）挂在 `members` 节点本身——它的 `value` 就是整个数组。

## 6. 跨字段副作用：`effects`

**什么时候用：** 结果不只是字段状态，而是另一个字段的**值**，或者需要写分支逻辑。联动用声明式补状态，effects 就是普通回调。它与框架无关，要从 `@formvk/core` 导入——绑定包不会重新导出这些 hooks。

```ts
const [form] = useState(() =>
  createForm<TeamInviteValues>({
    values: { ... },
    effects() {
      // 保证至少有一行可编辑
      onFieldValueChange('members', (_field, form) => {
        if (form.values.members.length === 0) {
          form.setValuesIn('members', [{}])
        }
      })
      // 跨字段规则只在自己的字段被校验时执行，
      // 所以切换套餐后要重新检查依赖它的上限
      onFieldValueChange('plan', (_field, form) => {
        form.validate('seats')
        form.validate('members')
      })
      // 关闭邀请邮件时清空草稿文案
      onFieldValueChange('inviteNow', (field, form) => {
        if (!field.value) {
          form.setValuesIn('message', '')
        }
      })
    },
  })
)
```

判断准则：

- 需求读起来是“当 X 时，这个字段变成可见 / 必填 / 禁用”——用**联动**。
- 需求读起来是“当 X 时，对别的东西做 Y”——清值、加行、调接口、更新 store——用 **effects**。
- 跨字段**校验器**不会因为依赖字段变化而自动重跑。若依赖是另一个字段，就在 effect 中针对该字段调用 `form.validate(pattern)`，如上面对 `plan` 的处理。
- 注册在 `createForm` 里的 effects 与表单同生命周期；组件级 effects 在 `observer` 组件里调用 `useFormEffects`，见 [Hooks](/zh/react/hooks)。

## 7. 提交、重置与反馈

```ts
async function onSubmit() {
  try {
    setSubmitted(JSON.stringify(await form.submit(), null, 2))
  } catch {
    setError('请先修正高亮的字段。')
  }
}
```

- `form.submit()` 校验所有可编辑字段，成功时 resolve 普通取值（`display: 'none'` 的字段会被排除），失败时 reject 错误列表。
- `form.submitting` 在 Promise 未完成时为 `true`。在被 `observer` 包裹的组件里读取它，按钮会自动重渲染。
- `form.reset()` 恢复初始值，包括初始的那一行成员。
- 想把用户带到第一个错误，读 `form.errors[0].path` 并聚焦该字段；只想校验一组字段，用模式参数：`form.validate('members.*.email')`。

## 8. 在 UI 中读取实时状态

React 不会自动追踪可观察读取，所以组件要用 `observer` 包裹。包裹之后，直接读 `form.values` 就够了：

```tsx
const plan = form.values.plan ?? 'free'
const members = form.values.members ?? []
const ready = members.filter(member => member?.email).length
const summary = `${ready}/${members.length} invitations ready · ${plan} allows ${PLAN_SEATS[plan]} members`
```

两个替代方案：

- `<FormConsumer>{({ form }) => ...}</FormConsumer>` 把响应式读取限制在一小块子树里，适合调试面板或 schema 之外的页脚。
- `connect` / `mapProps` / `mapReadPretty` 生成的组件会自动包 `observer`；手写组件只要读取字段状态，就必须自己包。

## 能力选型对照

| 需求                            | 使用方式                                      |
| ------------------------------- | --------------------------------------------- |
| 根据其他字段显示 / 隐藏 / 必填  | `reactions`                                   |
| 改值、加行、变更时调接口        | `effects`                                     |
| 用静态约束校验单个值            | 内置规则键                                    |
| 与兄弟字段、数组或远端数据比较  | 带 `ctx.form` 的自定义 `validator`            |
| 计算标题、placeholder、禁用标记 | schema 表达式（<code v-pre>{{ ... }}</code>） |
| 一次更新很多字段                | 路径通配符 + `setFieldState` / `query`        |
| 只读展示已提交的值              | `mapReadPretty` / `FormConsumer`              |

## 下一步

- [动态联动](/zh/react/examples/reactions) —— 最小化的联动示例。
- [数组列表](/zh/react/examples/array-list) —— 单独拆出来的数组组件。
- [校验](/zh/core/validation) —— 每种规则形态与触发时机。
- [路径系统](/zh/core/paths) —— 模式语法、`address` 与 `path`、通配查询。
- [Vue 版本](/zh/vue/examples/team-invite) —— 同一个功能的 Vue 实现。
