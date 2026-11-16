# Vue 绑定

`@formvk/vue` 重新导出了 `@formvk/schema`，因此一次导入即可拿到表单引擎、schema DSL、组件与 hooks。本页介绍 `createForm`、`createSchemaField` 与渲染组件；hooks 与组件工具见 [Hooks](/zh/vue/hooks)，完整可运行表单见[示例](/zh/vue/examples/basic-form)。

> 相关参考：[Schema](/zh/schema/) —— schema 模型、DSL 与表达式；[核心](/zh/core/) —— `createForm`、字段模型、路径与生命周期钩子（从 `@formvk/core` 导入）；[校验](/zh/core/validation) —— 规则、格式与消息本地化。

```ts
import {
  createForm,
  createFragment,
  createSchema,
  createSchemaField,
  createExpression,
  Schema,
  FormProvider,
  SchemaField,
  RecursionField,
} from '@formvk/vue'
```

## `createForm`

```ts
function createForm<T extends object = any>(options?: IFormProps<T>): Form<T>
```

创建表单模型。它被标记为 `markRaw`，Vue 不会把它转换成响应式代理。

常用表单方法：

| 方法                             | 说明                                      |
| -------------------------------- | ----------------------------------------- |
| `form.values`                    | 可观察的取值对象                          |
| `form.submit(onSubmit?)`         | 校验后 resolve 取值（失败时 reject 错误） |
| `form.validate(pattern?)`        | 校验字段，失败时 reject 错误              |
| `form.reset(pattern?, options?)` | 将字段恢复为初始值                        |
| `form.submitting`                | 提交进行中为 `true`                       |
| `form.invalid` / `form.errors`   | 当前是否无效 / 错误列表                   |

## 组件

### `FormProvider`

| 属性   | 类型   | 说明                 |
| ------ | ------ | -------------------- |
| `form` | `Form` | 提供给后代的表单模型 |

它通过 Vue 的 `provide` / `inject` 提供表单，并清理父级作用域遗留的字段 / schema 注入。

### `FormConsumer`

通过作用域插槽拿到表单：

```vue
<FormConsumer v-slot="{ form }">
  {{ JSON.stringify(form.values) }}
</FormConsumer>
```

### `SchemaField`

渲染 schema 树。`components` 是扁平的 `name → component` 映射。`createSchemaField` 返回的 `SchemaField` 已预绑定组件，因此只有使用独立 `SchemaField` 时才需要传这个 prop。

| 属性                   | 类型                               | 说明                                              |
| ---------------------- | ---------------------------------- | ------------------------------------------------- |
| `schema`               | `ISchema \| Schema`                | 要渲染的 schema；普通对象默认补 `type: 'object'`  |
| `components`           | 扁平 `name → component` 映射       | `component: 'Input'` 等名称对应的组件             |
| `scope`                | `Record<string, any>`              | 表达式可用的额外作用域                            |
| `name`                 | `string \| number`                 | 渲染子树时的字段名                                |
| `basePath`             | `FormPathPattern`                  | 解析字段地址的基准路径                            |
| `onlyRenderProperties` | `boolean`                          | 只渲染子节点，不渲染当前节点                      |
| `onlyRenderSelf`       | `boolean`                          | 只渲染当前节点，不渲染子节点                      |
| `mapProperties`        | `(schema, name) => Schema \| void` | 渲染前转换子 schema                               |
| `filterProperties`     | `(schema, name) => boolean`        | 返回 `false` 跳过某个子节点                       |
| `hotReload`            | `boolean`                          | `schema` 引用变化时重建字段（仅建议开发环境开启） |

### `createSchemaField`

`createSchemaField(options)` 返回一个双 key 对象：

- `SchemaField` —— 已预绑定拍平后组件映射与 `scope` 的渲染组件，渲染时仍可传扁平 `components` prop 覆盖同名组件。
- `fragment` —— schema 构造器集合：基础构造器 `Field` / `Object` / `Array` / `Void` / `transform`，以及按组件名生成的快捷构造器（如 `Input`、`ArrayItems`）。

`components` 是扁平的 `name → component` 映射，未声明分类的名字按 field 组件处理。`voidComponents` / `arrayComponents` 是归类布局组件与数组组件的**组件 map**，工厂会自动把它们合并进运行时组件映射，无需重复注册。所有类型都从 options 推断，无需传任何类型参数，也不用手写组件 props map：

<<< @/snippets/vue/schema-field.ts#full

用预绑定的组件渲染，无需再传 `components` prop：

```vue
<SchemaField :schema="schema" />
```

| 选项               | 类型                         | 说明                                                                                         |
| ------------------ | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `components`       | 扁平 `name → component` 映射 | schema 引用到的全部组件；未分类的名字默认按 field 组件处理。                                 |
| `voidComponents`   | 组件 map                     | void / 布局组件，自动合并进运行时组件映射。                                                  |
| `arrayComponents`  | 组件 map                     | 数组组件，入参形态同上。                                                                     |
| `scope`            | `Record<string, any>`        | 额外作用域；对象形状会被推断，并流入每个构造器的 `reactions` 类型。                          |
| `defaultDecorator` | `string \| 组件引用`         | 语义同 `createFragment` 的同名选项；类型自动推断，`decoratorProps` 按该装饰器的 props 校验。 |
| `patches`          | patch \| patch[]             | 应用到 fragment 产出的每个 schema 上的 patch。                                               |

> **同名冲突按固定优先级静默处理，不会有任何警告。** 三个 map 按 `components` → `voidComponents` → `arrayComponents` 的顺序拍平，同一组件名在多个 map 中出现时，由高优先级条目直接胜出：`arrayComponents` 覆盖 `voidComponents`，后者再覆盖 `components`。fragment 的动态构造器遵循同一优先级，`f.Name()` 会按胜出分类产出 `array` / `void` / `string` 节点，低优先级组件在运行时不再可访问。如果需要每个组件都保持可用，请保证三个 map 中的名字互不重复。

返回的构造器与 [Schema 参考](/zh/schema/reference#字段级类型参数) 中的 fragment API 完全一致，同样支持父级声明、子级推断：

<<< @/snippets/vue/schema-field.ts#inference

`createFragment` 仍然保留，适用于不依赖 Vue 组件映射的、与框架无关的 schema 代码。

### `RecursionField`

`SchemaField` 内部的构建块。编写自定义布局组件（例如数组项）时直接使用：

| 属性       | 类型                | 说明         |
| ---------- | ------------------- | ------------ |
| `schema`   | `ISchema \| Schema` | 要渲染的节点 |
| `name`     | `string \| number`  | 字段名       |
| `basePath` | `FormPathPattern`   | 父级路径     |

### `ExpressionScope`

为子树中的 <code v-pre>{{ ... }}</code> 表达式增加作用域变量。

```vue
<ExpressionScope :value="{ $locale: 'zh-CN' }">
  <SchemaField :schema="schema" />
</ExpressionScope>
```

## 下一步

- [Hooks 与组件工具](/zh/vue/hooks) —— `useField`、`useForm`、`connect` 等。
- [自定义组件](/zh/vue/custom-components) —— 基于字段模型编写字段组件与数组组件。
- [示例](/zh/vue/examples/basic-form) —— 校验、联动与可重复字段的完整表单。
