import type { ComponentProps } from '@formvk/vue'
import { createFragment, createSchemaField } from '@formvk/vue'
import { defineComponent } from 'vue'

// In a real app these are imported SFCs, e.g. import MyInput from './MyInput.vue'
const MyInput = defineComponent({ props: { placeholder: String } })
const MySelect = defineComponent({ props: { placeholder: String } })
const MyArrayItems = defineComponent({ props: { maxItems: Number } })

// #region props-map
const fieldComponents = {
  Input: MyInput,
  Select: MySelect,
}

interface FieldMap {
  Input: ComponentProps<typeof MyInput>
  Select: ComponentProps<typeof MySelect>
}

const f = createFragment<FieldMap>()

f.Input({ componentProps: { placeholder: 'Name' } })
// typo or unknown prop here is a type error
// #endregion

// #region void-array
interface VoidMap {
  Card: { title?: string }
}
interface ArrayMap {
  ArrayItems: ComponentProps<typeof MyArrayItems>
}

const f2 = createFragment<FieldMap, VoidMap, ArrayMap>({
  arrayComponentNames: ['ArrayItems'],
})
// #endregion

// #region inference
const { fragment: g } = createSchemaField({
  components: { Input: MyInput },
  arrayComponents: { ArrayItems: MyArrayItems },
})

g.Input({ componentProps: { placeholder: 'Name' } }) // checked against MyInput's props
// #endregion

void fieldComponents
void f
void f2
