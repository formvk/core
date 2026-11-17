# 嵌套对象

`f.Object` 描述嵌套对象节点。它的子节点位于 `properties` 中，取值会合并进父级取值，因此表单值结构与 schema 结构一致。

<demo vue="../../demos/zh/schema-object.vue" stackblitz="true" />

## schema 描述了什么

```ts
const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: '姓名' }),
    role: f.Select({
      title: '角色',
      componentProps: {
        options: [
          { label: '开发者', value: 'developer' },
          { label: '设计师', value: 'designer' },
        ],
      },
    }),
  }),
})
```

- `f.Object` 产出 `type: 'object'` 节点，由 `ObjectField` 承载；子字段相对 `profile` 解析。
- `f.Input` 与 `f.Select` 是根据 `createSchemaField` 扁平组件映射生成的动态构造器。
- `defaultDecorator: 'FormItem'` 会为声明了 `title` 但未指定 `decorator` 的字段补上装饰器。装饰器契约见[自定义组件](/vue/custom-components#装饰器)。

## 值类型推导

每个构造器都携带值类型：`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

<<< @/snippets/schema/value-inference.ts

## 下一步

- [Schema 概览](/schema/) —— schema 节点与核心字段模型的对应关系。
- [数组列表](/vue/examples/array-list) —— 使用 `RecursionField` 的 `type: 'array'` 节点。
- [React 版本](/react/examples/schema-object) —— 同一个嵌套 schema 的 TSX 实现。
