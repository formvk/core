# @formvk/path

[English](./README.md) | [简体中文](./README.zh-CN.md)

Formvk 中用于定位字段的路径解析与数据访问工具。支持点路径、数组下标、通配匹配模式、相对路径与可复用匹配器。

## 安装

```bash
pnpm add @formvk/path
```

## 使用

```ts
import { Path } from '@formvk/path'

const values = { user: { name: 'alice' } }

Path.getIn(values, 'user.name') // 'alice'
Path.setIn(values, 'user.name', 'bob')
Path.existIn(values, 'user.name') // true
Path.deleteIn(values, 'user.name')

new Path('user.*').match('user.name') // true
new Path('user.name').includes('user') // true
Path.transform('user.name', /name/, key => key.toUpperCase()) // 'NAME'
```

`Path.match` 生成匹配器，可直接传给 `Form.query`：

```ts
form.query(Path.match('user.*')).forEach(field => {
  field.setPattern('disabled')
})
```

## API

- **实例** — `segments`、`entire`、`length`、`toString`、`toArr`、`concat`、`push`、`slice`、`pop`、`splice`、`parent`、`forEach`、`map`、`reduce`、`includes`、`match`、`matchAliasGroup`、`transform`、`getIn`、`setIn`、`deleteIn`、`existIn`、`ensureIn`。
- **静态方法** — `Path.parse`、`Path.getIn`、`Path.setIn`、`Path.deleteIn`、`Path.existIn`、`Path.ensureIn`、`Path.match`、`Path.transform`、`Path.isPathPattern`。
- **类型** — `Pattern`、`MatcherFunction`。

`@formvk/shared` 将该类以 `FormPath` 别名重新导出，同时导出 `FormPathPattern` 类型。

## 文档

https://formvk.github.io/core/zh/api/core

## License

MIT
