import { Reactive, Ref } from '@formvk/reactive'
import type { DisplayTypes, PatternTypes } from '../type'

export class BaseField<Decorator = any, Component = any> {
  /**
   * 字段标题
   */
  @Ref
  accessor title: any
  /**
   * 字段描述，用于提示用户
   */
  @Ref
  accessor description: any
  /**
   * 字段自身的展示类型
   */
  @Ref
  accessor selfDisplay: DisplayTypes | undefined
  /**
   * 字段自身的展示模式
   */
  @Ref
  accessor selfPattern: PatternTypes | undefined
  /**
   * 字段是否已经初始化
   */
  @Ref
  accessor initialized = false
  /**
   * 字段是否已经挂载，即已经渲染到页面上
   */
  @Ref
  accessor mounted = false
  /**
   * 字段是否已经卸载，即已经从页面上移除
   * - 当字段组件被卸载时，会将 `unmounted` 设置为 `true`
   * - 当字段组件被重新挂载时，会将 `unmounted` 设置为 `false`
   * - 当字段 `display` 为 `none` 或 `hidden` 时，会将 `unmounted` 设置为 `true`
   */
  @Ref
  accessor unmounted = false

  /**
   * 字段内容
   * - react场景下会作为children传递给组件
   * - vue场景下 为对象会作为slots传递给组件，为函数或者字符串会作为 slots default 传递给组件
   */
  @Ref
  accessor content: any

  /**
   * 字段额外数据
   */
  @Reactive
  accessor data: Record<string, any> = {}

  @Ref
  accessor decorator: Decorator
  @Reactive
  accessor decoratorProps: Record<string, any>
  @Ref
  accessor component: Component
  @Reactive
  accessor componentProps: Record<string, any>

  @Ref
  accessor address: FormPath
  @Ref
  accessor path: FormPath
}
