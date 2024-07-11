export enum DisplayTypes {
  /**
   * 不展示, 且字段值不会被收集
   */
  NONE = 'none',
  /**
   * 隐藏, 但字段值会被收集
   */
  HIDDEN = 'hidden',
  /**
   * 显示
   */
  VISIBLE = 'visible',
}

export enum PatternTypes {
  /**
   * 可编辑
   */
  EDITABLE = 'editable',
  /**
   * 只读
   */
  READ_ONLY = 'readOnly',
  /**
   * 禁用
   */
  DISABLED = 'disabled',
  /**
   * 只读且不可编辑, 用于数据展示
   */
  READ_PRETTY = 'readPretty',
}
