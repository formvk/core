import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { Checkbox as AntdCheckbox } from 'ant-design-vue'
import { defineComponent } from 'vue'
import { PreviewText } from '../preview-text'

const { Group } = AntdCheckbox

const CheckboxGroup = connect(
  Group,
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty(PreviewText.Select, {
    mode: 'tags',
  })
)

const _CheckBox = defineComponent({
  emits: ['change'],
  props: ['value'],

  setup(props, { attrs, emit, slots }) {
    const onChange = e => {
      emit('change', e.target.checked)
    }
    return () => {
      return <AntdCheckbox {...attrs} checked={props.value} onChange={onChange} v-slots={slots} />
    }
  },
})

export const Checkbox = Object.assign(_CheckBox, {
  Group: CheckboxGroup,
})

export default Checkbox
