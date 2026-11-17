# Schema

schema 是普通对象。`@formvk/schema` 定义它的结构、编译其中的表达式，并把它转换成核心字段模型的 props 与状态。schema 层与框架无关：同一个对象可以原样驱动 Vue 与 React 绑定。

## Schema 如何映射到核心模型

每个 schema 节点都恰好变成一个字段模型，schema 上的字段分别负责模型状态、校验与渲染：

| Schema                                                                   | 核心概念                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `type: 'string' \| 'number' \| 'boolean' \| 'date'`                      | `Field` —— 持有标量值                                          |
| `type: 'object'`                                                         | `ObjectField` —— 持有对象值，子节点在 `properties`             |
| `type: 'array'`                                                          | `ArrayField` —— 持有数组值，项在 `items`                       |
| `type: 'void'`                                                           | `VoidField` —— 仅布局，不持有值                                |
| `name` / `properties` / `items`                                          | 字段图拓扑：`address`、`path`、`parent`、`records`             |
| `pattern` / `display` / `title` / `description` / `data`                 | 字段状态 —— 见[表单模型](/core/#字段模型)                      |
| `required` / `format` / `validator` / `maxLength` / …                    | 校验 —— 见[校验](/core/validation)                             |
| `reactions`                                                              | 由其他路径驱动的响应式字段更新 —— schema 形态的 `onFieldReact` |
| `component` / `componentProps` / `decorator` / `decoratorProps` / `slot` | 渲染：由 Vue / React `SchemaField` 的组件映射解析              |

这个映射是单向的：schema 描述要创建什么，表单模型持有运行时状态。更新模型永远不会回写 schema，schema 也可以跨表单复用。

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

`createSchema({...})` 把构造器、普通 `ISchema` 对象或 `null` / `undefined` 组装成根对象 schema。结果是 JSON 可序列化的，并携带推导出的表单值类型。

### 值类型推导

每个构造器都携带值类型：`f.Field<number>()` 得到 `number | undefined`，`f.Field({ required: true })` 得到 `string`，`f.Array(f.Field())` 得到 `string[]`。`createSchema` 会把它们汇总成一个对象类型：

<<< @/snippets/schema/value-inference.ts

如果值类型接口已经存在（表单通常本来就以它标注），直接声明即可：`createSchema<Values>({...})` 会把它注入为根级 record 上下文，顶层构造器里的 `field.record` 与 `scope.$values` 都具有完整类型。注入的类型同时决定每个键的值类型，`field.value` 也因此有类型。这些构造器不要写值泛型（用 `f.Field({...})`，而不是 `f.Field<number>({...})`），否则 TypeScript 会停止推断其余类型参数，`field.record` 退化为 `any`。

### 组件 props 类型

给 `createFragment` 传入组件 map（组件名 → 组件类型），即可获得 `componentProps` 类型与动态构造器。前三个类型参数是相互独立的组件 map —— `F` 对应 field 组件、`V` 对应 void / 布局组件、`A` 对应 array 组件：

<<< @/snippets/schema/component-maps.ts#creators

`f.Input(...)` 是自动设置 `component: 'Input'` 的快捷方式。声明在 `V` 中的组件会作为 void 节点处理，声明在 `A` 中的作为数组节点处理，其余都按字段处理。

只有声明过的组件才会生成动态构造器。不传组件 map 时 `f.Input` 会直接报类型错误，此时可以用 `f.Field({ component: 'Input' })`，或在 `F` 中声明该组件。

组件分类只存在于类型层面：运行时 fragment 是 Proxy，无法读取类型 map。因此 void 与 array 构造器还需要配套的运行时选项，否则会回退为 `type: 'string'`：

<<< @/snippets/schema/component-maps.ts#runtime-names

两个绑定包都提供 `createSchemaField`：它接收扁平组件映射，自动推断三份组件 map —— 见 [Vue](/vue/#createschemafield) 与 [React](/react/#createschemafield)。

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

reaction 就是一个普通函数 `(field) => void`。它运行在字段的响应式上下文中，读取到的任何可观察值（`field.value`、`field.record.plan`、`field.form.values.plan`、外部 store）都会成为依赖，变化时函数自动重跑：

<<< @/snippets/schema/reactions.ts#field-reaction

`field.record` 是父级 record，对顶层字段而言就是整份表单值。给 `createSchema<Values>` 传入值类型即可把它注入为根级 record 上下文；不传类型参数时 `field.record` 是 `any`。

心智模型与 effect 一致：读取需要的数据，再写入需要变化的状态。优先使用函数形式；对象形式（`dependencies` / `when` / `fulfill`）只在联动必须保存在纯 JSON schema 中时才需要。

可运行示例见[动态联动](/vue/examples/reactions)。

## 表达式、reactions 还是 effects？

三者都是把 schema 与其他数据连接起来，按“你要改变什么”来选择：

| 你要…                                                        | 使用       | 原因                                         |
| ------------------------------------------------------------ | ---------- | -------------------------------------------- |
| 根据取值派生组件 prop 或校验上限                             | 表达式     | 编译期字符串，留在 schema 内部               |
| 其他字段变化时切换 `visible` / `required` / `componentProps` | reaction   | 函数读取 `field.form.values`，变化时自动重跑 |
| 在变化时执行命令式逻辑（校验、清空、埋点）                   | effect     | 可访问完整的 `field` / `form`，支持异步      |
| 只给 UI 使用的派生数据                                       | `computed` | 不属于 schema，也不需要额外字段状态来同步    |

[团队邀请示例](/vue/examples/team-invite)三者配合使用：reactions 控制 `seats`、`billingEmail` 与 `message` 的显隐；effects 在 `plan` 变化时重新校验限制，并在成员被删空时补回一行；`computed` 渲染邀请汇总。

选择经验：

- 单个派生值优先用表达式 —— 不需要管理订阅，也不引入额外状态。
- 结果是字段状态变化（`visible`、`required`、`componentProps`）时优先用 reaction。
- 逻辑是一串动作或需要与外部交互时用 effect。

## 下一步

- [Schema 参考](/schema/reference) —— 所有构造器选项与 `ISchema` 字段。
- [表单模型](/core/) —— 这些 schema 创建出的字段模型。
- [Vue 示例](/vue/examples/basic-form) / [React 示例](/react/examples/basic-form) —— 用 DSL 构建的完整表单。
