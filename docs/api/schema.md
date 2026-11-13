# Schema DSL Reference

`@formvk/schema` provides the schema model, the typed fragment DSL and expression helpers. It has no Vue dependency. `@formvk/vue` re-exports this package in full, so every symbol below can be imported from either package.

```ts
import { createSchema, createFragment, createExpression, Schema } from '@formvk/schema'
// or
import { createSchema, createFragment, createExpression, Schema } from '@formvk/vue'
```

## `createSchema`

```ts
function createSchema<Properties extends Record<string, unknown>>(
  properties: Properties,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & { _$types$_: [IValues] }
```

Assembles a root `type: 'object'` schema. Each property accepts a creator (the functions returned by `createFragment`), a plain `ISchema` object, or `null` / `undefined`. Creators are expanded immediately, so the return value is a plain JSON-serializable schema.

The `_$types$_` marker carries the inferred form value type (for example `{ name: string; tags: string[] }`). It is type-level metadata only and never appears at runtime.

> Vue users can skip the hand-written component props maps entirely: `createSchemaField` from `@formvk/vue` takes a flat component map plus optional `voidComponents` / `arrayComponents`, returns `{ SchemaField, fragment }`, and infers the component props, scope and value types with no type arguments. See [Vue Bindings](/api/vue#schemafield).

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

The first three type arguments are independent component props maps — `F` for field components, `V` for void / layout / decorator components, and `A` for array components. Each maps a component name to its props type.

### Options

| Option                | Type                  | Description                                                                                                                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patches`             | patch \| patch[]      | Patches applied to every schema produced by this fragment. A `{ pre: true, patch }` entry runs before the rest.                                                           |
| `voidComponentNames`  | `string[]`            | Dynamic creator names that produce `type: 'void'` nodes.                                                                                                                  |
| `arrayComponentNames` | `string[]`            | Dynamic creator names that produce `type: 'array'` nodes and prefill `component`.                                                                                         |
| `defaultDecorator`    | `string \| component` | Decorator added to `string` fields that declare `title` but no `decorator`. Other node types and fields without `title` are left untouched. An explicit `decorator` wins. |

The component categories only exist in the type maps. The runtime Proxy cannot inspect `F` / `V` / `A`, so `voidComponentNames` / `arrayComponentNames` must be declared explicitly when dynamic creators need those node types.

In development builds, two misconfigurations emit a one-time `console.warn` (the checks are compiled out of production bundles): a name declared in both lists — the array classification silently wins under the `array > void` precedence — and calling an unregistered dynamic creator with an array-style items argument, which silently falls back to a `type: 'string'` field node.

`defaultDecorator` mirrors formily-pro's `defaultDecoratorPatch`, but stays opt-in because formvk does not ship a `FormItem` component:

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({ defaultDecorator: 'FormItem' })

f.Field({ title: 'Name', component: 'Input' })()
// { type: 'string', title: 'Name', component: 'Input', decorator: 'FormItem' }
```

The decorator name must also be registered in the `components` map passed to `SchemaField`.

TypeScript does not support partial type argument inference: once the component maps are passed explicitly, `DefaultDecorator` falls back to its default instead of being inferred from the option. Pass it as the fifth type argument to narrow `decoratorProps`:

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents, {}, 'FormItem'>({
  defaultDecorator: 'FormItem',
})

f.Field({ title: 'Name', decoratorProps: { label: 'Name' } }) // checked against FormItem's props
```

### Base creators

| Creator                         | Produces           | Notes                                                               |
| ------------------------------- | ------------------ | ------------------------------------------------------------------- |
| `f.Field(schema?)`              | `type: 'string'`   | Override `type` explicitly for numbers, booleans and dates.         |
| `f.Object(properties, schema?)` | `type: 'object'`   | Nested object node.                                                 |
| `f.Array(items, schema?)`       | `type: 'array'`    | `items` is a creator or plain `ISchema`.                            |
| `f.Void(properties, schema?)`   | `type: 'void'`     | Layout node without a value.                                        |
| `f.transform(rawSchema)`        | expanded `ISchema` | Converts a raw schema, applying the fragment's patches recursively. |

Creators return a function. Calling it with no arguments yields the plain `ISchema`; calling it with extra patches applies them on top.

### Dynamic creators and the component props maps

The three maps are plain `name → props` objects, one per category:

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

Passing them to `createFragment` generates one shorthand creator per declared component:

```ts
const f = createFragment<FieldComponents, VoidComponents, ArrayComponents>({
  arrayComponentNames: ['ArrayItems'],
})

f.Input({ componentProps: { placeholder: 'Name' } })
// equivalent to f.Field({ component: 'Input', componentProps: { placeholder: 'Name' } })

f.ArrayItems(f.Field())
// type: 'array' with component: 'ArrayItems'
```

- Names declared in `F` generate field creators; names in `V` and `A` generate void / array creators.
- A creator that is not declared in the matching map is a type error. Use `f.Field({ component: 'X' })` or declare `X` in the map.
- `componentProps` is checked against the props type registered for that component.
- Strictness is intentionally asymmetric: shorthand creators (`f.Input`) only exist for declared names, while the `component` / `decorator` string fields accept any string (via `string & {}`) so components registered only at runtime stay usable. An undeclared string name gets no autocomplete and falls back to a loose `Record<string, unknown>` for `componentProps`; props checking applies only to declared names.

### Field-level type parameters

`f.Field`, `f.Object`, `f.Void` and `f.Array` accept field-level type parameters so reactions and children are checked without casts:

| Creator                          | Type parameters                                      |
| -------------------------------- | ---------------------------------------------------- |
| `f.Field<Value>(schema?)`        | Field value type.                                    |
| `f.Object<Value, Scope, Record>` | Object value type, field-level scope, parent record. |
| `f.Void<Record, Scope>`          | Record exposed to children, field-level scope.       |
| `f.Array<Item, Scope, Record>`   | Item type, field-level scope, array's own record.    |

Types declared on a parent flow into the children created inside `properties` / `items`:

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
  // No generic needed: the value type comes from the parent record
  age: f.Field({ required: true }),
  layout: f.FormLayout(),
  // @ts-expect-error keys not declared on the parent record only accept void nodes
  extra: f.Field(),
})
```

Rules of thumb:

- The parent value type drives both the value type of each child creator and the child's `$record`.
- Keys absent from the parent record only accept void creators (layout nodes) or plain `ISchema`; a value-producing field on such a key is a type error.
- The fragment-level `Scope` is inherited automatically; pass a different second type parameter (for example `f.Object<Value, OtherScope>`) to override it for a whole subtree.
- `f.Void<Record>` exposes `Record` to children without producing a value of its own.
- `f.Array<Item>` types `items` as `SchemaCreator<Item>` and the array's own value as `Item[]`. Declare the item creator's value type too (for example `f.Object<Item>`) so its children keep the context.
- Object and array nodes live inside their parent container, so their own `$record` defaults to `any`. Pass the third type parameter when it matters: `f.Object<Value, Scope, ParentRecord>`, `f.Array<Item, Scope, ParentRecord>`.
- Declaring a value generic on a field, for example `f.Field<number>`, disables inference for its remaining type parameters (a TypeScript limitation). Leave `Value` off and let the parent record drive it when possible.

## `ISchema` field reference

### Interaction and presentation

| Field                                               | Type                              | Description                                                                            |
| --------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| `title`                                             | `string` / expression             | Field label.                                                                           |
| `description`                                       | `string` / expression             | Help text under the field.                                                             |
| `display`                                           | `'visible' \| 'hidden' \| 'none'` | `hidden` keeps layout space; `none` removes the node and its value from `form.values`. |
| `visible` / `hidden`                                | `boolean` / expression            | Sugar that writes `display`.                                                           |
| `editable` / `disabled` / `readOnly` / `readPretty` | `boolean` / expression            | Sugar that writes the field interaction pattern.                                       |
| `data`                                              | `any`                             | Free-form data attached to the field, available on the field model.                    |
| `content`                                           | `any`                             | Raw content for decorator components.                                                  |
| `x*`                                                | `any`                             | Third-party extension fields, named with an `x` prefix.                                |

### Structure

| Field                                                            | Description                                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`                                                           | `'string' \| 'number' \| 'boolean' \| 'object' \| 'array' \| 'void' \| 'date' \| 'datetime'` or a custom string. |
| `name`                                                           | Field key; normally derived from the parent's `properties`.                                                      |
| `properties`                                                     | Child nodes of an object / void node.                                                                            |
| `items`                                                          | Item schema (or tuple of schemas) of an array node.                                                              |
| `additionalProperties` / `patternProperties` / `additionalItems` | Conditional child definitions.                                                                                   |
| `definitions` / `$ref`                                           | Reusable schema definitions referenced by `#/...` paths.                                                         |
| `default`                                                        | Default value used when the field initializes.                                                                   |
| `enum`                                                           | Allowed values, optionally `{ label, value }` entries.                                                           |

### Validation fields

Standard JSON Schema constraints are interpreted by `@formvk/validator`: `required`, `format`, `pattern` (a **regex string**, not the interaction pattern), `maxLength` / `minLength`, `maximum` / `minimum`, `exclusiveMaximum` / `exclusiveMinimum`, `multipleOf`, `maxItems` / `minItems` / `uniqueItems`, `maxProperties` / `minProperties`, `const`, `enum`, plus `validator` for custom rules. See the [Validation reference](/api/validator) for the full rule table.

### Formvk extensions

| Field                          | Description                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `component`                    | Component name resolved from the `components` map, or a component definition. |
| `componentProps`               | Props passed to the component. Typed via the fragment's component props maps. |
| `decorator` / `decoratorProps` | Decorator component (for example a form-item wrapper) and its props.          |
| `validator`                    | Validator descriptor, rule object or array.                                   |
| `reactions`                    | One reaction or an array; see [Reactions](#reactions).                        |
| `slot` / `slotNode`            | Render the node into a named slot of its parent component.                    |
| `compileOmitted`               | Field paths that must not be compiled as expressions.                         |

Any field marked as expression-capable accepts a <code v-pre>{{ ... }}</code> string compiled against the field scope.

## Reactions

A reaction observes `dependencies`, evaluates `when`, and applies `fulfill` or `otherwise`:

```ts
{
  dependencies: ['subscribe'],
  when: exp.subscribe.eq(true),
  fulfill: { state: { visible: true, required: true } },
  otherwise: { state: { visible: false, required: false } },
}
```

| Key                                   | Description                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `dependencies`                        | Field paths (strings), `{ name, type, source, property }` objects, or a name-to-source map. |
| `when`                                | Expression string or boolean deciding which branch runs.                                    |
| `target`                              | Path of another field the reaction writes to.                                               |
| `effects`                             | Lifecycle events that trigger the reaction, for example `onFieldValueChange`.               |
| `fulfill.state` / `otherwise.state`   | Partial `IGeneralFieldState` applied to the field.                                          |
| `fulfill.schema` / `otherwise.schema` | Schema fragment merged onto the node.                                                       |
| `fulfill.run` / `otherwise.run`       | Expression string executed as code.                                                         |

A reaction may also be a plain function `(field, scope) => void`, which runs inside the field's reactive context.

## `createExpression`

```ts
function createExpression<T extends object>(expression: string): Expression<T>
```

Builds type-checked expression strings. Pass the scope object's shape as the generic parameter; without it, `T` defaults to `object` and no property completion is available.

```ts
const exp = createExpression<{ plan: string; subscribe: boolean }>('$values')

exp.plan.eq('enterprise') // '{{$values.plan === "enterprise"}}'
exp.subscribe.not() // '{{!$values.subscribe}}'
exp.plan.ter('pro', 'free') // '{{$values.plan ? "pro" : "free"}}'
```

### Operators

| Method                         | Output               |
| ------------------------------ | -------------------- |
| `eq(value, exp?)` / `neq(...)` | `===` / `!==`        |
| `gt` / `gte` / `lt` / `lte`    | comparison operators |
| `and` / `or`                   | `&&` / `\|\|`        |
| `not()` / `bool()`             | `!x` / `!!x`         |
| `ter(a, b, exp?)`              | ternary `x ? a : b`  |

Pass `true` as the last argument to insert a raw expression instead of a JSON-encoded literal.

### `.exp` and `.fn`

- `exp.exp.a.b` returns the raw path string `$values.a.b` without the <code v-pre>{{ }}</code> wrapper.
- `exp.fn.handler('$event')` generates a wrapped function expression, for example <code v-pre>{{function __handler($event) {} return $values.handler($event)}}</code>. Use `'$args'` for spread arguments (the two cannot be combined), and `{ body, expand }` to inject a custom function body.

### Expression scope

Expressions and reactions evaluate against: `$form`, `$values`, `$self` (the current field), `$record` / `$records` (array item context), `$index`, `$lookup` (nearest record or root values), and any values provided through `scope` / `ExpressionScope`. Reactions also expose `$dependencies`.

## `Schema` runtime class

`new Schema(json, parent?)` parses a plain `ISchema` into a linked tree (children become `Schema` instances).

| Member                                                                               | Description                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addProperty` / `removeProperty` / `setProperties`                                   | Manage `properties` entries.                                      |
| `addPatternProperty` / `setAdditionalProperties` / `setItems` / `setAdditionalItems` | Manage conditional and array children.                            |
| `mapProperties(cb)` / `reduceProperties(cb, init)`                                   | Iterate ordered properties.                                       |
| `compile(scope?)`                                                                    | Compile all expression strings against a scope into a new schema. |
| `fromJSON(json)`                                                                     | Re-populate the instance from a plain object.                     |
| `Schema.isSchemaInstance(value)`                                                     | Static instance check.                                            |
| `Schema.compile` / `Schema.shallowCompile`                                           | Static expression compilation helpers.                            |
| `Schema.registerCompiler` / `Schema.registerPatches` / `Schema.silent`               | Extension points for custom compilers and patches.                |

## Next steps

- [Form Model & Effects](/api/core) — `createForm`, field models, lifecycle hooks and queries.
- [Validation](/api/validator) — rules, formats and the validator registry.
- [Schema guide](/guide/schema) — narrative walkthrough of the DSL with runnable demos.
