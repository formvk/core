import { connect, mapProps, mapReadPretty } from '@formvk/react'

function BaseInput(props: Record<string, unknown>) {
  return <input {...props} />
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
