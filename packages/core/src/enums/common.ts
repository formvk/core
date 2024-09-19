export enum DisplayTypes {
  /**
   * 不展示, 且数据不会被收集
   */
  NONE = 'none',
  /**
   * 不展示, 但数据会被收集，仅隐藏UI
   */
  HIDDEN = 'hidden',
  /**
   * 显示, 且数据会被收集
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
  READONLY = 'readonly',
  /**
   * 禁用
   */
  DISABLED = 'disabled',
  /**
   * 阅读态
   */
  READ_PRETTY = 'readPretty',
}
