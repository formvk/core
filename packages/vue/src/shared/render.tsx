import { isValid } from '@formvk/shared'

export function isVueOptions(options: Record<string, unknown>) {
  return (
    typeof options.template === 'string' || typeof options.render === 'function' || typeof options.setup === 'function'
  )
}

export function mergeRender(render: (...args: any) => any, extra?: any): (...args: any) => any {
  if (!isValid(extra)) {
    return render
  }
  if (typeof extra === 'string') {
    return () => (
      <>
        {render()}
        {extra}
      </>
    )
  }
  if (!isVueOptions(extra) && typeof extra !== 'function') {
    return render
  }
  if (isVueOptions(extra) || typeof extra === 'function') {
    const Extra = extra
    return (props: any) => {
      return (
        <>
          {render()}
          <Extra {...props} />
        </>
      )
    }
  }
  return render
}
