# Dynamic Reactions

Reactions update a field when other values change: show or hide it, toggle `required`, rewrite state or even swap the field schema. Reactions live in the schema, so they are framework-agnostic.

<ReactMount :component="ReactReactionsDemo" />

The demo reuses the same `reactions` functions — only the component wrapper and JSX differ:

<<< @/demos/react/reactions.tsx

<script setup lang="ts">
import ReactReactionsDemo from '../../demos/react/reactions'
</script>

## How a reaction works

<<< @/snippets/schema/example-reactions.ts

- A reaction is a plain function `(field) => void`. Everything it reads — `field.form.values.plan`, `field.value`, an external store — is tracked automatically, so there is no dependency list to maintain.
- Write to the field directly: `field.visible`, `field.required`, `field.title`, `field.componentProps` and the other field state keys.
- Think in the same terms as an effect: read the data you need, then write the state that should change.
- The object form (`dependencies` / `when` / `fulfill` / `otherwise`) still works, but it only exists for plain JSON schemas that cannot carry functions — see the [schema reference](/schema/reference#reactions).

## Expressions in schema values

Any expression-capable value can use <code v-pre>{{ ... }}</code> directly, for example a dynamic placeholder:

```ts
company: f.Input({
  title: 'Company',
  componentProps: {
    placeholder: '{{ $values.plan === "free" ? "Acme Inc." : "Your company" }}',
  },
})
```

The available scope keys are `$values`, `$form`, `$self`, `$record`, `$records`, `$index` and `$lookup`.

## Hidden fields and validation

A field whose `visible` is `false` is not rendered and is skipped by `form.validate()` / `form.submit()`. That is why the demo can submit successfully while `subscribe` is off, even though `email` is required.

## Next steps

- [Array List](/react/examples/array-list) — reactions meet repeatable fields.
- [Schema overview](/schema/) — expressions and reactions in context.
- [Vue version](/vue/examples/reactions) — the same schema with the Vue binding.
