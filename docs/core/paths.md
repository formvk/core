# Path System

Every value, field and effect target is addressed by a path. `@formvk/path` implements the pattern language; `@formvk/core` re-exports it as `FormPath`, and every API that accepts a `FormPathPattern` understands the same syntax.

A pattern can be a dot string (`'user.name'`), an array of segments (`['user', 'name']`), a `RegExp`, a `Path` instance, or a matcher function returned by `FormPath.match(pattern)`.

## Address vs path

A field exposes both, and they differ only when layout (`void`) nodes are involved:

| Property  | Meaning                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| `address` | Position in the schema graph, including `void` nodes and array indices.                  |
| `path`    | Position in `form.values`; `void` nodes are skipped, so it usually equals the data path. |

For example, a field at address `layout.email` has the path `email` when `layout` is a `void` node. Use `address` for field-graph operations (`setFieldState`, effects) and `path` for reading or writing values (`setValuesIn`).

## Literal paths

```ts
form.getValuesIn('username')
form.getValuesIn('profile.address.city')
form.getValuesIn('members.0.email')
form.getValuesIn(['members', 0, 'email']) // same path, array form
```

Array indices are plain numeric segments. `getValuesIn` / `setValuesIn` create missing containers on write: `setValuesIn('members.1.email', value)` appends an object to the array when the index is missing.

## Wildcards

| Pattern    | Matches                                                             |
| ---------- | ------------------------------------------------------------------- |
| `*`        | Exactly one segment: `members.*.email` matches `members.0.email`.   |
| `**`       | Zero or more segments: `members.**` matches `members` and children. |
| `[1:3]`    | A numeric range of segments: `members.[1:3].email`.                 |
| `*(a,b)`   | One of the listed paths: `*(profile.name,username)`.                |
| `*(!a,b)`  | Any path except the listed ones: `*(!password,token)`.              |
| `name~`    | Prefix expansion: `value~` matches `value`, `value_list`, `values`. |
| `/regexp/` | A `RegExp` pattern, for example `FormPath.parse(/^members\.\d+$/)`. |

Wildcards are used by `form.query(pattern)`, `form.validate(pattern)`, `form.reset(pattern)`, `setFieldState(pattern, ...)` and by effect hooks such as `onFieldValueChange('members.*.email', ...)`.

<<< @/snippets/core/paths.ts#match

## Reading and writing values

`FormPath` also provides static helpers that work on plain objects and arrays. They are the same primitives the form model uses internally:

<<< @/snippets/core/paths.ts#values

The path instance itself is immutable — `concat`, `slice`, `parent`, `pop`, `splice` and `push` return new `Path` objects:

<<< @/snippets/core/paths.ts#transform

| API                                                  | Description                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `FormPath.parse(pattern, base?)`                     | Parse a pattern into a `Path`; results are cached.           |
| `Path.getIn(source, pattern)` / `setIn` / `deleteIn` | Read, write or delete a nested value.                        |
| `Path.existIn(source, pattern, start?)`              | Test whether a path exists in the source.                    |
| `Path.ensureIn(source, pattern, default?)`           | Return the value, creating it with the default when missing. |
| `Path.match(pattern)`                                | Create a reusable matcher function for `Array#filter`.       |
| `path.match(other)` / `matchAliasGroup(name, alias)` | Test a path against a pattern; scores longer matches higher. |

## Paths in the form model

Path-based access is the main way to work with values and field state without holding field references:

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

The same patterns drive [effects](/core/#effects) and schema [reactions](/schema/#reactions): inside a reaction function, `form.query(path)` reads fields by path, while `target` in the object form writes to the field at that path.

## Scenario: a team-member table

Repeated rows are where path patterns pay off. The snippets below use a `members` array from the [team invitation example](/vue/examples/team-invite); the same patterns apply to any list, tree or dynamically created field group.

### Addresses vs values: pick the right API

`address` walks the schema graph (including `void` wrappers and array indices); `path` walks `form.values` (skipping `void`). Field operations (`setFieldState`, `validate`, effect patterns) understand both, value operations only understand paths. Without `void` nodes they are identical, which is why most forms never notice the difference.

<<< @/snippets/core/paths-business.ts#address-vs-path

### Validate and update a whole column

One wildcard replaces a loop over `form.fields`. Both calls affect existing rows; `setFieldState` also covers rows added later, because it is applied to matching fields as they mount.

<<< @/snippets/core/paths-business.ts#bulk

### Read a column as data

`form.query(...).map(field => field.value)` bridges field models and plain arrays for summaries, counters and disabled states:

<<< @/snippets/core/paths-business.ts#group-read

### Reset one group

`reset(pattern)` only touches matching fields, so a "clear all members" button does not reset the rest of the form:

<<< @/snippets/core/paths-business.ts#group-reset

## Next steps

- [Form model](/core/) — the state and methods that accept these paths.
- [Schema reactions](/schema/#reactions) — reactive functions that read paths.
- [Validation](/core/validation) — `form.validate(pattern)` and field-level triggers.
