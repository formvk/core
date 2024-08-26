import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { Input as AntInput, Textarea as AntTextarea } from 'ant-design-vue'
import type { InputProps as AntInputProps } from 'ant-design-vue/es/input'
import { transformComponent } from '../__builtins__'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

const TransformAntInput = transformComponent<AntInputProps>(AntInput, {
  change: 'input',
})

const TransformTextarea = transformComponent<AntInputProps>(AntTextarea, {
  change: 'input',
})

const InnerInput = connect(
  itemRender(TransformAntInput),
  mapProps({ readOnly: 'read-only' }),
  mapReadPretty(PreviewText.Input)
)
const TextArea = connect(
  itemRender(TransformTextarea),
  mapProps({ readOnly: 'read-only' }),
  mapReadPretty(PreviewText.Input)
)

export const Input = Object.assign(InnerInput, {
  TextArea,
})

export default Input
