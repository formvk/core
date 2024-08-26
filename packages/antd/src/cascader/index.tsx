import { LoadingOutlined } from '@ant-design/icons'
import { connect, mapProps, mapReadPretty } from '@formvk/react'
import { Cascader as AntdCascader } from 'antd'
import { PreviewText } from '../preview-text'

export const Cascader = connect(
  AntdCascader,
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      }
    }
  ),
  mapReadPretty(PreviewText.Cascader)
)

export default Cascader
