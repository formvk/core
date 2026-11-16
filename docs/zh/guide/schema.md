# Schema

schema 是普通对象。`@formvk/schema` 定义它的结构、编译其中的表达式，并把它转换成字段 props。

## Schema 对象

Schema 使用小驼峰命名：Formily 的 `x-component` 对应 `component`，`x-component-props` 对应 `componentProps`。第三方扩展字段使用 `x` 前缀：

<<< @/snippets/schema/schema-instance.ts#instance

`ISchema` 是 interface，业务方可以通过声明合并扩展字段：

<<< @/snippets/schema/schema-instance.ts#declaration-merging

## 类型安全的 DSL：`createFragment`

`createFragment` 提供一个小巧、类型安全的构造器。构造器返回函数，无参调用后得到普通的 `ISchema`。

<<< @/snippets/schema/fragment-basics.ts

| 构造器                          | 产物                                                           |
| ------------------------------- | -------------------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'` 字段（number / boolean 通过显式 `type` 指定） |
| `f.Object(properties, schema?)` | `type: 'object'` 节点                                          |
| `f.Array(items, schema?)`       | `type: 'array'` 节点                                           |
| `f.Void(properties, schema?)`   | `type: 'void'` 布局节点                                        |

嵌套对象示例：

### Vue 3

<SchemaObjectDemo />

这个演示本身就是一个 Vue 单文件组件：

<<< @/demos/zh/schema-object.vue

### React（TSX）

<ReactMount :component="ReactSchemaObjectDemo" />

schema 与 fragment 构造器原样从 `@formvk/react` 导入，只有渲染包裹方式不同：

<<< @/demos/react/zh/schema-object.tsx

<script setup lang="ts">
import SchemaObjectDemo from '../../demos/zh/schema-object.vue'
import ReactSchemaObjectDemo from '../../demos/react/zh/schema-object'
</script>

### 值类型推导

每个构造器都携带值类型：`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

<<< @/snippets/schema/value-inference.ts

### 组件 props 类型

给 `createFragment` 传入组件 props map，即可获得 `componentProps` 类型与动态构造器。前三个类型参数是相互独立的 map —— `F` 对应 field 组件、`V` 对应 void / 布局组件、`A` 对应 array 组件：

<<< @/snippets/schema/component-maps.ts#creators

`f.Input(...)` 是自动设置 `component: 'Input'` 的快捷方式。声明在 `V` 中的组件会作为 void 节点处理，声明在 `A` 中的作为数组节点处理，其余都按字段处理。

只有声明过的组件才会生成动态构造器。不传组件 map 时 `f.Input` 会直接报类型错误，此时可以用 `f.Field({ component: 'Input' })`，或在 `F` 中声明该组件。

组件分类只存在于类型层面：运行时 fragment 是 Proxy，无法读取类型 map。因此 void 与 array 构造器还需要配套的运行时选项，否则会回退为 `type: 'string'`：

<<< @/snippets/schema/component-maps.ts#runtime-names

完整选项见 [Schema DSL 参考](/zh/api/schema#createfragment)。

### Patches

`patches` 用于变换产出的 schema。带 `pre` 标记的 patch 会最先执行：

<<< @/snippets/schema/patches.ts

`f.transform(rawSchema)` 会把原始 `ISchema` 转换成展开形式，并对嵌套的 `properties`、`items` 应用同样的 patches。

## 表达式

所有支持表达式的 schema 值都可以写成 <code v-pre>{{ ... }}</code> 字符串。表达式在字段作用域中求值，可用变量包括 `$values`、`$form`、`$self`、`$record`、`$records`、`$index` 与 `$lookup`。

`createExpression` 可以带类型提示地构造这些字符串：

<<< @/snippets/schema/expression.ts#guide-expression

| 方法                        | 结果          |
| --------------------------- | ------------- |
| `eq` / `neq`                | `===` / `!==` |
| `gt` / `gte` / `lt` / `lte` | 比较运算      |
| `and` / `or`                | 逻辑运算      |
| `ter(a, b)`                 | 三元表达式    |

## 响应联动

reactions 用于字段联动：监听 `dependencies`，判断 `when`，命中后应用 `fulfill`，否则应用 `otherwise`：

<<< @/snippets/schema/reactions.ts#field-reaction

可运行示例见 [动态联动](/zh/examples/reactions)。

## 下一步

- [Vue 绑定](/zh/api/vue) / [React 绑定](/zh/api/react) —— 两个框架绑定导出的组件与 hooks。
- [数组列表](/zh/examples/array-list) —— 使用 `RecursionField` 的自定义数组组件。
