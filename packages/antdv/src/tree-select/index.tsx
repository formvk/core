import { LoadingOutlined } from '@ant-design/icons-vue'
import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import { TreeSelect as AntdTreeSelect } from 'ant-design-vue'
import { itemRender } from '../form-item'
import PreviewText from '../preview-text'

export const TreeSelect = connect(
  itemRender(AntdTreeSelect),
  mapProps(
    {
      dataSource: 'treeData',
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      }
    }
  ),
  mapReadPretty(PreviewText.TreeSelect)
)

export default TreeSelect
