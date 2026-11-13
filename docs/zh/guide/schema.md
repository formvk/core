# Schema

schema 是普通对象。`@formvk/schema` 定义它的结构、编译其中的表达式，并把它转换成字段 props。

## Schema 对象

Schema 使用小驼峰命名：Formily 的 `x-component` 对应 `component`，`x-component-props` 对应 `componentProps`。第三方扩展字段使用 `x` 前缀：

```ts
import { Schema } from '@formvk/schema'

const schema = new Schema({
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      component: 'Input',
      xCustomThing: true,
    },
  },
})
```

`ISchema` 是 interface，业务方可以通过声明合并扩展字段：

```ts
declare module '@formvk/schema' {
  interface ISchema {
    myWidget?: string
  }
}
```

## 类型安全的 DSL：`createFragment`

`createFragment` 提供一个小巧、类型安全的构造器。构造器返回函数，无参调用后得到普通的 `ISchema`。

```ts
import { createFragment, createSchema } from '@formvk/schema'

const f = createFragment()

const schema = createSchema({
  username: f.Field({ title: '用户名', component: 'Input' }),
  tags: f.Array(f.Field({ component: 'Input' })),
})
```

| 构造器                          | 产物                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'` 字段（number / boolean 通过显式 `type` 指定） |
| `f.Object(properties, schema?)` | `type: 'object'` 节点                                          |
| `f.Array(items, schema?)`       | `type: 'array'` 节点                                           |
| `f.Void(properties, schema?)`   | `type: 'void'` 布局节点                                        |

嵌套对象示例：

<SchemaObjectDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/schema-object.vue

<script setup lang="ts">
import SchemaObjectDemo from '../../demos/zh/schema-object.vue'
</script>

### 值类型推导

每个构造器都携带值类型：`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

```ts
import { createSchema } from '@formvk/schema'

const schema = createSchema({
  name: f.Field({ required: true }), // string
  age: f.Field<number>(), // number | undefined
  tags: f.Array(f.Field()), // string[]
})
```

### 组件 props 类型

给 `createFragment` 传入组件 props map，即可获得 `componentProps` 类型与动态构造器。前三个类型参数是相互独立的 map —— `F` 对应 field 组件、`V` 对应 void / 布局组件、`A` 对应 array 组件：

```ts
interface MyFieldComponents {
  Input: { placeholder?: string; maxLength?: number }
  NumberPicker: { min?: number; max?: number }
}
interface MyVoidComponents {
  Card: { title?: string }
}
interface MyArrayComponents {
  ArrayTable: { columns?: string[] }
}

const f = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents>()

f.Field({ component: 'Input', componentProps: { placeholder: '姓名' } })
f.Input({ componentProps: { maxLength: 10 } })
f.Void({}, { component: 'Card' })
f.Array(f.Field(), { component: 'ArrayTable' })
```

`f.Input(...)` 是自动设置 `component: 'Input'` 的快捷方式。声明在 `V` 中的组件会作为 void 节点处理，声明在 `A` 中的作为数组节点处理，其余都按字段处理。

只有声明过的组件才会生成动态构造器。不传组件 map 时 `f.Input` 会直接报类型错误，此时可以用 `f.Field({ component: 'Input' })`，或在 `F` 中声明该组件。

组件分类只存在于类型层面：运行时 fragment 是 Proxy，无法读取类型 map。因此 void 与 array 构造器还需要配套的运行时选项，否则会回退为 `type: 'string'`：

```ts
const f = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents>({
  voidComponentNames: ['Card'],
  arrayComponentNames: ['ArrayTable'],
})
```

完整选项见 [Schema DSL 参考](/zh/api/schema#createfragment)。

### Patches

`patches` 用于变换产出的 schema。带 `pre` 标记的 patch 会最先执行：

```ts
const f = createFragment({
  patches: [
    schema => ({ ...schema, 'x-region': 'cn' }),
    { pre: true, patch: schema => ({ ...schema, 'x-source': 'formvk' }) },
  ],
})
```

`f.transform(rawSchema)` 会把原始 `ISchema` 转换成展开形式，并对嵌套的 `properties`、`items` 应用同样的 patches。

## 表达式

所有支持表达式的 schema 值都可以写成 <code v-pre>{{ ... }}</code> 字符串。表达式在字段作用域中求值，可用变量包括 `$values`、`$form`、`$self`、`$record`、`$records`、`$index` 与 `$lookup`。

`createExpression` 可以带类型提示地构造这些字符串：

```ts
import { createExpression } from '@formvk/schema'

// 把作用域对象的形状作为泛型传入；不传时 T 默认为 object，没有任何属性补全。
const exp = createExpression<{ role: string; age: number; subscribe: boolean; email: string }>('$values')

exp.role.eq('admin') // '{{$values.role === "admin"}}'
exp.age.gte(18) // '{{$values.age >= 18}}'
exp.subscribe.and(exp.email) // '{{$values.subscribe && $values.email}}'
```

| 方法                        | 结果          |
| --------------------------- | ------------- |
| `eq` / `neq`                | `===` / `!==` |
| `gt` / `gte` / `lt` / `lte` | 比较运算      |
| `and` / `or`                | 逻辑运算      |
| `ter(a, b)`                 | 三元表达式    |

## 响应联动

reactions 用于字段联动：监听 `dependencies`，判断 `when`，命中后应用 `fulfill`，否则应用 `otherwise`：

```ts
const exp = createExpression<{ subscribe: boolean }>('$values')

const email = f.Field({
  title: '邮箱',
  component: 'Input',
  reactions: [
    {
      dependencies: ['subscribe'],
      when: exp.subscribe.eq(true),
      fulfill: { state: { visible: true, required: true } },
      otherwise: { state: { visible: false, required: false } },
    },
  ],
})
```

可运行示例见 [动态联动](/zh/examples/reactions)。

## 下一步

- [Vue 绑定](/zh/api/vue) —— `@formvk/vue` 导出的组件与 hooks。
- [数组列表](/zh/examples/array-list) —— 使用 `RecursionField` 的自定义数组组件。
