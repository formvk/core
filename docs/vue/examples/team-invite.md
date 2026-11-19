# 业务场景：团队邀请

其他示例都只展示单一能力。这个示例是一条完整的产品流程：管理员创建团队、选择套餐并邀请成员的 SaaS 引导表单。它按真实功能的构建方式来写 —— 先梳理业务规则，再写 schema —— 因此能回答参考文档回答不了的问题：**什么时候该用哪种能力？**

<demo vue="../../demos/zh/team-invite.vue" stackblitz="true" />

下面每一节都指向文件中实现该规则的位置。

## 这个功能需要什么

| #   | 业务规则                                               | 使用的能力                           | 参考                                    |
| --- | ------------------------------------------------------ | ------------------------------------ | --------------------------------------- |
| 1   | schema、校验器与提交处理函数共享一份有类型的取值模型   | `createForm<TeamInviteValues>`       | [表单模型](/core/)                      |
| 2   | 团队名必填，长度为 3–30 个字符                         | 规则数组                             | [校验](/core/validation)                |
| 3   | 席位与账单邮箱只在付费套餐下存在，并且变为必填         | `reactions`                          | [联动](/schema/#响应联动)               |
| 4   | 邀请留言只在立即发送邮件时出现                         | `reactions`                          | [Schema 概览](/schema/#响应联动)        |
| 5   | 成员是可增删的可重复字段组                             | `ArrayField` + `ArrayItems`          | [数组列表](/vue/examples/array-list)    |
| 6   | 席位数必须覆盖所有已邀请成员，且不超过套餐上限         | 读取 `ctx.form` 的自定义 `validator` | [校验](/core/validation#编写自定义规则) |
| 7   | 同一邮箱不能重复邀请，已被占用的邮箱在失焦时被拒绝     | 跨字段 + 异步校验                    | [校验](/core/validation#控制校验时机)   |
| 8   | 删除最后一行成员时保留一行空行；关闭邮件发送时清空留言 | `effects`                            | [Effects](/core/#effects)               |
| 9   | 工具栏操作给每个成员分配角色                           | 路径通配符 + `form.setFieldState`    | [路径系统](/core/paths)                 |
| 10  | 实时汇总统计已就绪的邀请数                             | `computed` 中的可观察值              | [响应式](/core/reactivity)              |

本页其余部分会按顺序逐个说明。

## 1. 先定义一次值类型

先定义 API 接收的数据结构，而不是先写 schema。`createForm<T>` 让 `form.values` 在任何地方都有类型，这个接口同时也充当了 payload 的文档：

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

const form = createForm<TeamInviteValues>({
  values: {
    teamName: '',
    plan: 'free',
    seats: 3,
    billingEmail: '',
    members: [{ name: '', email: '', role: 'member' }],
    inviteNow: true,
    message: '',
  },
})
```

**为什么不从 schema 推导类型？** 可以推导（`createSchema` 会携带 `_$types$_`），但表单值类型也被校验器与提交处理函数使用。先声明它能让 schema 保持诚实：字段名拼错会表现为类型错误，而不是悄悄缺失一个值。

## 2. 用组件映射构建 schema

`createSchemaOptions` 一次性完成组件分类并返回带类型的 `fragment`，无需手写组件映射：

```ts
const { fragment: f } = createSchemaOptions({
  components: demoComponents, // Input, NumberInput, Select, Checkbox, Textarea
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})
```

`defaultDecorator: 'FormItem'` 会为每个带标题的 string 字段包裹标签 / 必填标记 / 错误插槽。它有意跳过数组节点，因此 `members` 需要显式设置 `decorator: 'FormItem'`。

## 3. 条件区块：`reactions`

**什么时候用：** 字段的可见性、必填标记、标题或组件 props 依赖其他取值。这是最常见的场景。

仅付费套餐可见的区块（`seats`、`billingEmail`）共用同一种 reaction 写法：

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

- reaction 就是一个普通函数 `(field) => void`。在其中读取 `field.form.values.plan` 就会让 `plan` 成为依赖 —— 不需要维护与代码同步的路径列表。
- 赋值 `field.visible` / `field.required` 就是全部更新逻辑。`plan` 变化时函数会自动重跑。
- `visible: false` 会把 `display` 设为 `'none'`。字段不再渲染、被 `form.validate()` 跳过，**并且它的取值会从 `form.values` 中移除** —— 免费套餐提交时不会带上 `seats` 或 `billingEmail`。对于“这个套餐没有这个区块”的语义，这通常正是你要的效果。
- 如果字段需要保留取值，改用 `hidden: true`：节点会消失，但取值仍留在 payload 中。

邀请留言用的是同一个函数，只读取 `inviteNow`，不修改 `required`。

## 4. 成员：可重复字段组

数组节点就是值为数组的普通字段。`ArrayItems` 组件负责布局，并用 `RecursionField` 渲染每一项；schema 只描述项的形态：

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

- 值类型被推导为 `Member[]`，`form.values.members[0].email` 有类型。
- `push`、`insert`、`remove`、`move` 等方法都在 `ArrayField` 上 —— 组件实现见[数组列表示例](/vue/examples/array-list)。
- 每个项字段的 address 与 path 相同（`members.0.email`），因为中间没有 `void` 节点。

**批量更新。** 工具栏按钮展示了路径的作用：通配符可以作用到每一项，无需自己遍历字段。

```ts
form.setFieldState('members.*.role', field => {
  field.value = 'member'
})
```

需要在整组范围内读取时（例如检查重复或生成汇总），使用 `form.query('members.*.email').map(field => field.value)`。

## 5. 依赖其他字段的校验

静态规则键（`minLength`、`format`、`maximum`）覆盖单字段校验。这里的业务规则需要上下文，因此使用自定义校验函数。第三个参数携带 `{ field, form }`：

```ts
// Seats cannot exceed the plan limit
{
  validator: (value, _rule, { form }) => {
    const plan = (form.values.plan ?? 'free') as Plan
    return typeof value !== 'number' || value <= PLAN_SEATS[plan] || `The ${plan} plan includes at most ${PLAN_SEATS[plan]} seats`
  },
},
// Seats cannot be fewer than the members already invited
{
  validator: (value, _rule, { form }) => {
    const invited = (form.values.members ?? []).length
    return typeof value !== 'number' || value >= invited || `You already invited ${invited} members`
  },
},
```

另外两种写法也值得借鉴：

- **数组内部的重复。** 通过过滤 `form.values.members` 与同级项比较；规则运行在该字段上，可以同时标记两个重复项。
- **开销较大的检查。** 可用性规则标记了 `triggerType: 'onBlur'`，因此会在用户离开字段时运行，而不是每次按键都运行。`form.submit()` 仍然会执行它。

```ts
{ triggerType: 'onBlur', validator: ensureEmailAvailable }
```

空值会跳过所有非 `required` 的规则，因此清空的可选字段不会触发格式错误。数组级规则（套餐上限）写在 `members` 节点本身上 —— 它的 `value` 就是整个数组。

## 6. 跨字段副作用：`effects`

**什么时候用：** 结果不只是字段状态，而是另一个字段的**取值**，或者需要分支的代码。reaction 以声明式方式修改状态；effect 则是普通回调。

```ts
const form = createForm<TeamInviteValues>({
  values: { ... },
  effects() {
    // Keep at least one editable row
    onFieldValueChange('members', (_field, form) => {
      if (form.values.members.length === 0) {
        form.setValuesIn('members', [{}])
      }
    })
    // Cross-field rules only run when their own field is validated,
    // so a plan change re-checks the limits that depend on it
    onFieldValueChange('plan', (_field, form) => {
      form.validate('seats')
      form.validate('members')
    })
    // Turning invitations off clears the drafted message
    onFieldValueChange('inviteNow', (field, form) => {
      if (!field.value) {
        form.setValuesIn('message', '')
      }
    })
  },
})
```

经验法则：

- 当需求是“当 X 时，这个字段变为可见 / 必填 / 禁用”时，使用 **reaction**。
- 当需求是“当 X 时，对别的东西做 Y”时，使用 **effect** —— 清空取值、增加一行、调用 API、更新 store。
- 跨字段 **validator** 不会在依赖变化时自动重跑。如果依赖的是另一个字段，就在 effect 中对该字段调用 `form.validate(pattern)`，如上文套餐变化的处理。
- 在 `createForm` 中注册的 effect 与表单同生命周期。组件级 effect 使用 `@formvk/vue` 的 `useFormEffects` —— 见 [Hooks](/vue/hooks)。

## 7. 提交、重置与反馈

```ts
async function onSubmit() {
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    error.value = 'Please fix the highlighted fields.'
  }
}
```

- `form.submit()` 会校验所有可编辑字段，成功后 resolve 普通取值（`display: 'none'` 的字段会被排除），失败时 reject 错误列表。
- promise 未完成期间 `form.submitting` 为 `true` —— 把它绑定到按钮上。
- `form.reset()` 恢复初始值，包括初始的成员行。
- 要定位到第一个问题，读取 `form.errors[0].path` 并聚焦该字段。要只校验某一组而不是整个表单，传入路径模式：`form.validate('members.*.email')`。

## 8. 在 UI 中读取实时状态

底部的汇总是普通的 `computed`，读取可观察值：

```ts
const summary = computed(() => {
  const plan = form.values.plan ?? 'free'
  const members = form.values.members ?? []
  const ready = members.filter(member => member?.email).length
  return `${ready}/${members.length} invitations ready · ${plan} allows ${PLAN_SEATS[plan]} members`
})
```

Vue 会自动追踪这些读取。在 React 中同样的代码要放在 `observer` 组件里 —— 这就是全部区别；见 [React 版本](/react/examples/team-invite)。

## 选择正确的机制

| 需求                                   | 使用                                          |
| -------------------------------------- | --------------------------------------------- |
| 根据其他取值显示 / 隐藏 / 必填字段     | `reactions`                                   |
| 在变化时改写取值、增加一行、调用 API   | `effects`                                     |
| 用静态约束检查单个取值                 | 内置规则键                                    |
| 用兄弟项、数组或远程数据检查某个取值   | 自定义 `validator` 配合 `ctx.form`            |
| 计算标题、placeholder 或 disabled 标记 | schema 表达式（<code v-pre>{{ ... }}</code>） |
| 一次更新多个字段                       | 路径通配符 + `setFieldState` / `query`        |
| 展示已提交取值的只读摘要               | `mapReadPretty` / `FormConsumer`              |

## 下一步

- [动态联动](/vue/examples/reactions) —— 最小的 reaction 示例。
- [数组列表](/vue/examples/array-list) —— 单独使用数组组件。
- [校验](/core/validation) —— 所有规则形态与触发时机。
- [路径系统](/core/paths) —— 模式、`address` 与 `path` 的区别、通配符查询。
- [React 版本](/react/examples/team-invite) —— TSX 中的同一功能。
