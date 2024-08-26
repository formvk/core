import { LoadingOutlined } from '@ant-design/icons'
import { connect, mapProps, mapReadPretty } from '@formvk/react'
import { TreeSelect as AntdTreeSelect } from 'antd'
import { PreviewText } from '../preview-text'

export const TreeSelect = connect(
  AntdTreeSelect,
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
