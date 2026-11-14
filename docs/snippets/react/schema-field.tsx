import { createSchema, createSchemaField } from '@formvk/react'
import type { ReactNode } from 'react'

function Input(props: { placeholder?: string; value?: string }) {
  return <input placeholder={props.placeholder} value={props.value ?? ''} readOnly />
}
function Select() {
  return <select />
}
function FormLayout(props: { children?: ReactNode }) {
  return <div>{props.children}</div>
}
function ArrayItems(props: { children?: ReactNode }) {
  return <div>{props.children}</div>
}

// #region full
const components = {
  Input,
  Select,
}

const { SchemaField, fragment: f } = createSchemaField({
  components,
  voidComponents: { FormLayout },
  arrayComponents: { ArrayItems },
  scope: { $moment: (value: string) => value },
})

const schema = createSchema({
  name: f.Input({
    title: 'Name',
    // componentProps is checked against the Input component's props
    componentProps: { placeholder: 'Alice' },
    reactions: (field, scope) => {
      const value: string = field.value // string
      const moment: (value: string) => string = scope.$moment // inferred from the scope option
      void value
      void moment
    },
  }),
  profile: f.Object({}),
  members: f.ArrayItems(f.Object({})),
})
// #endregion

// #region inference
const { fragment: g } = createSchemaField({ components: { Input } })

const inferredSchema = createSchema({
  // Field needs no generic: its value type comes from the parent record
  age: g.Field({ required: true }),
})
// #endregion

void SchemaField
void schema
void inferredSchema
