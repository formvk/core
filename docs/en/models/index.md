# Application Models

`@formvk/models` packages the data flow shared by table screens — search form, pagination, records, add/edit popups and removal — into UI-agnostic models. The same model drives both Vue and React; the renderer only reads state and calls methods.

> Related: [Core](/en/core/) for `createForm` and the form model; [Schema](/en/schema/) for expressions and `Schema.compile`; [Vue](/en/vue/) / [React](/en/react/) for rendering bindings.

## Installation

```bash
pnpm add @formvk/models
```

The package only depends on `@formvk/core`, `@formvk/schema`, `@formvk/reactive` and `@formvk/shared`, and never pulls in a UI library.

## Quick start

The demo below binds `TableModel` to a native table: search, pagination, add, edit and remove are handled by the model, while the component only renders.

<demo vue="../../demos/models-table.vue" stackblitz="true" />

On the React side the same model only needs an `observer` wrapper so rendering tracks the model's reactive accessors:

<demo react="../../demos/react/models-table.tsx" stackblitz="true" />

## What's inside

### `TableModel`

It aggregates the search form, pagination, records and add/edit popups into one instance:

```ts
import { TableModel } from '@formvk/models'

const table = new TableModel<UserRecord, State, SearchValues>({
  pagination: { current: 1, pageSize: 20 },
  search: async (values, pagination) => ({ records, pagination }),
  add: async values => true,
  edit: async values => true,
  remove: async record => true,
})

table.onMount()
```

- When `search` returns an array, `total` is derived from its length; when it returns an object, its `pagination` is merged.
- When `add` / `edit` returns `true`, the table refreshes and jumps back to the first page; the matching `PopupModel` closes automatically.
- When `remove` returns `true`, the table refreshes; pass a second argument to replace the built-in `search` with a custom callback.
- `onMount` triggers one search by default. Set `auto: false` to load manually once routing or permissions are ready.

### `PopupModel`

Add/edit dialogs are backed by `PopupModel`. `TableModel` already creates `addPopup` and `editPopup`, and the model can also be used standalone:

```ts
import { PopupModel } from '@formvk/models'

const popup = new PopupModel(values => save(values))

popup.open({ name: 'Alice' })
await popup.onSubmit() // closes automatically when the submit callback returns a truthy value
```

`open(values?, initialValues?)` rebuilds the internal form, so every open starts from a clean state; `close()` only toggles visibility and keeps the form alive.

## Schema expression integration

`TableModel.compile` compiles table column definitions and injects `$table` (the model instance) and `$state` (the `state` field):

<<< @/snippets/models/compile.ts#compile

Columns can therefore use expressions such as <code v-pre>{{$table.records.length}}</code> or <code v-pre>{{$state.keyword}}</code>, sharing the same compilation pipeline as form schemas.

## Renderer integration

- **Vue**: templates track the reactive accessors from `@formvk/reactive` automatically — bind `table.records`, `table.pagination` or `table.addPopup.visible` directly.
- **React**: wrap components that read model state with `observer` from `@formvk/reactive-react`; create the model lazily with `useState(() => new TableModel(...))`.
- **Popups**: render based on `visible` and call `onSubmit()` on save; the model closes the popup on success.

See the [API Reference](/en/models/reference) for every option, state field and method.
