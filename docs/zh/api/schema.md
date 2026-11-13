# Schema DSL 参考

`@formvk/schema` 提供 schema 模型、类型安全的 fragment DSL 与表达式工具，本身不依赖 Vue。`@formvk/vue` 全量重新导出了该包，因此下面的所有符号从两个包导入均可。

```ts
import { createSchema, createFragment, createExpression, Schema } from '@formvk/schema'
// 或
import { createSchema, createFragment, createExpression, Schema } from '@formvk/vue'
```

## `createSchema`

```ts
function createSchema<Properties extends Record<string, unknown>>(
  properties: Properties,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & { _$types$_: [IValues] }
```

组装根级 `type: 'object'` schema。每个属性可以是构造器（`createFragment` 返回的函数）、普通 `ISchema` 对象，或 `null` / `undefined`。构造器会被立即展开，返回值是可 JSON 序列化的普通 schema。

`_$types$_` 标记承载推导出的表单值类型（例如 `{ name: string; tags: string[] }`），仅用于类型层面，运行时不存在。

> Vue 用户可以完全跳过手写组件 props map：`@formvk/vue` 的 `createSchemaField` 接收扁平组件映射与可选的 `voidComponents` / `arrayComponents`，返回 `{ SchemaField, fragment }`，无需任何类型参数即可自动推断组件 props、scope 与值类型。参见 [Vue 绑定](/zh/api/vue#schemafield)。

## `createFragment`

```ts
function createFragment<
  F extends Record<string, any> = {},
  V extends Record<string, any> = {},
  A extends Record<string, any> = {},
  Scope extends object = {},
  DefaultDecorator extends AnyComponent<V> = AnyComponent<V>,
>(options?: FragmentOptions<V, DefaultDecorator>): Fragment<F, V, A, Scope, DefaultDecorator>
```

前三个类型参数是相互独立的组件 props map —— `F` 对应 field 组件，`V` 对应 void / 布局 / 装饰器组件，`A` 对应 array 组件，各自把组件名映射到它的 props 类型。

### 选项

| 选项                  | 类型                 | 说明                                                                                                                                   |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `patches`             | patch \| patch[]     | 应用到该 fragment 产出的每个 schema 上的 patch；`{ pre: true, patch }` 会优先执行。                                                    |
| `voidComponentNames`  | `string[]`           | 按 `type: 'void'` 节点处理的动态构造器名。                                                                                             |
| `arrayComponentNames` | `string[]`           | 按 `type: 'array'` 节点处理的动态构造器名，并自动填入 `component`。                                                                    |
| `defaultDecorator`    | `string \| 组件引用` | 为声明了 `title` 且未显式设置 `decorator` 的 `string` 字段补默认装饰器；其它节点类型与无 `title` 的字段不处理，显式 `decorator` 优先。 |

组件分类只存在于类型映射中，运行时 Proxy 无法读取 `F` / `V` / `A`，因此动态构造器需要 void / array 语义时，必须显式声明 `voidComponentNames` / `arrayComponentNames`。

开发构建下，两类误配会触发一次性 `console.warn`（生产产物中相关分支会被编译消除）：同一名字同时出现在两个列表中（运行时按 `array > void` 优先级静默取 array 分类）；对未登记的动态构造器按 array 方式传入 items 参数（会静默回退为 `type: 'string'` 字段节点）。

`defaultDecorator` 对齐 formily-pro 的 `defaultDecoratorPatch`，但保持 opt-in —— formvk 本身不内置 `FormItem` 组件：

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({ defaultDecorator: 'FormItem' })

f.Field({ title: '姓名', component: 'Input' })()
// { type: 'string', title: '姓名', component: 'Input', decorator: 'FormItem' }
```

装饰器名同样需要注册到传给 `SchemaField` 的 `components` 映射中。

TypeScript 不支持部分类型参数推断：显式传入组件 map 后，`DefaultDecorator` 不会从选项值推断，而是走默认值。需要收窄 `decoratorProps` 时，把它作为第五个类型参数传入：

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents, {}, 'FormItem'>({
  defaultDecorator: 'FormItem',
})

f.Field({ title: '姓名', decoratorProps: { label: '姓名' } }) // 按 FormItem 的 props 校验
```

### 基础构造器

| 构造器                          | 产出               | 说明                                                |
| ------------------------------- | ------------------ | --------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'`   | 数字、布尔、日期等需显式指定 `type`。               |
| `f.Object(properties, schema?)` | `type: 'object'`   | 嵌套对象节点。                                      |
| `f.Array(items, schema?)`       | `type: 'array'`    | `items` 为构造器或普通 `ISchema`。                  |
| `f.Void(properties, schema?)`   | `type: 'void'`     | 无值的布局节点。                                    |
| `f.transform(rawSchema)`        | 展开后的 `ISchema` | 转换普通 schema，并递归应用该 fragment 的 patches。 |

构造器返回的是函数：无参调用得到普通 `ISchema`；传入额外 patch 则在其基础上叠加。

### 动态构造器与组件 props map

三个 map 都是普通的 `name → props` 对象，每个分类一个：

```ts
interface FieldComponents {
  Input: { placeholder?: string }
}
interface VoidComponents {
  Card: { title?: string }
}
interface ArrayComponents {
  ArrayItems: { maxItems?: number }
}
```

把它们传给 `createFragment` 后，会为每个声明的组件生成一个快捷构造器：

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({
  arrayComponentNames: ['ArrayItems'],
})

f.Input({ componentProps: { placeholder: 'Name' } })
// 等价于 f.Field({ component: 'Input', componentProps: { placeholder: 'Name' } })

f.ArrayItems(f.Field())
// type: 'array'，且 component 为 'ArrayItems'
```

- 声明在 `F` 中的组件名生成字段构造器；`V` / `A` 中的分别生成 void / array 构造器。
- 使用未在对应 map 中声明的构造器会直接报类型错误；请改用 `f.Field({ component: 'X' })` 或在 map 中声明 `X`。
- `componentProps` 会按该组件注册的 props 类型做校验。
- 严格性刻意不对称：简写构造器（`f.Input`）只对已声明的名字存在，而 `component` / `decorator` 字符串字段接受任意字符串（经 `string & {}`），以兼容仅在运行时注册的组件。未声明的字符串名没有补全，`componentProps` 退化为宽松的 `Record<string, unknown>`；props 校验只对已声明名字生效。

### 字段级类型参数

`f.Field`、`f.Object`、`f.Void`、`f.Array` 支持字段级类型参数，无需断言即可校验 reactions 与子级：

| 构造器                           | 类型参数                                    |
| -------------------------------- | ------------------------------------------- |
| `f.Field<Value>(schema?)`        | 字段值类型。                                |
| `f.Object<Value, Scope, Record>` | 对象值类型、字段级 Scope、父级 record。     |
| `f.Void<Record, Scope>`          | 向子级暴露的 record、字段级 Scope。         |
| `f.Array<Item, Scope, Record>`   | 数组项类型、字段级 Scope、数组自身 record。 |

父级声明的类型会自动传递给 `properties` / `items` 中创建的子级：

```ts
interface MyScope {
  $moment: (value: string) => string
}

const f = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents, MyScope>()

f.Object<{ name: string; age: number }>({
  name: f.Field({
    required: true,
    reactions: (field, scope) => {
      field.value // string
      scope.$record // { name: string; age: number } & { $lookup: any; $index: number }
      scope.$moment // (value: string) => string
    },
  }),
  // 无需泛型：值类型由父级 record 的 `age: number` 收敛
  age: f.Field({ required: true }),
  layout: f.FormLayout(),
  // @ts-expect-error 未在父级 record 中声明的 key 只允许 void 子节点
  extra: f.Field(),
})
```

要点：

- 父级的值类型同时决定每个子级 creator 的值类型与子级的 `$record`。
- 未在父级 record 中声明的 key 只接受 void 构造器（布局节点）或普通 `ISchema`；在这些 key 上使用会产生值的字段属于类型错误。
- 继承 fragment 级的 `Scope`；传入不同的第二个类型参数（例如 `f.Object<Value, OtherScope>`）可以覆盖整棵子树的 Scope。
- `f.Void<Record>` 向子级暴露 `Record`，自身不产生值。
- `f.Array<Item>` 把 `items` 约束为 `SchemaCreator<Item>`，数组自身的值类型为 `Item[]`。数组项 creator 也需声明自身值类型（例如 `f.Object<Item>`），其子级才能继续获得上下文。
- object / array 节点位于各自的父容器中，自身 `$record` 默认为 `any`；需要时传入第三个类型参数：`f.Object<Value, Scope, ParentRecord>`、`f.Array<Item, Scope, ParentRecord>`。
- 为字段显式声明值泛型（例如 `f.Field<number>`）会关闭其余类型参数的推断（TypeScript 限制）。可能时省略 `Value`，交给父级 record 驱动。

## `ISchema` 字段参考

### 交互与展示

| 字段                                                | 类型                              | 说明                                                                      |
| --------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `title`                                             | `string` / 表达式                 | 字段标题。                                                                |
| `description`                                       | `string` / 表达式                 | 字段帮助文案。                                                            |
| `display`                                           | `'visible' \| 'hidden' \| 'none'` | `hidden` 保留布局占位；`none` 移除节点且其值不会出现在 `form.values` 中。 |
| `visible` / `hidden`                                | `boolean` / 表达式                | 写入 `display` 的语法糖。                                                 |
| `editable` / `disabled` / `readOnly` / `readPretty` | `boolean` / 表达式                | 写入字段交互模式的语法糖。                                                |
| `data`                                              | `any`                             | 挂载到字段上的自由数据，字段模型上可直接读取。                            |
| `content`                                           | `any`                             | 供装饰器组件使用的原始内容。                                              |
| `x*`                                                | `any`                             | 第三方扩展字段，以 `x` 前缀命名。                                         |

### 结构

| 字段                                                             | 说明                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `type`                                                           | `'string' \| 'number' \| 'boolean' \| 'object' \| 'array' \| 'void' \| 'date' \| 'datetime'` 或自定义字符串。 |
| `name`                                                           | 字段名，通常由父级 `properties` 的键推导。                                                                    |
| `properties`                                                     | object / void 节点的子节点。                                                                                  |
| `items`                                                          | array 节点的单项 schema（或元组形式的多个 schema）。                                                          |
| `additionalProperties` / `patternProperties` / `additionalItems` | 条件子节点定义。                                                                                              |
| `definitions` / `$ref`                                           | 可复用 schema 定义，通过 `#/...` 路径引用。                                                                   |
| `default`                                                        | 字段初始化时使用的默认值。                                                                                    |
| `enum`                                                           | 允许的取值，可使用 `{ label, value }` 形式。                                                                  |

### 校验字段

标准 JSON Schema 约束由 `@formvk/validator` 解释：`required`、`format`、`pattern`（**正则字符串**，不是交互模式）、`maxLength` / `minLength`、`maximum` / `minimum`、`exclusiveMaximum` / `exclusiveMinimum`、`multipleOf`、`maxItems` / `minItems` / `uniqueItems`、`maxProperties` / `minProperties`、`const`、`enum`，以及用于自定义规则的 `validator`。完整规则表见[校验参考](/zh/api/validator)。

### Formvk 扩展字段

| 字段                           | 说明                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `component`                    | 组件名，从 `components` 映射中解析；也可以是组件定义本身。 |
| `componentProps`               | 传给组件的 props，类型由 fragment 的组件 props map 约束。  |
| `decorator` / `decoratorProps` | 装饰器组件（例如表单项包装器）及其 props。                 |
| `validator`                    | 校验描述符、规则对象或数组。                               |
| `reactions`                    | 单个联动或联动数组，见[联动](#联动)。                      |
| `slot` / `slotNode`            | 把节点渲染到父组件的具名插槽中。                           |
| `compileOmitted`               | 指定不做表达式编译的字段路径。                             |

所有支持表达式的字段都可以填写 <code v-pre>{{ ... }}</code> 字符串，编译时按字段作用域求值。

## 联动

联动会监听 `dependencies`、求值 `when`，并执行 `fulfill` 或 `otherwise` 分支：

```ts
{
  dependencies: ['subscribe'],
  when: exp.subscribe.eq(true),
  fulfill: { state: { visible: true, required: true } },
  otherwise: { state: { visible: false, required: false } },
}
```

| 键                                    | 说明                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `dependencies`                        | 字段路径（字符串）、`{ name, type, source, property }` 对象，或名称到来源的映射。 |
| `when`                                | 表达式字符串或布尔值，决定执行哪个分支。                                          |
| `target`                              | 联动要写入的其他字段路径。                                                        |
| `effects`                             | 触发联动的生命周期事件，例如 `onFieldValueChange`。                               |
| `fulfill.state` / `otherwise.state`   | 应用到字段上的部分 `IGeneralFieldState`。                                         |
| `fulfill.schema` / `otherwise.schema` | 合并到节点上的 schema 片段。                                                      |
| `fulfill.run` / `otherwise.run`       | 作为代码执行的表达式字符串。                                                      |

联动也可以直接写成函数 `(field, scope) => void`，该函数运行在字段的响应式上下文中。

## `createExpression`

```ts
function createExpression<T extends object>(expression: string): Expression<T>
```

构建带类型提示的表达式字符串。把作用域对象的形状作为泛型传入；不传时 `T` 默认为 `object`，没有任何属性补全。

```ts
const exp = createExpression<{ plan: string; subscribe: boolean }>('$values')

exp.plan.eq('enterprise') // '{{$values.plan === "enterprise"}}'
exp.subscribe.not() // '{{!$values.subscribe}}'
exp.plan.ter('pro', 'free') // '{{$values.plan ? "pro" : "free"}}'
```

### 操作符

| 方法                           | 输出             |
| ------------------------------ | ---------------- |
| `eq(value, exp?)` / `neq(...)` | `===` / `!==`    |
| `gt` / `gte` / `lt` / `lte`    | 大小比较         |
| `and` / `or`                   | `&&` / `\|\|`    |
| `not()` / `bool()`             | `!x` / `!!x`     |
| `ter(a, b, exp?)`              | 三元 `x ? a : b` |

最后一个参数传 `true` 时按原始表达式插入，而不是 JSON 编码后的字面量。

### `.exp` 与 `.fn`

- `exp.exp.a.b` 返回不带 <code v-pre>{{ }}</code> 包裹的原始路径字符串 `$values.a.b`。
- `exp.fn.handler('$event')` 生成函数包装表达式，例如 <code v-pre>{{function __handler($event) {} return $values.handler($event)}}</code>。用 `'$args'` 表示展开参数（两者不能同时使用），也可以通过 `{ body, expand }` 注入自定义函数体。

### 表达式作用域

表达式与联动的求值作用域包括：`$form`、`$values`、`$self`（当前字段）、`$record` / `$records`（数组项上下文）、`$index`、`$lookup`（最近的 record 或根 values），以及通过 `scope` / `ExpressionScope` 注入的值；联动中还提供 `$dependencies`。

## `Schema` 运行时类

`new Schema(json, parent?)` 会把普通 `ISchema` 解析成相互链接的树（子节点也会变成 `Schema` 实例）。

| 成员                                                                                 | 说明                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| `addProperty` / `removeProperty` / `setProperties`                                   | 管理 `properties` 条目。                      |
| `addPatternProperty` / `setAdditionalProperties` / `setItems` / `setAdditionalItems` | 管理条件子节点与数组子节点。                  |
| `mapProperties(cb)` / `reduceProperties(cb, init)`                                   | 按顺序遍历属性。                              |
| `compile(scope?)`                                                                    | 按作用域编译所有表达式字符串，返回新 schema。 |
| `fromJSON(json)`                                                                     | 用普通对象重新填充当前实例。                  |
| `Schema.isSchemaInstance(value)`                                                     | 静态实例判断。                                |
| `Schema.compile` / `Schema.shallowCompile`                                           | 静态表达式编译工具。                          |
| `Schema.registerCompiler` / `Schema.registerPatches` / `Schema.silent`               | 自定义编译器与 patch 的扩展点。               |

## 下一步

- [表单模型与 Effects](/zh/api/core) —— `createForm`、字段模型、生命周期钩子与查询。
- [校验](/zh/api/validator) —— 规则、格式与校验注册中心。
- [Schema 指南](/zh/guide/schema) —— 结合可运行示例的 DSL 完整讲解。
