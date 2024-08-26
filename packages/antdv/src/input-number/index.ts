import { connect, mapReadPretty } from '@formvk/vue'
import { InputNumber as AntdInputNumber } from 'ant-design-vue'
import 'vue-types'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

export const InputNumber = connect(itemRender(AntdInputNumber), mapReadPretty(PreviewText.Input))

export default InputNumber
