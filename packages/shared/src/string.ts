// ansiRegex
function ansiRegex() {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
  ].join('|')

  return new RegExp(pattern, 'g')
}

// astralRegex
const regex = '[\uD800-\uDBFF][\uDC00-\uDFFF]'

function astralRegex(opts?: { exact: boolean }) {
  return opts && opts.exact ? new RegExp(`^${regex}$`) : new RegExp(regex, 'g')
}

// stripAnsi
function stripAnsi(input: any) {
  return typeof input === 'string' ? input.replace(ansiRegex(), '') : input
}

export function stringLength(input: string) {
  return stripAnsi(input).replace(astralRegex(), ' ').length
}

export function lowerCase(input: string) {
  return input.toLowerCase()
}

/** 'validate-error' -> 'ValidateError' */
export function pascalCase(input: string) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
