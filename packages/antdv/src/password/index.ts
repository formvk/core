import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { Input } from 'ant-design-vue'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

export const Password = connect(
  itemRender(Input.Password),
  mapProps(props => {
    return {
      ...props,
    }
  }),
  mapReadPretty(PreviewText.Input)
)

export default Password
