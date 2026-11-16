# @formvk/shared

[English](./README.md) | [简体中文](./README.zh-CN.md)

Low-level utilities shared by the Formvk packages: type checkers, array/object iteration, cloning, deep merge, defaults, `Subscribable`, middleware and uid generation. It is installed transitively by the other packages; use it directly only when building Formvk-compatible tooling.

## Install

```bash
pnpm add @formvk/shared
```

## Usage

```ts
import { clone, isPlainObj, merge, toArr, uid } from '@formvk/shared'

isPlainObj({}) // true
toArr('a') // ['a']

const copy = clone({ a: 1 })
const merged = merge({ a: 1 }, { b: 2 })
const id = uid()
```

## API

- **Checkers** — `isFn`, `isArr`, `isObj`, `isPlainObj`, `isStr`, `isNum`, `isBool`, `isMap`, `isSet`, `isWeakMap`, `isWeakSet`, `isRegExp`, `isNumberLike`, `isReactElement`, `isHTMLElement`, `getType`.
- **Emptiness** — `isUndef`, `isValid`, `isEmpty`.
- **Collections** — `toArr`, `each`, `map`, `reduce`, `every`, `some`, `find`, `findIndex`, `includes`, `move`.
- **Objects** — `clone`, `shallowClone`, `merge`, `lazyMerge`, `defaults`, `instOf`.
- **Strings** — `stringLength`, `lowerCase`, `pascalCase`.
- **Path** — `FormPath` (alias of `Path` from `@formvk/path`) and the `FormPathPattern` type.
- **Infrastructure** — `Subscribable`, `applyMiddleware`, `deprecate`, `uid`, `globalThisPolyfill`, `isEqual`.

## Documentation

https://formvk.github.io/core/api/core

## License

MIT
