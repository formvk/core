import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { TimePicker as AntdTimePicker } from 'ant-design-vue'
import { dayjsable } from '../__builtins__'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

export const TimePicker = connect(
  itemRender(AntdTimePicker),
  mapProps(props => {
    return {
      ...props,
      defaultValue: dayjsable(props.defaultValue, props.valueFormat),
      defaultOpenValue: dayjsable(props.defaultOpenValue, props.valueFormat),
    }
  }),
  mapReadPretty(PreviewText.TimePicker)
)

export default TimePicker
