# @formvk/react

[English](./README.en.md) | [简体中文](./README.md)

React bindings for Formvk. It connects the `@formvk/core` form model and `@formvk/schema` to React components, with field updates powered by `@formvk/reactive-react`.

## Install

```bash
pnpm add @formvk/react react react-dom
```

`react` and `react-dom` (`>= 18`) are peer dependencies.

## Usage

```tsx
import { createForm, createSchema, createSchemaOptions, FormProvider, SchemaField } from '@formvk/react'
import { useState } from 'react'

function Input(props: { value?: string }) {
  return <input value={props.value ?? ''} readOnly />
}

// schema and component factory are static: build them once at module scope
const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: { Input },
})

const schema = createSchema({
  name: f.Input({ title: 'Name' }),
})

export default function App() {
  // the form is a stateful model: create it lazily inside the component
  const [form] = useState(() => createForm({ values: { name: '' } }))

  return (
    <OptionsProvider>
      <FormProvider form={form}>
        <SchemaField schema={schema} />
      </FormProvider>
    </OptionsProvider>
  )
}
```

## API

- **Components** — `FormProvider`, `SchemaField`, `OptionsProvider`, `createSchemaOptions`, `RecursionField`, `ExpressionScope`, `FormConsumer`, `ReactiveField`.
- **Hooks** — `useForm`, `useField`, `useFieldSchema`, `useAttach`, `useFormEffects`, `useParentForm`.
- **Helpers** — `createForm`, `connect`, `mapProps`, `mapReadPretty`.
- **Schema** — re-exports `@formvk/schema` (`createFragment`, `createSchema`, `ISchema`, expression types, ...).
- **Reactivity** — re-exports `@formvk/reactive-react` (`observer`, `Observer`, `useObserver`, `useForceUpdate`).

Components that read observable state directly should be wrapped with `observer`, re-exported here from `@formvk/reactive-react`. `FormConsumer` exposes form state through a render prop.

## Documentation

- React API: https://formvk.github.io/core/en/api/react
- Getting started: https://formvk.github.io/core/en/guide/getting-started

## License

MIT
