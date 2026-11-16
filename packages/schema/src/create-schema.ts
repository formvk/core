import type {
  ExplicitTypeArgGuard,
  SchemaCreator,
  SchemaCreatorLike,
  SchemaPatchInput,
  SchemaPropertiesInjection,
  SchemaPropertiesValues,
  ValidateSchemaProperties,
} from './fragment-types'
import type { ISchema } from './types'

/**
 * 对象 schema 快捷组装器。
 * 默认不内置任何 patch，creator 使用传入的 patches 展开。
 *
 * 第一个 overload 与 formily-pro 的 createSchema 对齐：`IValues` 同时作为根级 record 上下文注入
 * properties，因此顶层 creator 的 reactions 中 `field.record` / `scope.$record` / `scope.$values`
 * 都能拿到完整的表单值类型；每个键的 creator 还会从上下文推断出该键的值类型，`field.value` 同样有类型。
 * 注意 creator 不要写显式值泛型（`f.Field<number>`）：显式泛型会让 TS 放弃从上下文推断 record，
 * 此时 record 仍是 any。
 * `IValues` 默认 never 配合 Guard：不传泛型时该 overload 不参与匹配，交给下方的推断 overload。
 */
export function createSchema<IValues extends object = never, IScope extends object = {}>(
  // NoInfer 阻止 TS 从入参反向推断 IValues：否则未显式传泛型的调用也会命中本 overload，
  // 值类型退化为 unknown，推断 overload 就失效了
  properties: ExplicitTypeArgGuard<IValues, NoInfer<SchemaPropertiesInjection<IValues, IScope>>>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & {
  _$types$_: [IValues]
}
export function createSchema<
  Properties extends Record<string, unknown>,
  IValues extends SchemaPropertiesValues<Properties>,
>(
  properties: Properties & ValidateSchemaProperties<Properties>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & {
  _$types$_: [IValues]
}
export function createSchema(
  properties: Record<string, SchemaCreatorLike | ISchema | null | undefined>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
) {
  const result = {
    type: 'object',
    properties: {},
  } as ISchema

  Object.keys(properties).forEach(key => {
    const generator = properties[key]
    if (typeof generator === 'function') {
      result.properties![key] = generator(patches)
    } else if (generator && typeof generator === 'object') {
      result.properties![key] = generator as ISchema
    }
  })

  return result
}

export type { SchemaCreator }
