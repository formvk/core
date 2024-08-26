import { connect, mapProps } from '@formvk/vue'
import { Switch as AntdSwitch } from 'ant-design-vue'
import { itemRender } from '../form-item'

export const Switch = connect(itemRender(AntdSwitch), mapProps({ readOnly: 'read-only', value: 'checked' }))

export default Switch
