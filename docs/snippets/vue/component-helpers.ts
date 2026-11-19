import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { defineComponent } from 'vue'

const BaseInput = defineComponent({ props: { modelValue: String } })
const BaseSelect = defineComponent({
  props: { modelValue: String, options: Array, disabled: Boolean },
})
const PreviewText = defineComponent({ props: { modelValue: String } })

// #region map-props
export const ConnectedInput = mapProps({ visible: 'v-show' }, { readOnly: 'readonly' })(BaseInput)
// #endregion

// #region read-pretty
export const ReadPrettyInput = mapReadPretty(PreviewText)(BaseInput)
// #endregion

// #region connect
export const ConnectedWithConnect = connect(BaseInput, mapProps({ readOnly: 'readonly' }), mapReadPretty(PreviewText))
// #endregion

// #region data-source
export const Select = connect(BaseSelect, mapProps({ dataSource: 'options' }))
// #endregion
