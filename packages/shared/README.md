# @formvk/shared

[English](./README.en.md) | [简体中文](./README.md)

Formvk 各包共用的底层工具：类型判断、数组/对象遍历、克隆、深合并、默认值、`Subscribable`、中间件与 uid 生成。它由其他包间接安装；只有在构建与 Formvk 兼容的工具时才需要直接使用。

## 安装

```bash
pnpm add @formvk/shared
```

## 使用

```ts
import { clone, isPlainObj, merge, toArr, uid } from '@formvk/shared'

isPlainObj({}) // true
toArr('a') // ['a']

const copy = clone({ a: 1 })
const merged = merge({ a: 1 }, { b: 2 })
const id = uid()
```

## API

- **类型判断** — `isFn`、`isArr`、`isObj`、`isPlainObj`、`isStr`、`isNum`、`isBool`、`isMap`、`isSet`、`isWeakMap`、`isWeakSet`、`isRegExp`、`isNumberLike`、`isReactElement`、`isHTMLElement`、`getType`。
- **空值判断** — `isUndef`、`isValid`、`isEmpty`。
- **集合** — `toArr`、`each`、`map`、`reduce`、`every`、`some`、`find`、`findIndex`、`includes`、`move`。
- **对象** — `clone`、`shallowClone`、`merge`、`lazyMerge`、`defaults`、`instOf`。
- **字符串** — `stringLength`、`lowerCase`、`pascalCase`。
- **路径** — `FormPath`（`@formvk/path` 中 `Path` 的别名）与 `FormPathPattern` 类型。
- **基础设施** — `Subscribable`、`applyMiddleware`、`deprecate`、`uid`、`globalThisPolyfill`、`isEqual`。

## 文档

https://formvk.github.io/core/api/core

## License

MIT
