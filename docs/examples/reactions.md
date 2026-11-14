# Dynamic Reactions

Reactions update a field when other values change: show or hide it, toggle `required`, rewrite state or even swap the field schema. Reactions live in the schema, so the two framework versions share the exact same field definitions.

## Vue 3

<ReactionsDemo />

The demo is a single Vue component:

<<< @/demos/reactions.vue

## React (TSX)

<ReactMount :component="ReactReactionsDemo" />

The React version uses the same `createExpression` / `reactions` API unchanged — only the component wrapper and JSX differ:

<<< @/demos/react/reactions.tsx

<script setup lang="ts">
import ReactionsDemo from '../demos/reactions.vue'
import ReactReactionsDemo from '../demos/react/reactions'
</script>

## How a reaction works

<<< @/snippets/schema/example-reactions.ts

- `dependencies` lists the form paths the reaction listens to, relative to the form root.
- `when` is an expression (or a plain boolean). `createExpression` keeps it typed and produces the <code v-pre>{{ ... }}</code> string.
- `fulfill` applies when `when` is truthy, `otherwise` when it is falsy.
- `state` is patched onto the field: `visible`, `required`, `title`, `componentProps` and other field state keys are supported.

## Expressions in schema values

Any expression-capable value can use <code v-pre>{{ ... }}</code> directly, for example a dynamic placeholder:

```ts
company: f.Input({
  title: 'Company',
  componentProps: {
    placeholder: exp.plan.ter('Acme Inc.', 'Your company'),
  },
})
```

The available scope keys are `$values`, `$form`, `$self`, `$record`, `$records`, `$index` and `$lookup`.

## Hidden fields and validation

A field whose `visible` is `false` is not rendered and is skipped by `form.validate()` / `form.submit()`. That is why the demo can submit successfully while `subscribe` is off, even though `email` is required.

## Next steps

- [Array List](/examples/array-list) — reactions meet repeatable fields.
- [Schema](/guide/schema) — the full schema reference.
