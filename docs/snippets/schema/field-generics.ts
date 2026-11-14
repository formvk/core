import { createFragment } from '@formvk/schema'

interface MyFieldComponents {
  Input: { placeholder?: string }
}
interface MyVoidComponents {
  FormLayout: Record<string, never>
}
type MyArrayComponents = Record<string, never>

interface MyScope {
  $moment: (value: string) => string
}

const f = createFragment<MyFieldComponents, MyVoidComponents, MyArrayComponents, MyScope>()

f.Object<{ name: string; age: number }>({
  name: f.Field({
    required: true,
    reactions: (field, scope) => {
      void field.value // string
      void scope.$record // { name: string; age: number } & { $lookup: any; $index: number }
      void scope.$moment // (value: string) => string
    },
  }),
  // No generic needed: the value type comes from the parent record
  age: f.Field({ required: true }),
  layout: f.FormLayout(),
  // @ts-expect-error keys not declared on the parent record only accept void nodes
  extra: f.Field(),
})
