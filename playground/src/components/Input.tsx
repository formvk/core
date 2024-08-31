import { connect, setValueProp } from '@formvk/vue'
import { Input as AntdvInput } from 'ant-design-vue'

export const Input = (props: any) => {
  const Input = connect(AntdvInput, setValueProp('value'))
  return <Input {...props} />
}
