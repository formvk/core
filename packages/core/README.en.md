# @formvk/core

[English](./README.en.md) | [简体中文](./README.md)

Framework-agnostic form engine behind Formvk. It owns the form model — `Form`, `Field`, `ArrayField`, `ObjectField` and `VoidField` — with reactive values, field queries, lifecycle effects and the validation/submit pipeline. It has no dependency on Vue or React.

## Install

```bash
pnpm add @formvk/core
```

## Usage

```ts
import { createForm, onFieldValueChange } from '@formvk/core'

const form = createForm({
  values: {
    name: 'alice',
    address: { city: '', zip: '' },
  },
  effects() {
    onFieldValueChange('address.city', (_field, form) => {
      form.setFieldState('address.zip', state => {
        state.value = ''
      })
    })
  },
})

// values are reactive: any mutation is tracked by the model
form.values.name = 'bob'

await form.validate()
await form.submit(values => {
  console.log(values)
})
```

Fields can also be created imperatively:

```ts
const email = form.createField({ name: 'email', required: true })
email.setValue('alice@example.com')
```

## API

- **Form model** — `createForm(options)`, `Form`, `Field`, `ArrayField`, `ObjectField`, `VoidField`, `Query`, `Graph`, `Heart`, `LifeCycle`.
- **Effects** — `onFormInit`, `onFormMount`, `onFormValuesChange`, `onFormSubmit`, `onFieldInit`, `onFieldValueChange`, `onFieldInputValueChange`, `onFieldReact`, ...
- **Validation & submit** — `form.validate()`, `form.submit()`, `form.reset()`, `form.setValues()`.
- **Type guards** — `isForm`, `isField`, `isDataField`, `isArrayField`, `isObjectField`, `isVoidField`, `isGeneralField`, ...
- **Validator registry** — `registerValidateRules`, `registerValidateFormats`, `registerValidateLocale`, `setValidateLanguage`, ...

`@formvk/schema` compiles schemas into this model, and `@formvk/react` / `@formvk/vue` render it.

## Documentation

- Core API: https://formvk.github.io/core/en/api/core
- Getting started: https://formvk.github.io/core/en/guide/getting-started

## License

MIT
