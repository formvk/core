# Schema DSL 参考

`@formvk/schema` 提供 schema 模型、带类型的 fragment DSL 与表达式辅助函数，不依赖 Vue。`@formvk/vue` 完整重新导出该包，因此下面所有符号都可以从任一包导入。

```ts
import { createSchema, createFragment, createExpression, Schema } from '@formvk/schema'
// or
import { createSchema, createFragment, createExpression, Schema } from '@formvk/vue'
```

## `createSchema`

```ts
// Inject the value type explicitly
function createSchema<IValues extends object, IScope extends object = {}>(
  properties: SchemaPropertiesInjection<IValues, IScope>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & { _$types$_: [IValues] }

// Infer the value type from the creators
function createSchema<Properties extends Record<string, unknown>, IValues extends SchemaPropertiesValues<Properties>>(
  properties: Properties & ValidateSchemaProperties<Properties>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & { _$types$_: [IValues] }
```

组装根 `type: 'object'` schema。每个属性可以接受构造器（`createFragment` 返回的函数）、普通 `ISchema` 对象，或 `null` / `undefined`。构造器会立即展开，因此返回值是可 JSON 序列化的普通 schema。

不传类型参数时，值类型由构造器推导，而顶层构造器看不到它：TypeScript 不会把对象字面量的推导类型传播给同级属性，因此 `field.record` 仍是 `any`。显式传入值类型即可把它注入为根级 record 上下文 —— 在每个顶层构造器内，`field.record` 变为 `IValues`，`scope.$record` 变为 `IValues & { $lookup, $index }`，`scope.$values` 变为 `IValues`：

```ts
interface InviteValues {
  plan?: string
  seats?: number
}

const schema = createSchema<InviteValues>({
  plan: f.Field({ component: 'Select' }),
  seats: f.Field({
    reactions: (field, scope) => {
      // field.record is InviteValues, scope.$values is InviteValues
      field.visible = field.record.plan !== 'free'
    },
  }),
})
```

注入同时决定每个键的值类型：放在已声明键下的构造器会从该键推导值类型，因此在 `seats?: number` 下，`reactions` 里的 `field.value` 是 `number | undefined`；在 `plan?: string` 下则是 `string | undefined`。接口中不存在的键只接受 void 构造器、普通 `ISchema` 对象或空值。顶层构造器不要写值泛型（用 `f.Field({...})` 而不是 `f.Field<number>({...})`）—— 显式泛型会让 TypeScript 停止推断构造器其余的类型参数，`field.record` 又会退化为 `any`。对象取值的键（嵌套对象、数组）保留容器自身推导的 record，因此 `f.Object` / `f.ArrayItems` 按其自身内容获得类型。

`_$types$_` 标记携带表单值类型（例如 `{ name: string; tags: string[] }`）。它只是类型层面的元数据，运行时永远不会出现。

在推导模式下，所有汇总的键都是必选的：字段能否缺省由其值类型表达（非 `required` 字段贡献 `T | undefined`），而不是靠可选修饰符。这样，推导出的对象构造器可以提取成变量，并在显式标注类型的父级下复用 —— 取值形态匹配时 `f.Object<FormValues>({ address })` 会被接受，不匹配则报错。对象取值的键只检查值槽位，因为容器构造器自身的 record 是它的内容类型，而不是根 record。`f.Void` 与推导模式的 `createSchema` 遵循同样的汇总规则。

> Vue 用户完全可以跳过手写组件 map：`@formvk/vue` 的 `createSchemaField` 接收扁平组件映射与可选的 `voidComponents` / `arrayComponents`，返回 `{ SchemaField, fragment }`，并在无需类型参数的情况下推断组件 map、作用域与值类型。见 [Vue 绑定](/vue/#schemafield)。

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

前三个类型参数是相互独立的组件 map —— `F` 对应 field 组件，`V` 对应 void / 布局 / 装饰器组件，`A` 对应 array 组件。每个 map 把组件名映射到组件类型，`componentProps` 与 `decoratorProps` 会自动从中提取（Vue 组件取 `$props`，函数组件与类组件取第一个参数）。

### 选项

| 选项                  | 类型                  | 说明                                                                                                                                       |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `patches`             | patch \| patch[]      | 应用于该 fragment 产出的每个 schema 的 patch。带 `{ pre: true, patch }` 的条目会最先执行。                                                 |
| `voidComponentNames`  | `string[]`            | 产出 `type: 'void'` 节点的动态构造器名称。                                                                                                 |
| `arrayComponentNames` | `string[]`            | 产出 `type: 'array'` 节点并预填 `component` 的动态构造器名称。                                                                             |
| `defaultDecorator`    | `string \| component` | 为声明了 `title` 但未指定 `decorator` 的 `string` 字段添加的装饰器。其他节点类型以及没有 `title` 的字段不受影响。显式的 `decorator` 优先。 |

组件分类只存在于类型 map 中。运行时 Proxy 无法读取 `F` / `V` / `A`，因此当动态构造器需要产出这些节点类型时，必须显式声明 `voidComponentNames` / `arrayComponentNames`。

在开发构建中，两种错误配置会输出一次 `console.warn`（这些检查在生产构建中会被移除）：同一个名字同时声明在两个列表中 —— 在 `array > void` 的优先级下数组分类静默胜出；以及调用未注册的动态构造器并传入数组式 items 参数 —— 此时会静默回退为 `type: 'string'` 字段节点。

`defaultDecorator` 对应 formily-pro 的 `defaultDecoratorPatch`，但保持按需开启，因为 formvk 不内置 `FormItem` 组件：

<<< @/snippets/schema/decorator.ts#basic

装饰器名还必须注册到传给 `SchemaField` 的 `components` 映射中。

TypeScript 不支持部分类型参数推断：一旦显式传入组件 map，`DefaultDecorator` 会退回默认值，而不会从选项中推断。把它作为第五个类型参数传入即可收窄 `decoratorProps`：

<<< @/snippets/schema/decorator.ts#fifth-arg

### 基础构造器

| 构造器                          | 产物               | 说明                                                |
| ------------------------------- | ------------------ | --------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'`   | 需要 number、boolean 与日期时显式覆盖 `type`。      |
| `f.Object(properties, schema?)` | `type: 'object'`   | 嵌套对象节点。                                      |
| `f.Array(items, schema?)`       | `type: 'array'`    | `items` 是构造器或普通 `ISchema`。                  |
| `f.Void(properties, schema?)`   | `type: 'void'`     | 不持有值的布局节点。                                |
| `f.transform(rawSchema)`        | 展开后的 `ISchema` | 转换原始 schema，并递归应用该 fragment 的 patches。 |

构造器返回一个函数。无参调用得到普通 `ISchema`；传入额外 patches 调用则会在其之上应用这些 patch。

### 动态构造器与组件映射

三个 map 都是普通的 `name → component` 对象，每个分类一个：

<<< @/snippets/schema/dynamic-creators.ts#maps

把它们传给 `createFragment`，会为每个声明的组件生成一个快捷构造器：

<<< @/snippets/schema/dynamic-creators.ts#creators

- 声明在 `F` 中的名字生成 field 构造器；声明在 `V` 与 `A` 中的名字生成 void / array 构造器。
- 构造器未在对应 map 中声明会报类型错误。可以改用 `f.Field({ component: 'X' })`，或在 map 中声明 `X`。
- `componentProps` 会按从该组件提取的 props 校验；任意叶子（或整个 props 对象）都可以是 <code v-pre>{{...}}</code> 表达式。普通类型错误的字符串仍会被拒绝 —— <code v-pre>maxLength: '10'</code> 是无效的，而 <code v-pre>maxLength: '{{$values.limit}}'</code> 是允许的。
- 严格性是刻意不对称的：快捷构造器（`f.Input`）只为已声明的名字存在，而 `component` / `decorator` 字符串字段接受任意字符串（通过 `string & {}`），以便只在运行时注册的组件仍然可用。未声明的字符串名字没有自动补全，`componentProps` 会退回宽松的 `Record<string, unknown>`；props 检查只对已声明的名字生效。

### 字段级类型参数

`f.Field`、`f.Object`、`f.Void` 与 `f.Array` 接受字段级类型参数，使 reactions 与子节点无需类型断言即可获得检查：

| 构造器                                   | 类型参数                                                             |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `f.Field<Value, Scope, Record, Values>`  | 字段值类型、字段级作用域、父级 record、子级 reactions 的 `$values`。 |
| `f.Object<Value, Scope, Record, Values>` | 对象值类型、字段级作用域、父级 record、子级 reactions 的 `$values`。 |
| `f.Void<Record, Scope, Values>`          | 暴露给子节点的 record、字段级作用域、子级 reactions 的 `$values`。   |
| `f.Array<Item, Scope, Record, Values>`   | 项类型、字段级作用域、数组自身的 record、子级 `$values`。            |

四个构造器的参数顺序一致：值 / record → 字段级作用域 → 父级 record → `$values` → `Component` → `Decorator`。`Component` 与 `Decorator` 始终在最后 —— 容器构造器（Object / Array / Void）也遵循同样的规则 —— 省略时会从组件 map 中推断。

声明在父级上的类型会流入 `properties` / `items` 中创建的子节点：

<<< @/snippets/schema/field-generics.ts

经验法则：

- 父级值类型同时决定每个子构造器的值类型与子节点的 `$record`。
- 父级 record 中不存在的键只接受 void 构造器（布局节点）或普通 `ISchema`；在这样的键上放持有值的字段会报类型错误。
- fragment 级别的 `Scope` 会被自动继承；传入不同的第二个类型参数（例如 `f.Object<Value, OtherScope>`）可以为整棵子树覆盖它。
- `f.Void<Record>` 把 `Record` 暴露给子节点，自身不产出值。
- `f.Array<Item>` 把 `items` 的类型定为 `SchemaCreator<Item>`，并把数组自身的值定为 `Item[]`。也要声明项构造器的值类型（例如 `f.Object<Item>`），这样它的子节点才能保留上下文。
- object 与 array 节点位于父容器内部，因此它们自身的 `$record` 默认为 `any`。需要时传入第三个类型参数：`f.Object<Value, Scope, ParentRecord>`、`f.Array<Item, Scope, ParentRecord>`。
- 传入 `Values` 槽位可以收窄子级 reactions 中的 `$values`：`f.Field<Value, Scope, Record, FormValues>`、`f.Object<Value, Scope, Record, FormValues>`、`f.Void<Record, Scope, FormValues>`、`f.Array<Item, Scope, Record, FormValues>`。默认值为 `any`。
- 在字段上声明值泛型（例如 `f.Field<number>`）会让其余类型参数停止推断（TypeScript 的限制）。条件允许时省略 `Value`，交给父级 record 驱动。

## `ISchema` 字段参考

### 交互与展示

| 字段                                                | 类型                              | 说明                                                                    |
| --------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `title`                                             | `string` / 表达式                 | 字段标签。                                                              |
| `description`                                       | `string` / 表达式                 | 字段下方的帮助文本。                                                    |
| `display`                                           | `'visible' \| 'hidden' \| 'none'` | `hidden` 保留布局空间；`none` 会把节点及其取值从 `form.values` 中移除。 |
| `visible` / `hidden`                                | `boolean` / 表达式                | 写入 `display` 的语法糖。                                               |
| `editable` / `disabled` / `readOnly` / `readPretty` | `boolean` / 表达式                | 写入字段交互模式的语法糖。                                              |
| `data`                                              | `any`                             | 附加到字段上的自由数据，可在字段模型上访问。                            |
| `content`                                           | `any`                             | 供装饰器组件使用的原始内容。                                            |
| `x*`                                                | `any`                             | 第三方扩展字段，以 `x` 前缀命名。                                       |

### 结构

| 字段                                                             | 说明                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                                                           | `'string' \| 'number' \| 'boolean' \| 'object' \| 'array' \| 'void' \| 'date' \| 'datetime'` 或自定义字符串。                                                             |
| `name`                                                           | 字段键，通常由父级的 `properties` 推导。                                                                                                                                  |
| `properties`                                                     | object / void 节点的子节点。                                                                                                                                              |
| `items`                                                          | array 节点的项 schema（或 schema 元组）。                                                                                                                                 |
| `additionalProperties` / `patternProperties` / `additionalItems` | 条件式子节点定义。                                                                                                                                                        |
| `definitions` / `$ref`                                           | 通过 `#/...` 路径引用的可复用 schema 定义。                                                                                                                               |
| `default`                                                        | 字段初始化时使用的默认值。                                                                                                                                                |
| `enum`                                                           | 允许的取值，可选 `{ label, value }` 形式的条目。运行时存放在 `field.dataSource` 上；期望 `options` prop 的选择组件需要类似 `mapProps({ dataSource: 'options' })` 的映射。 |

### 校验字段

标准 JSON Schema 约束由 `@formvk/validator` 解释：`required`、`format`、`pattern`（**正则字符串**，不是交互模式）、`maxLength` / `minLength`、`maximum` / `minimum`、`exclusiveMaximum` / `exclusiveMinimum`、`multipleOf`、`maxItems` / `minItems` / `uniqueItems`、`maxProperties` / `minProperties`、`const`、`enum`，以及用于自定义规则的 `validator`。完整规则表见[校验参考](/core/validation-reference)。

上面每个校验键都接受 <code v-pre>{{...}}</code> 表达式（包括 `validator` 规则对象内的叶子）。类型层面由 `Stringify<T>` 表示：取值是 `T` 与表达式字符串的联合类型，而普通类型错误的字符串（例如数字字段上的 `'10'`）仍会被拒绝。

### Formvk 扩展字段

| 字段                           | 说明                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `component`                    | 从 `components` 映射中解析的组件名、组件定义，或求值为组件名 / 定义的表达式。                                                            |
| `componentProps`               | 传给组件的 props。类型来自 fragment 的组件 map；任意嵌套字符串叶子（或整个 props 对象）都接受表达式，严格类型由 `ExpressionProps` 承载。 |
| `decorator` / `decoratorProps` | 装饰器组件（例如 form-item 包装组件）及其 props；表达式规则同 `component` / `componentProps`。                                           |
| `validator`                    | 校验器描述符、规则对象或数组；接受整值表达式或规则对象内的叶子表达式。                                                                   |
| `reactions`                    | 一个 reaction 或数组；见[联动](#联动)。                                                                                                  |
| `slot` / `slotNode`            | 把节点渲染到父组件的具名插槽中。                                                                                                         |
| `compileOmitted`               | 不应被编译为表达式的字段路径。                                                                                                           |

任何标记为支持表达式的字段都接受针对字段作用域编译的 <code v-pre>{{ ... }}</code> 字符串。完整范围包括交互 / 展示字段（`title`、`visible` 等）、所有校验键、`component` / `decorator` 引用、`componentProps` / `decoratorProps` 的任意嵌套叶子，以及 `enum` / `pattern` / `required`。

## 联动

reaction 是一个函数 `(field, scope) => void`，运行在字段的响应式上下文中。其中任何可观察值读取都会成为依赖。用 `createSchema<Values>` 注入值类型后 `field.record` 有类型，否则保持 `any`：

<<< @/snippets/schema/reactions.ts#field-reaction

对象形式只为必须保存在纯 JSON schema 中的 reaction 而存在：

<<< @/snippets/schema/reactions.ts#reaction-object

| 键                                    | 说明                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `dependencies`                        | 字段路径（字符串）、`{ name, type, source, property }` 对象，或名称到来源的映射。 |
| `when`                                | 决定走哪个分支的表达式字符串或布尔值。                                            |
| `target`                              | reaction 写入的另一个字段路径。                                                   |
| `effects`                             | 触发该 reaction 的生命周期事件，例如 `onFieldValueChange`。                       |
| `fulfill.state` / `otherwise.state`   | 应用到字段上的部分 `IGeneralFieldState`。                                         |
| `fulfill.schema` / `otherwise.schema` | 合并到节点上的 schema 片段。                                                      |
| `fulfill.run` / `otherwise.run`       | 作为代码执行的表达式字符串。                                                      |

应用代码优先使用函数形式：它就是普通的 TypeScript，不需要表达式字符串，且从上到下阅读即可。

## `createExpression`

```ts
function createExpression<T extends object>(expression: string): Expression<T>
```

构造带类型检查的表达式字符串。把作用域对象的形状作为泛型参数传入；不传时 `T` 默认为 `object`，没有属性补全。

<<< @/snippets/schema/expression.ts#api-expression

### 运算符

| 方法                           | 结果                   |
| ------------------------------ | ---------------------- |
| `eq(value, exp?)` / `neq(...)` | `===` / `!==`          |
| `gt` / `gte` / `lt` / `lte`    | 比较运算符             |
| `and` / `or`                   | `&&` / `\|\|`          |
| `not()` / `bool()`             | `!x` / `!!x`           |
| `ter(a, b, exp?)`              | 三元表达式 `x ? a : b` |

最后一个参数传 `true` 可以插入原始表达式，而不是经过 JSON 编码的字面量。

### `.exp` 与 `.fn`

- `exp.exp.a.b` 返回不带 <code v-pre>{{ }}</code> 包裹的原始路径字符串 `$values.a.b`。
- `exp.fn.handler('$event')` 生成带包裹的函数表达式，例如 <code v-pre>{{function __handler($event) {} return $values.handler($event)}}</code>。需要展开参数时用 `'$args'`（两者不能同时使用），用 `{ body, expand }` 注入自定义函数体。

### 表达式作用域

表达式与 reactions 求值时可用：`$form`、`$values`、`$self`（当前字段）、`$record` / `$records`（数组项上下文）、`$index`、`$lookup`（最近的 record 或根取值），以及通过 `scope` / `ExpressionScope` 提供的任意值。reactions 还会暴露 `$dependencies`。

## `Schema` 运行时类

`new Schema(json, parent?)` 把普通 `ISchema` 解析为链式树（子节点会成为 `Schema` 实例）。

| 成员                                                                                 | 说明                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `addProperty` / `removeProperty` / `setProperties`                                   | 管理 `properties` 条目。                          |
| `addPatternProperty` / `setAdditionalProperties` / `setItems` / `setAdditionalItems` | 管理条件子节点与数组子节点。                      |
| `mapProperties(cb)` / `reduceProperties(cb, init)`                                   | 按顺序遍历 properties。                           |
| `compile(scope?)`                                                                    | 针对作用域编译所有表达式字符串，返回新的 schema。 |
| `fromJSON(json)`                                                                     | 用普通对象重新填充该实例。                        |
| `Schema.isSchemaInstance(value)`                                                     | 静态实例检查。                                    |
| `Schema.compile` / `Schema.shallowCompile`                                           | 静态表达式编译辅助方法。                          |
| `Schema.registerCompiler` / `Schema.registerPatches` / `Schema.silent`               | 自定义编译器与 patch 的扩展点。                   |

## 下一步

- [Schema 概览](/schema/) —— schema 节点如何映射到核心字段模型，以及类型安全 DSL 的实际用法。
- [表单模型](/core/) —— `createForm`、字段模型、生命周期钩子与查询。
- [校验参考](/core/validation-reference) —— 规则、格式与校验注册中心。
