import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { defineComponent } from 'vue'

const BaseInput = defineComponent({ props: { value: String } })
const BaseSelect = defineComponent({
  props: { value: String, options: Array, disabled: Boolean },
})
const PreviewText = defineComponent({ props: { value: String } })

// #region map-props
export const ConnectedInput = mapProps(
  { visible: 'v-show' },
  { value: true, disabled: 'disabled', readOnly: 'readonly' }
)(BaseInput)
// #endregion

// #region read-pretty
export const ReadPrettyInput = mapReadPretty(PreviewText)(BaseInput)
// #endregion

// #region connect
export const ConnectedWithConnect = connect(
  BaseInput,
  mapProps({ value: true, disabled: 'disabled' }),
  mapReadPretty(PreviewText)
)
// #endregion

// #region data-source
export const Select = connect(BaseSelect, mapProps({ dataSource: 'options', value: true, disabled: 'disabled' }))
// #endregion
