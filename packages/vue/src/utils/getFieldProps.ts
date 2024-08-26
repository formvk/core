export const VoidFieldPropsArr = [
  'name',
  'basePath',
  'title',
  'description',
  'display',
  'pattern',
  'hidden',
  'visible',
  'editable',
  'disabled',
  'readOnly',
  'readPretty',
  'decorator',
  'component',
  'reactions',
] as const

export const FieldPropsArr = [
  ...VoidFieldPropsArr,
  'value',
  'initialValue',
  'dataSource',
  'validator',
  'validateFirst',
] as const
