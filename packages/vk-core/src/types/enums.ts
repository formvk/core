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
