# Basic Form

A complete form with initial values, validation rules, submit and reset. The schema is built with the fragment returned by `createSchemaField`, and the form is created lazily inside the component so every instance owns an independent model.

<demo react="../../demos/react/basic-form.tsx" stackblitz="true" />

## How it works

- `createSchemaField` and `createSchema` run at module level — they are static and safely shared. `createForm` runs inside `useState(() => createForm(...))`, so it executes once per component instance and `FormProvider` disposes the model on unmount.
- The component that reads `form.submitting` is wrapped with `observer` from `@formvk/reactive-react`; without it, React would not re-render when the flag changes.
- `validator` accepts a single rule object or an array of rule descriptions. `required: true` adds the required rule and marks the field as required.
- `form.submit()` validates every editable field, then resolves with a plain values object — or rejects with the form errors.
- `form.reset()` restores the initial values.

## Validate without submitting

```ts
try {
  await form.validate()
  console.log('valid')
} catch (errors) {
  console.log('invalid', errors)
}
```

## Next steps

- [Dynamic Reactions](/react/examples/reactions) — show and hide fields based on other values.
- [Array List](/react/examples/array-list) — repeatable field groups.
- [Vue version](/vue/examples/basic-form) — the same form with the Vue binding.
