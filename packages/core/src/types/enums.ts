/**
 * 表单和字段的模式类型
 * 优先级：`editable` > `readPretty` > `readOnly` > `disabled`
 */
export const enum PatternTypes {
  /**
   * 可编辑模式
   */
  EDITABLE = 'editable',
  /**
   * 阅读模式
   */
  READ_PRETTY = 'readPretty',
  /**
   * 只读模式
   */
  READ_ONLY = 'readOnly',
  /**
   * 禁用模式
   */
  DISABLED = 'disabled',
}

export const enum DisplayTypes {
  /**
   * 显示
   */
  VISIBLE = 'visible',
  /**
   * 隐藏但值保留
   */
  HIDDEN = 'hidden',
  /**
   * 不显示且值为空
   */
  NONE = 'none',
}

export enum LifeCycleTypes {
  /**
   * Form LifeCycle
   **/

  ON_FORM_INIT = 'onFormInit',
  ON_FORM_MOUNT = 'onFormMount',
  ON_FORM_UNMOUNT = 'onFormUnmount',

  ON_FORM_INPUT_CHANGE = 'onFormInputChange',
  ON_FORM_VALUES_CHANGE = 'onFormValuesChange',
  ON_FORM_INITIAL_VALUES_CHANGE = 'onFormInitialValuesChange',

  ON_FORM_SUBMIT = 'onFormSubmit',
  ON_FORM_RESET = 'onFormReset',
  ON_FORM_SUBMIT_START = 'onFormSubmitStart',
  ON_FORM_SUBMITTING = 'onFormSubmitting',
  ON_FORM_SUBMIT_END = 'onFormSubmitEnd',
  ON_FORM_SUBMIT_VALIDATE_START = 'onFormSubmitValidateStart',
  ON_FORM_SUBMIT_VALIDATE_SUCCESS = 'onFormSubmitValidateSuccess',
  ON_FORM_SUBMIT_VALIDATE_FAILED = 'onFormSubmitValidateFailed',
  ON_FORM_SUBMIT_VALIDATE_END = 'onFormSubmitValidateEnd',
  ON_FORM_SUBMIT_SUCCESS = 'onFormSubmitSuccess',
  ON_FORM_SUBMIT_FAILED = 'onFormSubmitFailed',
  ON_FORM_VALIDATE_START = 'onFormValidateStart',
  ON_FORM_VALIDATING = 'onFormValidating',
  ON_FORM_VALIDATE_SUCCESS = 'onFormValidateSuccess',
  ON_FORM_VALIDATE_FAILED = 'onFormValidateFailed',
  ON_FORM_VALIDATE_END = 'onFormValidateEnd',

  ON_FORM_GRAPH_CHANGE = 'onFormGraphChange',
  ON_FORM_LOADING = 'onFormLoading',

  /**
   * Field LifeCycle
   **/

  ON_FIELD_INIT = 'onFieldInit',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INITIAL_VALUE_CHANGE = 'onFieldInitialValueChange',

  ON_FIELD_SUBMIT = 'onFieldSubmit',
  ON_FIELD_SUBMIT_START = 'onFieldSubmitStart',
  ON_FIELD_SUBMITTING = 'onFieldSubmitting',
  ON_FIELD_SUBMIT_END = 'onFieldSubmitEnd',
  ON_FIELD_SUBMIT_VALIDATE_START = 'onFieldSubmitValidateStart',
  ON_FIELD_SUBMIT_VALIDATE_SUCCESS = 'onFieldSubmitValidateSuccess',
  ON_FIELD_SUBMIT_VALIDATE_FAILED = 'onFieldSubmitValidateFailed',
  ON_FIELD_SUBMIT_VALIDATE_END = 'onFieldSubmitValidateEnd',
  ON_FIELD_SUBMIT_SUCCESS = 'onFieldSubmitSuccess',
  ON_FIELD_SUBMIT_FAILED = 'onFieldSubmitFailed',
  ON_FIELD_VALIDATE_START = 'onFieldValidateStart',
  ON_FIELD_VALIDATING = 'onFieldValidating',
  ON_FIELD_VALIDATE_SUCCESS = 'onFieldValidateSuccess',
  ON_FIELD_VALIDATE_FAILED = 'onFieldValidateFailed',
  ON_FIELD_VALIDATE_END = 'onFieldValidateEnd',

  ON_FIELD_LOADING = 'onFieldLoading',
  ON_FIELD_RESET = 'onFieldReset',
  ON_FIELD_MOUNT = 'onFieldMount',
  ON_FIELD_UNMOUNT = 'onFieldUnmount',
}
