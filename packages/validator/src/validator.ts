import formats from './formats'
import locales from './locale'
import { parseValidator } from './parser'
import { registerValidateFormats, registerValidateLocale, registerValidateRules } from './registry'
import rules from './rules'
import type { IValidateResults, IValidatorOptions, Validator } from './types'

registerValidateRules(rules)

registerValidateLocale(locales)

registerValidateFormats(formats)

export const validate = async <Context = any>(
  value: any,
  validator?: Validator<Context>,
  options?: IValidatorOptions<Context>
): Promise<IValidateResults> => {
  const validates = parseValidator(validator, options)
  const results: IValidateResults = {
    error: [],
    success: [],
    warning: [],
  }
  for (let i = 0; i < validates.length; i++) {
    const result = await validates[i](value, options?.context)
    if (!result) continue
    const { type, message } = result
    results[type] = results[type] || []
    if (message) {
      results[type].push(message)
      if (options?.validateFirst) break
    }
  }
  return results
}
