# @formvk/path

Path parsing and data access utilities used by Formvk to address fields. Supports dot paths, array indices, wildcard match patterns, relative paths and reusable matchers.

## Install

```bash
pnpm add @formvk/path
```

## Usage

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

`Path.match` creates a matcher that can be passed to `Form.query`:

```ts
form.query(Path.match('user.*')).forEach(field => {
  field.setPattern('disabled')
})
```

## API

- **Instance** — `segments`, `entire`, `length`, `toString`, `toArr`, `concat`, `push`, `slice`, `pop`, `splice`, `parent`, `forEach`, `map`, `reduce`, `includes`, `match`, `matchAliasGroup`, `transform`, `getIn`, `setIn`, `deleteIn`, `existIn`, `ensureIn`.
- **Static** — `Path.parse`, `Path.getIn`, `Path.setIn`, `Path.deleteIn`, `Path.existIn`, `Path.ensureIn`, `Path.match`, `Path.transform`, `Path.isPathPattern`.
- **Types** — `Pattern`, `MatcherFunction`.

`@formvk/shared` re-exports the class as `FormPath` together with the `FormPathPattern` type.

## Documentation

https://formvk.github.io/core/api/core

## License

MIT
