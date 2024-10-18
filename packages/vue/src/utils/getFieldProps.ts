export const VoidFieldPropsArr = [
  'name',
  'title',
  'description',
  'display',
  'mode',
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
