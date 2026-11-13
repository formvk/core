# How to Build Custom Components

Formvk renders nothing by itself. A schema only names components (`component: 'Input'`); you provide the actual Vue components and register them on `SchemaField`. This guide walks through the full path: a minimal field component, registration, strict typing, adapting an existing component library, and array components.

## The field component contract

A component rendered through `SchemaField` runs inside a field injection context. Call `useField()` to read the current field model:

```vue
<script setup lang="ts">
import { useField } from '@formvk/vue'

const fieldRef = useField()
</script>

<template>
  <div>
    <label>{{ fieldRef?.title }}</label>
    <input :value="fieldRef?.value ?? ''" @input="fieldRef?.onInput($event)" />
    <span v-if="fieldRef?.selfErrors?.length">{{ fieldRef.selfErrors[0] }}</span>
  </div>
</template>
```

Three things make a component work as a field control:

1. **Read** the value from `field.value` (a computed backed by `form.values`).
2. **Write** through `field.onInput(event)`. It accepts the native DOM event, updates the value and runs input-triggered validation. For non-DOM updates (for example a Select emitting a raw value), call `field.setValue(value)` instead.
3. **Display feedback** with `field.selfErrors`, `field.validateStatus`, `field.required`, `field.title` and `field.description`.

`useField()` returns a ref; inside `<script setup>` read it through `.value`, while templates unwrap it automatically.

## Register the component

Register components once on `SchemaField` (or pre-bind them with `createSchemaField`). The map keys are the names used in `component`:

```vue
<script setup lang="ts">
import { createForm, FormProvider, SchemaField, createFragment, createSchema } from '@formvk/vue'

import MyInput from './MyInput.vue'

const form = createForm({ values: { name: '' } })
const f = createFragment()
const schema = createSchema({
  name: f.Field({ title: 'Name', component: 'Input' }),
})
</script>

<template>
  <FormProvider :form="form">
    <SchemaField :schema="schema" :components="{ Input: MyInput }" />
  </FormProvider>
</template>
```

The same map is searched for decorator components and nested nodes, so one registration covers the whole schema tree.

## Type `componentProps`

Without a component map, `componentProps` is untyped. Pass a `ComponentPropsMap` to `createFragment`, extracting each component's props with the `ComponentProps<T>` helper:

```ts
import type { ComponentProps } from '@formvk/vue'

import MyInput from './MyInput.vue'
import MySelect from './MySelect.vue'

const fieldComponents = {
  Input: MyInput,
  Select: MySelect,
}

type Components = {
  field: {
    Input: ComponentProps<typeof MyInput>
    Select: ComponentProps<typeof MySelect>
  }
}

const f = createFragment<Components>()

f.Input({ componentProps: { placeholder: 'Name' } })
// typo or unknown prop here is a type error
```

Declare layout-only components under `void`, and array components under `array`. Array creators additionally need the runtime hint `createFragment<Components>({ arrayComponents: ['ArrayItems'] })`, because component categories are type-level information.

## Adapt an existing component library

Most UI libraries ship components that do not know about field models. Three helpers bridge them without rewriting anything:

### `mapProps(...mappers)`

Maps field state onto component props. An object mapper reads field paths (keys) and writes target props (values; `true` keeps the same name). A function mapper receives `(props, field)` and returns new props.

```ts
import { mapProps } from '@formvk/vue'

const ConnectedInput = mapProps(
  { visible: 'v-show' },
  { value: true, disabled: 'disabled', readOnly: 'readonly' }
)(BaseInput)
```

### `mapReadPretty(component, props?)`

Swaps in a read-only component whenever the field pattern is `readPretty`:

```ts
const Input = mapReadPretty(PreviewText)(BaseInput)
```

### `connect(target, ...mappers)`

Composes mappers into one component and marks the result `markRaw`:

```ts
import { connect, mapProps, mapReadPretty } from '@formvk/vue'

const Input = connect(BaseInput, mapProps({ value: true, disabled: 'disabled' }), mapReadPretty(PreviewText))
```

Register the connected component under the same map key you reference from the schema.

## Array components

An array component owns the layout of repeated items and renders each item with `RecursionField`:

```vue
<script setup lang="ts">
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'

const field = useField<any>()
const schema = useFieldSchema()
</script>

<template>
  <div>
    <div v-for="(item, index) in field.value" :key="index">
      <RecursionField :schema="schema.items" :name="index" />
      <button @click="field.remove(index)">Remove</button>
    </div>
    <button @click="field.push({})">Add item</button>
  </div>
</template>
```

The field is an `ArrayField`, so `push`, `pop`, `insert`, `remove`, `move`, `moveUp` and `moveDown` are available. See the [Array List example](/examples/array-list) for a complete, styled implementation.

## Common pitfalls

- **`useField()` returns `null`** outside a `SchemaField` / `RecursionField` subtree — the component must be referenced from a schema, not mounted directly.
- **Values do not update** when emitting raw values into `onInput`; use `field.setValue(value)` for non-event payloads.
- **Props are untyped** when no `ComponentPropsMap` is passed; dynamic creators such as `f.Input` also stop existing as typed symbols.
- **Pattern flags** (`disabled`, `readOnly`, `readPretty`) are inherited from the form and parent fields, so components should read them from the field model rather than hard-coding them.

## Next steps

- [Validation guide](/guide/validation) — rules and error display inside custom components.
- [Vue bindings reference](/api/vue) — full component and hook signatures.
- [Schema DSL reference](/api/schema) — `ComponentPropsMap`, creators and field schema fields.
