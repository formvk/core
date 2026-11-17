# 路径系统

每个取值、字段与 effect 目标都由路径寻址。`@formvk/path` 实现这套模式语言；`@formvk/core` 将其重新导出为 `FormPath`，所有接受 `FormPathPattern` 的 API 都理解同一套语法。

模式可以是用点分隔的字符串（`'user.name'`）、分段数组（`['user', 'name']`）、`RegExp`、`Path` 实例，或 `FormPath.match(pattern)` 返回的匹配函数。

## address 与 path

字段同时暴露两者，只有涉及布局（`void`）节点时才会不同：

| 属性      | 含义                                                    |
| --------- | ------------------------------------------------------- |
| `address` | 在 schema 图中的位置，包含 `void` 节点与数组下标。      |
| `path`    | 在 `form.values` 中的位置；跳过 `void` 节点，数据路径。 |

例如地址为 `layout.email` 的字段，当 `layout` 是 `void` 节点时，它的 path 是 `email`。字段图操作（`setFieldState`、effects）用 `address`，读写取值（`setValuesIn`）用 `path`。

## 字面路径

```ts
form.getValuesIn('username')
form.getValuesIn('profile.address.city')
form.getValuesIn('members.0.email')
form.getValuesIn(['members', 0, 'email']) // 同一路径的数组形式
```

数组下标就是普通数字段。写入时 `getValuesIn` / `setValuesIn` 会自动创建缺失容器：当索引不存在时，`setValuesIn('members.1.email', value)` 会向数组追加对象。

## 通配符

| 模式       | 匹配范围                                                  |
| ---------- | --------------------------------------------------------- |
| `*`        | 恰好一段：`members.*.email` 匹配 `members.0.email`。      |
| `**`       | 零或多段：`members.**` 匹配 `members` 及其后代。          |
| `[1:3]`    | 数字段范围：`members.[1:3].email`。                       |
| `*(a,b)`   | 列出的路径之一：`*(profile.name,username)`。              |
| `*(!a,b)`  | 除列出路径之外的任意路径：`*(!password,token)`。          |
| `name~`    | 前缀展开：`value~` 匹配 `value`、`value_list`、`values`。 |
| `/regexp/` | `RegExp` 模式，例如 `FormPath.parse(/^members\.\d+$/)`。  |

通配符可用于 `form.query(pattern)`、`form.validate(pattern)`、`form.reset(pattern)`、`setFieldState(pattern, ...)`，以及 `onFieldValueChange('members.*.email', ...)` 这类 effect 钩子。

<<< @/snippets/core/paths.ts#match

## 读写取值

`FormPath` 还提供一组作用于普通对象与数组的静态工具，它们就是表单模型内部使用的原语：

<<< @/snippets/core/paths.ts#values

路径实例本身不可变 —— `concat`、`slice`、`parent`、`pop`、`splice`、`push` 都返回新的 `Path` 对象：

<<< @/snippets/core/paths.ts#transform

| API                                                  | 说明                                        |
| ---------------------------------------------------- | ------------------------------------------- |
| `FormPath.parse(pattern, base?)`                     | 解析为 `Path`，结果会被缓存。               |
| `Path.getIn(source, pattern)` / `setIn` / `deleteIn` | 读取、写入或删除嵌套取值。                  |
| `Path.existIn(source, pattern, start?)`              | 判断路径在源对象中是否存在。                |
| `Path.ensureIn(source, pattern, default?)`           | 取值，缺失时用默认值创建并返回。            |
| `Path.match(pattern)`                                | 生成可复用的匹配函数，便于 `Array#filter`。 |
| `path.match(other)` / `matchAliasGroup(name, alias)` | 测试路径是否匹配模式；更长的匹配得分更高。  |

## 表单模型中的路径

不持有字段引用时，基于路径的访问是操作取值与字段状态的主要方式：

```ts
form.setValuesIn('members.0.name', 'Alice')
form.getValuesIn('members.0.name')
form.deleteValuesIn('members.0.name')
form.existValuesIn('members.0.name')

form.setFieldState('members.*.email', field => {
  field.required = true
})

const email = form.query('members.*.email').take()
```

同一套模式也驱动 [effects](/core/#effects) 与 schema 的[响应联动](/schema/#响应联动)：在 reaction 函数里用 `form.query(path)` 按路径读取字段，对象形式的 `target` 则按路径写入字段。

## 场景：团队成员表格

重复行最能体现路径模式的价值。下面的片段使用[团队邀请示例](/vue/examples/team-invite)中的 `members` 数组；同样的模式适用于任何列表、树或动态创建的字段组。

### address 还是 path：选对 API

`address` 走 schema 图（包含 `void` 包装与数组下标）；`path` 走 `form.values`（跳过 `void`）。字段操作（`setFieldState`、`validate`、effect 模式）两者都能理解，取值操作只理解 path。没有 `void` 节点时两者完全一致，所以大多数表单不会察觉差异。

<<< @/snippets/core/paths-business.ts#address-vs-path

### 校验并更新一整列

一个通配符就能替代遍历 `form.fields`。两次调用都会作用于已有行；`setFieldState` 还能覆盖之后新增的行，因为匹配的字段在挂载时会再次应用。

<<< @/snippets/core/paths-business.ts#bulk

### 把一整列读成数据

`form.query(...).map(field => field.value)` 是字段模型与普通数组之间的桥梁，适合汇总、计数与禁用态判断：

<<< @/snippets/core/paths-business.ts#group-read

### 只重置一组字段

`reset(pattern)` 只作用于匹配字段，因此“清空所有成员”按钮不会重置表单其余部分：

<<< @/snippets/core/paths-business.ts#group-reset

## 下一步

- [表单模型](/core/) —— 接受这些路径的状态与方法。
- [Schema 响应联动](/schema/#响应联动) —— 声明式路径依赖。
- [校验](/core/validation) —— `form.validate(pattern)` 与字段级触发。
