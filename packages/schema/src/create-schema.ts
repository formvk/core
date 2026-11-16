import type {
  SchemaCreator,
  SchemaCreatorLike,
  SchemaPatchInput,
  SchemaPropertiesValues,
  ValidateSchemaProperties,
} from './fragment-types'
import type { ISchema } from './types'

/**
 * 对象 schema 快捷组装器。
 * 默认不内置任何 patch，creator 使用传入的 patches 展开。
 */
export function createSchema<
  Properties extends Record<string, unknown>,
  IValues extends SchemaPropertiesValues<Properties>,
>(
  properties: Properties & ValidateSchemaProperties<Properties>,
  patches?: SchemaPatchInput | SchemaPatchInput[]
): ISchema & {
  _$types$_: [IValues]
} {
  const result = {
    type: 'object',
    properties: {},
  } as ISchema & {
    _$types$_: [IValues]
  }

  Object.keys(properties).forEach(key => {
    const generator = properties[key]
    if (typeof generator === 'function') {
      result.properties![key] = (generator as SchemaCreatorLike)(patches)
    } else if (generator && typeof generator === 'object') {
      result.properties![key] = generator as ISchema
    }
  })

  return result
}

export type { SchemaCreator }
