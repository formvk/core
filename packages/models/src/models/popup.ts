import type { Form, IFormProps } from '@formvk/core'
import { createForm } from '@formvk/core'
import { shallowRef } from '@formvk/reactive'
import { clone } from '@formvk/shared'

export interface PopupOptions<IValues extends object> extends IFormProps<IValues> {}

/**
 * 弹窗表单模型：open 时用传入值重建 form，提交成功后自动关闭。
 * 与 UI 无关，React / Vue 容器可以复用同一实例。
 */
export class PopupModel<IValues extends object = any> {
  @shallowRef accessor visible = false

  @shallowRef accessor form: Form<IValues>

  constructor(
    private submit: (values: IValues) => Promise<boolean | void>,
    public options: PopupOptions<IValues> = {}
  ) {
    this.form = this.createForm()
  }

  protected createForm(options?: IFormProps<IValues>) {
    return createForm<IValues>({ ...this.options, ...options })
  }

  open(values?: Partial<IValues>, initialValues?: Partial<IValues>) {
    const options: IFormProps<IValues> = {}
    // 仅在显式传入时覆盖，避免无参调用把 options 中的默认值置空
    if (values !== undefined) {
      options.values = clone(values)
    }
    if (initialValues !== undefined) {
      options.initialValues = clone(initialValues)
    }
    this.form = this.createForm(options)
    this.visible = true
  }

  close() {
    this.visible = false
  }

  async onSubmit(): Promise<boolean | void> {
    let result: boolean | void = false
    await this.form.submit(async values => {
      result = await this.submit(values)
      // 业务返回 truthy 时自动关闭弹窗
      if (result) {
        this.close()
      }
    })
    return result
  }
}
