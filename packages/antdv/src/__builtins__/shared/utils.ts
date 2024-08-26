export function isValidElement(element: any) {
  return (
    isVueOptions(element) ||
    (element &&
      typeof element === 'object' &&
      'componentOptions' in element &&
      'context' in element &&
      element.tag !== undefined)
  )
}

export function isVueOptions(options: any) {
  return options && (typeof options.template === 'string' || typeof options.render === 'function')
}

export function isEmptyElement(c: any) {
  return !(c.tag || (c.text && c.text.trim() !== ''))
}

export function filterEmpty(children = []) {
  return children.filter(c => !isEmptyElement(c))
}
