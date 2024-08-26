import { connect, mapProps, mapReadPretty } from '@formvk/vue'
import type { DatePickerProps } from 'ant-design-vue'
import { DatePicker as AntdDatePicker } from 'ant-design-vue'
import { itemRender } from '../form-item'
import { PreviewText } from '../preview-text'

const mapDateFormat = function () {
  const getDefaultFormat = (props: DatePickerProps) => {
    if (props['picker'] === 'month') {
      return 'YYYY-MM'
    } else if (props['picker'] === 'quarter') {
      return 'YYYY-\\QQ'
    } else if (props['picker'] === 'year') {
      return 'YYYY'
    } else if (props['picker'] === 'week') {
      return 'gggg-wo'
    } else if (props['picker'] === 'time') {
      return 'HH:mm:ss'
    }
    return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
  }
  return (props: any) => {
    const format = props.format || getDefaultFormat(props)
    const valueFormat = props.valueFormat || getDefaultFormat(props)

    return {
      ...props,
      format,
      valueFormat,
    }
  }
}

export const _DatePicker = connect(
  itemRender(AntdDatePicker),
  mapProps(mapDateFormat()),
  mapReadPretty(PreviewText.DatePicker)
)

export const _RangePicker = connect(
  itemRender(AntdDatePicker.RangePicker),
  mapProps(mapDateFormat()),
  mapReadPretty(PreviewText.DateRangePicker)
)

export const _WeekPicker = itemRender(AntdDatePicker.WeekPicker)

export const _MonthPicker = itemRender(AntdDatePicker.MonthPicker)

export const DatePicker = Object.assign(itemRender(_DatePicker), {
  RangePicker: _RangePicker,
  WeekPicker: _WeekPicker,
  MonthPicker: _MonthPicker,
})

export default DatePicker
