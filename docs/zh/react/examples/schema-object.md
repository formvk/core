# 嵌套对象

`f.Object` 描述嵌套对象节点。它的子节点放在 `properties` 下，取值会合并进父级值，因此表单值的形状跟随 schema 的形状。

<ReactMount :component="ReactSchemaObjectDemo" />

schema 与 fragment 构造器原样从 `@formvk/react` 导入，只有渲染包裹方式不同：

<<< @/demos/react/zh/schema-object.tsx

<script setup lang="ts">
import ReactSchemaObjectDemo from '../../../demos/react/zh/schema-object'
</script>

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
- `defaultDecorator: 'FormItem'` 会为声明了 `title` 且没有显式 `decorator` 的字段包上装饰器。装饰器契约见[自定义组件](/zh/react/custom-components#装饰器)。

## 值类型推导

每个构造器都携带值类型：`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

<<< @/snippets/schema/value-inference.ts

## 下一步

- [Schema 概览](/zh/schema/) —— schema 节点如何映射到核心字段模型。
- [数组列表](/zh/react/examples/array-list) —— 配合 `RecursionField` 的 `type: 'array'` 节点。
- [Vue 版本](/zh/vue/examples/schema-object) —— 同一份嵌套 schema 的 Vue 单文件实现。
