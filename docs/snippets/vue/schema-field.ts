import { createSchema, createSchemaOptions } from '@formvk/vue'
import { defineComponent } from 'vue'

const Input = defineComponent({ props: { placeholder: String, value: String } })
const Select = defineComponent({ props: { placeholder: String } })
const FormLayout = defineComponent({ props: {} })
const ArrayItems = defineComponent({ props: {} })

// #region full
const components = {
  Input,
  Select,
}

const { OptionsProvider, fragment: f } = createSchemaOptions({
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
      const value = field.value // string | undefined: the value may be absent from form.values
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
const { fragment: g } = createSchemaOptions({ components: { Input } })

const inferredSchema = createSchema({
  // Field needs no generic: its value type comes from the parent record
  age: g.Field({ required: true }),
})
// #endregion

void OptionsProvider
void schema
void inferredSchema
