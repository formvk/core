// ansiRegex
const ansiRegex = () => {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
  ].join('|')

  return new RegExp(pattern, 'g')
}

// astralRegex
const regex = '[\uD800-\uDBFF][\uDC00-\uDFFF]'

const astralRegex = (opts?: { exact: boolean }) =>
  opts && opts.exact ? new RegExp(`^${regex}$`) : new RegExp(regex, 'g')

// stripAnsi
const stripAnsi = (input: any) => (typeof input === 'string' ? input.replace(ansiRegex(), '') : input)

export const stringLength = (input: string) => stripAnsi(input).replace(astralRegex(), ' ').length

export const lowerCase = (input: string) => input.toLowerCase()

/** 'validate-error' -> 'ValidateError' */
export const pascalCase = (input: string) =>
  input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
