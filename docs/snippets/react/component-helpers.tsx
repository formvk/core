import { connect, mapProps, mapReadPretty } from '@formvk/react'
import type { ChangeEvent } from 'react'

function BaseInput(props: Record<string, unknown>) {
  return <input {...props} />
}
interface SelectOption {
  label: string
  value: string
}
function BaseSelect(props: {
  value?: string
  options?: SelectOption[]
  disabled?: boolean
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <select value={props.value ?? ''} disabled={props.disabled} onChange={props.onChange}>
      {props.options?.map(item => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  )
}
function PreviewText(props: { value?: unknown }) {
  return <span>{props.value as string}</span>
}

// #region map-props
export const ConnectedInput = mapProps(
  { visible: 'hidden' },
  { value: true, disabled: 'disabled', readOnly: 'readOnly' }
)(BaseInput)
// #endregion

// #region read-pretty
export const ReadPrettyInput = mapReadPretty(PreviewText)(BaseInput)
// #endregion

// #region connect
export const Input = connect(BaseInput, mapProps({ value: true }), mapReadPretty(PreviewText))
// #endregion

// #region data-source
export const Select = connect(BaseSelect, mapProps({ dataSource: 'options', value: true, disabled: 'disabled' }))
// #endregion
