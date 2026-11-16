import type { Field, IFieldFactoryProps } from '@formvk/core'
import {
  onFieldInit,
  onFieldInputValueChange,
  onFieldInitialValueChange,
  onFieldMount,
  onFieldUnmount,
  onFieldValidateEnd,
  onFieldValidateFailed,
  onFieldValidateStart,
  onFieldValidateSuccess,
  onFieldValueChange,
} from '@formvk/core'
import { autorun, observable, untracked } from '@formvk/reactive'
import { each, isArr, isFn, isPlainObj, isStr, lazyMerge, reduce, toArr } from '@formvk/shared'

import { patchCompile, patchSchemaCompile, shallowCompile } from './compiler'
import type { Schema } from './schema'
import type { IFieldStateSetterOptions, ISchema, ISchemaTransformerOptions, SchemaReaction } from './types'

const FieldEffects: Record<string, any> = {
  onFieldInit,
  onFieldMount,
  onFieldUnmount,
  onFieldValueChange,
  onFieldInputValueChange,
  onFieldInitialValueChange,
  onFieldValidateStart,
  onFieldValidateEnd,
  onFieldValidateFailed,
  onFieldValidateSuccess,
}

const DefaultFieldEffects = ['onFieldInit', 'onFieldValueChange']

function getDependencyValue(field: Field, pattern: string, property?: string) {
  const [target, path] = String(pattern).split(/\s*#\s*/)
  return field.query(target).getIn(path || property || 'value')
}

function getDependencies(
  field: Field,
  dependencies: Array<string | { name?: string; source?: string; property?: string }> | object
) {
  if (isArr(dependencies)) {
    const results: any = []
    dependencies.forEach(pattern => {
      if (isStr(pattern)) {
        results.push(getDependencyValue(field, pattern))
      } else if (isPlainObj(pattern)) {
        const item = pattern as { name?: string; source?: string; property?: string }
        if (item.name && item.source) {
          results[item.name] = getDependencyValue(field, item.source, item.property)
        }
      }
    })
    return results
  } else if (isPlainObj(dependencies)) {
    return reduce(
      dependencies as Record<string, string>,
      (buf, pattern, key) => {
        buf[key] = getDependencyValue(field, pattern)
        return buf
      },
      {} as Record<string, any>
    )
  }
  return []
}

function setSchemaFieldState(options: IFieldStateSetterOptions, demand = false) {
  const { request, target, runner, field, scope } = options || {}
  if (!request) return
  if (target) {
    if (request.state) {
      field.form.setFieldState(target, state =>
        patchCompile(
          state,
          request.state,
          lazyMerge(scope as any, {
            $target: state,
          })
        )
      )
    }
    if (request.schema) {
      field.form.setFieldState(target, state =>
        patchSchemaCompile(
          state,
          request.schema!,
          lazyMerge(scope as any, {
            $target: state,
          }),
          demand
        )
      )
    }
    if (isStr(runner) && runner) {
      field.form.setFieldState(target, state => {
        shallowCompile(
          `{{function(){${runner}}}}`,
          lazyMerge(scope as any, {
            $target: state,
          })
        )()
      })
    }
  } else {
    if (request.state) {
      field.setState(state => patchCompile(state, request.state, scope))
    }
    if (request.schema) {
      field.setState(state => patchSchemaCompile(state, request.schema!, scope, demand))
    }
    if (isStr(runner) && runner) {
      shallowCompile(`{{function(){${runner}}}}`, scope)()
    }
  }
}

function getBaseScope(field: Field, options: ISchemaTransformerOptions = {}) {
  function $observable(target: any) {
    return observable(target)
  }
  function $props(props: any) {
    return field.setComponentProps(props)
  }
  function $effect(tracker: () => void) {
    return autorun(tracker)
  }
  function $memo<T>(callback: () => T) {
    return callback()
  }
  const $self = field
  const $form = field.form
  const $values = field.form.values
  return lazyMerge(
    {
      get $lookup() {
        return options?.scope?.$record ?? $values
      },
      get $records() {
        return field.records
      },
      get $record() {
        const record = field.record
        if (typeof record === 'object') {
          return lazyMerge(record, {
            get $lookup() {
              return options?.scope?.$record ?? $values
            },
            get $index() {
              return field.index
            },
          })
        }
        return record
      },
      get $index() {
        return field.index
      },
    },
    options.scope as any,
    {
      $form,
      $self,
      $observable,
      $effect,
      $memo,
      $props,
      $values,
    }
  )
}

function getBaseReactions(schema: ISchema, options: ISchemaTransformerOptions) {
  return (field: Field) => {
    setSchemaFieldState(
      {
        field,
        request: { schema },
        scope: getBaseScope(field, options),
      },
      true
    )
  }
}

function getUserReactions(schema: ISchema, options: ISchemaTransformerOptions) {
  const reactions: SchemaReaction[] = toArr(schema['reactions'])
  return reactions.map(unCompiled => {
    return (field: Field) => {
      const baseScope = getBaseScope(field, options)
      const reaction: any = shallowCompile(unCompiled, baseScope)
      if (!reaction) return
      if (isFn(reaction)) {
        return reaction(field, baseScope)
      }
      const { when, fulfill, otherwise, target, effects } = reaction
      function run() {
        const $deps = getDependencies(field, reaction.dependencies)
        const $dependencies = $deps
        const scope = lazyMerge(baseScope, {
          $target: null,
          $deps,
          $dependencies,
        })
        const compiledWhen = shallowCompile(when, scope)
        const condition = when ? compiledWhen : true
        const request = condition ? fulfill : otherwise
        const runner = request?.run
        setSchemaFieldState({
          field,
          target,
          request,
          runner,
          scope,
        })
      }

      if (target) {
        reaction.effects = effects?.length ? effects : DefaultFieldEffects
      }
      if (reaction.effects) {
        // 等价于 formily 的 autorun.memo(..., [])：每个 reaction 只注册一次监听
        if (!reaction.__effectRegistered) {
          reaction.__effectRegistered = true
          untracked(() => {
            each(reaction.effects, (type: string) => {
              if (FieldEffects[type]) {
                FieldEffects[type](field.address, run)
              }
            })
          })
        }
      } else {
        run()
      }
    }
  })
}

export function transformFieldProps(
  schema: Schema,
  options: ISchemaTransformerOptions = {}
): IFieldFactoryProps<any, any> {
  return {
    name: schema.name as any,
    reactions: [getBaseReactions(schema, options)].concat(getUserReactions(schema, options)),
  }
}
