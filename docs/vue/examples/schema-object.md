# 嵌套对象

`f.Object` 描述嵌套对象节点。它的子节点放在 `properties` 下，取值会合并进父级取值，因此表单取值的形态与 schema 的形态一致。

<demo vue="../../demos/zh/schema-object.vue" stackblitz="true" />

## 这份 schema 描述了什么

```ts
const schema = createSchema({
  profile: f.Object({
    name: f.Input({ title: 'Name' }),
    role: f.Select({
      title: 'Role',
      componentProps: {
        options: [
          { label: 'Developer', value: 'developer' },
          { label: 'Designer', value: 'designer' },
        ],
      },
    }),
  }),
})
```

- `f.Object` 产出由 `ObjectField` 支撑的 `type: 'object'` 节点，其子节点相对于 `profile` 解析。
- `f.Input` 与 `f.Select` 是根据传给 `createSchemaField` 的扁平组件映射生成的动态构造器。
- `defaultDecorator: 'FormItem'` 会包裹声明了 `title` 但未显式指定装饰器的字段。装饰器契约见[自定义组件](/vue/custom-components#装饰器)。

## 值类型推导

每个构造器都携带值类型。`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

<<< @/snippets/schema/value-inference.ts

## 下一步

- [Schema 概览](/schema/) —— schema 节点如何映射到核心字段模型。
- [数组列表](/vue/examples/array-list) —— 用 `RecursionField` 渲染 `type: 'array'` 节点。
- [React 版本](/react/examples/schema-object) —— TSX 中的同一份嵌套 schema。
