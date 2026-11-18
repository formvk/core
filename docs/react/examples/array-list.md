# 数组列表

可重复的字段组就是普通的 `type: 'array'` 节点。数组组件负责布局，并用 `RecursionField` 按各自的 schema 渲染每一项。

<demo react="../../demos/react/zh/array-list.tsx" stackblitz="true" />

数组组件通过 `useField<ArrayField>()` 与 `useFieldSchema()` 读取字段及其 schema，再用 `<RecursionField schema={itemSchema} name={index} />` 渲染每一项。

## 数组组件

<<< @/snippets/react/array-list.tsx

- `field.value` 是数组值，`schema.items` 是每一项的 schema。
- `<RecursionField schema={schema.items} name={index} />` 会在该项路径下创建子字段（例如 `members.0.name`）。
- 数组字段提供 `push`、`pop`、`insert`、`remove`、`shift`、`unshift`、`move`、`moveUp` 与 `moveDown`。
- 组件用 `observer` 包裹，这是必需的，因为它要响应式地渲染 `field.value`。

## 大数组与 recordKey

数组项较多时（尤其是几十行以上），建议给数组节点配置 `recordKey`，并在数组组件里用 `field.getRecordKey(index)` 作为行 key：

```ts
const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // 隐藏字段，但属于数据模型：recordKey 需要 schema 声明过的 key
      id: f.Input({ hidden: true }),
      name: f.Input(),
    }),
    // id 在行内稳定且唯一
    { recordKey: 'id' }
  ),
})
```

```tsx
// 数组组件里：优先用 recordKey 生成稳定键，未配置时退回下标
{
  items.map((_item, index) => (
    <div key={field?.getRecordKey(index) ?? index}>
      <RecursionField schema={schema.items} name={index} />
    </div>
  ))
}
```

- `recordKey` 必须是 `items` schema 中声明过的稳定键（如行自带的 `id`），新增行时要生成唯一值；也支持函数形式 `recordKey: (record, index) => record.id ?? index`。
- 配置后，删除、插入、移动数组项时字段实例随数据行迁移，存活的字段不会卸载重建，行级校验状态、effects 订阅与由其他字段派生的状态都跟着数据走；行组件也随数据行移动，组件内部状态留在原来那一行。
- 未配置时行 key 退化为下标：注意字段值与校验反馈属于字段实例，数组操作会把实例重新寻址，所以它们不会错位；真正留在原地的是组件实例——React/Vue 按下标复用它，组件内部状态（非受控输入、焦点、展开状态、第三方组件内部 state）与新的数据行错配，存活字段也会重新绑定（demo 的「内部状态错位」与「字段重新绑定」两栏可以看到差异）。
- `recordKey` 只影响字段与行组件的复用，不改变提交的数据。

### 什么时候用

- 默认建议配置：只要行内可能承载组件内部状态——非受控输入、第三方组件（富文本、自动完成、日期面板）的草稿与展开状态、动画进度、焦点——就应配置。字段值与校验反馈由字段实例承载，数组操作会重新寻址，不会因 key 模式错位；组件内部状态一旦留在错误的行上，就是正确性问题，而不是性能问题。
- 行内存在组件内部状态时最容易暴露问题：组件状态属于组件实例，而不是某个位置。下标 key 下删除或插入后组件实例按下标复用，内部状态留在原位置、与新的数据行错配；`recordKey` 下组件随数据行移动，内部状态仍跟着原来那行。demo 里可以直接看到这种错配，而两种模式的校验错误数完全相同。
- 可以不用：纯展示、无内部状态、不会被删除/插入/重排的静态列表。此时下标 key 不会出错；但只要将来给行加一个输入框或折叠动画，下标 key 就会变成隐患。
- 不要用毫秒数做判断：在头部插入或删除时，每一行数据确实移动了位置，DOM 随之移动是必要且正确的代价；下标 key 的“原地打补丁”省下了移动，代价是把状态安在了错误的数据上——这是虚假的优化。demo 的耗时受设备影响，甚至可能显示下标 key 更快，但「内部状态错位」「字段重新绑定」这些由结构决定的计数不会骗人。
- 前提与成本：`recordKey` 需要 items schema 中声明过、行内稳定且唯一的值（如 `id`），新增行必须生成新的 key；key 重复会导致字段复用错乱。
- 行组件越重，重复挂载与重复派生的代价越显眼，但这只是放大器：决定要不要用 `recordKey` 的是“状态属于谁”，不是组件重量。

下面的 demo 用 100 行 × 10 列（900 个表单输入框 + 100 个下拉框），每隔 3 行把一个下拉框留空，所有字段都带 `required` 校验；每行还有一个只持有内部状态的输入框。点击「校验全部」触发全字段校验，再点击「删除首行」：两种 key 下 33 个校验错误都跟着空值行走，不会错位；区别在这个输入框——index key 下组件按下标复用，内部状态留在原位、与新的数据行错配，recordKey 下组件随数据行移动，内部状态与数据保持一致。每张卡片同时显示位置与数据 id，表格给出三个与设备无关的计数：

<demo react="../../demos/react/perf-array-list.tsx" />

> 「校验失败数」是校验失败字段的总数，两种模式都是 33，说明校验反馈跟着字段实例走；「内部状态错位」统计删除后内部状态与本行数据不一致的输入框数量；「字段重新绑定」统计删除首行时存活数据字段被重新绑定的次数。三者都由 key 模式决定，与设备无关。

## 取值形态

下面的 schema

```ts
f.ArrayItems(
  f.Object({
    name: f.Field(), // string | undefined
    email: f.Field(), // string | undefined
  })
)
```

会为 `members` 属性产出 `Array<{ name?: string; email?: string }>`。`createSchema` 会把它汇总进表单值类型，因此 `form.values.members[0].name` 是有类型的。

## 下一步

- [嵌套对象](/react/examples/schema-object) —— 对象 schema 与值类型推导。
- [React 绑定](/react/) —— 一览所有组件。
- [Vue 版本](/vue/examples/array-list) —— Vue SFC 中的同一个数组组件。
