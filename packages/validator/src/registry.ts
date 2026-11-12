import { FormPath, merge as deepmerge, each, globalThisPolyfill, isFn, isStr, lowerCase } from '@formvk/shared'

import type {
  IRegistryFormats,
  IRegistryLocaleMessages,
  IRegistryLocales,
  IRegistryRules,
  ValidatorFunction,
  ValidatorFunctionResponse,
} from './types'

const getIn = FormPath.getIn

const self = globalThisPolyfill

const defaultLanguage = 'en'

function getBrowserLanguage() {
  if (!self.navigator) {
    return defaultLanguage
  }
  return self.navigator.language || defaultLanguage
}

const registry: any = {
  locales: {
    messages: {},
    language: getBrowserLanguage(),
  },
  formats: {},
  rules: {},
  template: null,
}

function getISOCode(language: string) {
  let isoCode = registry.locales.language
  if (registry.locales.messages[language]) {
    return language
  }
  const lang = lowerCase(language)
  each(registry.locales.messages, (messages: IRegistryLocaleMessages, key: string) => {
    const target = lowerCase(key)
    if (target.indexOf(lang) > -1 || lang.indexOf(target) > -1) {
      isoCode = key
      return false
    }
  })
  return isoCode
}

export const getValidateLocaleIOSCode = getISOCode

export function setValidateLanguage(lang: string) {
  registry.locales.language = lang || defaultLanguage
}

export function getValidateLanguage() {
  return registry.locales.language
}

export function getLocaleByPath(path: string, lang: string = registry.locales.language) {
  return getIn(registry.locales.messages, `${getISOCode(lang)}.${path}`)
}

export function getValidateLocale(path: string) {
  const message = getLocaleByPath(path)
  return message || getLocaleByPath('pattern') || getLocaleByPath('pattern', defaultLanguage)
}

export function getValidateMessageTemplateEngine() {
  return registry.template
}

export function getValidateFormats(key?: string) {
  return key ? registry.formats[key] : registry.formats
}

export function getValidateRules<T>(
  key?: T
): T extends string ? ValidatorFunction : { [key: string]: ValidatorFunction } {
  return key ? registry.rules[key as any] : registry.rules
}

export function registerValidateLocale(locale: IRegistryLocales) {
  registry.locales.messages = deepmerge(registry.locales.messages, locale)
}

export function registerValidateRules(rules: IRegistryRules) {
  each(rules, (rule, key) => {
    if (isFn(rule)) {
      registry.rules[key] = rule
    }
  })
}

export function registerValidateFormats(formats: IRegistryFormats) {
  each(formats, (pattern, key) => {
    if (isStr(pattern) || pattern instanceof RegExp) {
      registry.formats[key] = new RegExp(pattern)
    }
  })
}

export function registerValidateMessageTemplateEngine(
  template: (message: ValidatorFunctionResponse, context: any) => any
) {
  registry.template = template
}
