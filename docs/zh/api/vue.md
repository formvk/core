# Vue 绑定

`@formvk/vue` 重新导出了 `@formvk/schema`，因此一次导入即可拿到表单引擎、schema DSL、组件与 hooks。

> 相关参考：[Schema DSL](/zh/api/schema) —— 构造器、`ISchema` 与表达式；[表单模型与 Effects](/zh/api/core) —— `createForm`、字段模型与生命周期钩子（从 `@formvk/core` 导入）；[校验](/zh/api/validator) —— 规则、格式与消息本地化。

```ts
import {
  createForm,
  createFragment,
  createSchema,
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

渲染 schema 树。

| 属性                   | 类型                               | 说明                                             |
| ---------------------- | ---------------------------------- | ------------------------------------------------ |
| `schema`               | `ISchema \| Schema`                | 要渲染的 schema；普通对象默认补 `type: 'object'` |
| `components`           | `Record<string, Component>`        | `component: 'Input'` 等名称对应的组件映射        |
| `scope`                | `Record<string, any>`              | 表达式可用的额外作用域                           |
| `name`                 | `string \| number`                 | 渲染子树时的字段名                               |
| `basePath`             | `FormPathPattern`                  | 解析字段地址的基准路径                           |
| `onlyRenderProperties` | `boolean`                          | 只渲染子节点，不渲染当前节点                     |
| `onlyRenderSelf`       | `boolean`                          | 只渲染当前节点，不渲染子节点                     |
| `mapProperties`        | `(schema, name) => Schema \| void` | 渲染前转换子 schema                              |
| `filterProperties`     | `(schema, name) => boolean`        | 返回 `false` 跳过某个子节点                      |

`createSchemaField(options)` 返回预绑定 `components` 与 `scope` 的 `SchemaField`：

```ts
const { SchemaField } = createSchemaField({
  components: { Input },
  scope: { $myScope: { locale: 'en' } },
})
```

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

## Hooks

| Hook                           | 返回           | 说明                                                  |
| ------------------------------ | -------------- | ----------------------------------------------------- |
| `useForm<T>()`                 | `Ref<Form<T>>` | `FormProvider` 提供的最近表单                         |
| `useField<T>()`                | `Ref<T>`       | `SchemaField` / `RecursionField` 提供的当前字段       |
| `useFieldSchema()`             | `Ref<Schema>`  | 当前字段的 schema                                     |
| `useFormEffects(fn)`           | `void`         | 在组件生命周期内注册 `fn(form)`                       |
| `useParentForm()`              | `Ref<Form>`    | 最近字段所属的表单                                    |
| `useAttach(ref)`               | `Ref<T>`       | 让模型 ref 随组件生命周期调用 `onMount` / `onUnmount` |
| `useInjectionCleaner(symbols)` | `void`         | 清理父级作用域的注入                                  |

直接读取字段的自定义输入组件：

```vue
<script setup lang="ts">
import { useField } from '@formvk/vue'

const field = useField()
</script>

<template>
  <div>
    <label>{{ field?.title }}</label>
    <input :value="field?.value" @input="field?.onInput($event)" />
    <span v-if="field?.selfErrors?.length">{{ field.selfErrors[0] }}</span>
  </div>
</template>
```

## 组件工具

### `mapProps`

把字段状态映射到组件 props：

```ts
import { mapProps } from '@formvk/vue'

const ConnectedInput = mapProps(
  { visible: 'v-show' },
  { value: true, disabled: 'disabled', readOnly: 'readonly' }
)(Input)
```

对象的键是字段上的读取路径，字符串值是目标 prop；值为 `true` 时保持同名。

### `mapReadPretty`

当字段 pattern 为 `readPretty` 时切换到只读组件：

```ts
const Input = mapReadPretty(PreviewText)(BaseInput)
```

### `connect`

组合上述工具：

```ts
const Input = connect(BaseInput, mapProps({ value: true }), mapReadPretty(PreviewText))
```
