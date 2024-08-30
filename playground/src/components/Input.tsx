import { connect, markValueProp } from '@formvk/vue'
import { Input as AntdvInput } from 'ant-design-vue'

export const Input = connect(AntdvInput, markValueProp('value'))
