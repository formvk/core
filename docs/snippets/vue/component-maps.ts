import { createFragment, createSchemaOptions } from '@formvk/vue'
import { defineComponent } from 'vue'

// In a real app these are imported SFCs, e.g. import MyInput from './MyInput.vue'
const MyInput = defineComponent({ props: { placeholder: String } })
const MySelect = defineComponent({ props: { placeholder: String } })
const MyCard = defineComponent({ props: { title: String } })
const MyArrayItems = defineComponent({ props: { maxItems: Number } })

// #region props-map
// Component map: name → component type. Props are extracted from the component itself.
interface FieldMap {
  Input: typeof MyInput
  Select: typeof MySelect
}

const f = createFragment<FieldMap>()

f.Input({ componentProps: { placeholder: 'Name' } })
// typo or unknown prop here is a type error
// #endregion

// #region void-array
interface VoidMap {
  Card: typeof MyCard
}
interface ArrayMap {
  ArrayItems: typeof MyArrayItems
}

const f2 = createFragment<FieldMap, VoidMap, ArrayMap>({
  arrayComponentNames: ['ArrayItems'],
})
// #endregion

// #region inference
const { fragment: g } = createSchemaOptions({
  components: { Input: MyInput },
  arrayComponents: { ArrayItems: MyArrayItems },
})

g.Input({ componentProps: { placeholder: 'Name' } }) // checked against MyInput's props
// #endregion

void f
void f2
