import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { Select as AntdSelect } from 'ant-design-vue'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

export const Select = connect(
  itemRender(AntdSelect),
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    ({ useNull, ...props }, field) => {
      let value = props.value
      if (!useNull && value === null) {
        value = undefined
      }
      return {
        ...props,
        loading: field?.['loading'] || field?.['validating'] ? true : props.loading,
        value,
      }
    }
  ),
  mapReadPretty(PreviewText.Select)
)

export default Select
