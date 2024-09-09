import { connect, setValueProp } from '@formvk/vue'
import { Input as AntdvInput } from 'ant-design-vue'
import { defineComponent } from 'vue'

export const Input = connect(AntdvInput, setValueProp('value'))

export const TTInput = defineComponent({
  setup() {
    return () => {
      return <div>TTInput</div>
    }
  },
})
