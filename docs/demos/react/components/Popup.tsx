import type { PopupModel } from '@formvk/models'
import { createSchemaOptions, FormProvider, type ISchema, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { ArrayItems, components, FormItem } from './index'

import './dr-popup.css'

const { OptionsProvider } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

export interface PopupProps {
  model: PopupModel<any>
  schema: ISchema
  title?: string
  okText?: string
  cancelText?: string
}

export const Popup = observer(({ model, schema, title, okText = '保存', cancelText = '取消' }: PopupProps) => {
  if (!model.visible) return null

  async function onSubmit() {
    try {
      await model.onSubmit()
    } catch {
      // Validation errors are rendered by the fields, keep the popup open
    }
  }

  return (
    <OptionsProvider>
      <div className="dr-popup">
        <div className="dr-popup__body">
          {title ? <h4 className="dr-popup__title">{title}</h4> : null}
          <FormProvider form={model.form}>
            <SchemaField schema={schema} />
          </FormProvider>
          <div className="dr-popup__actions">
            <button type="button" className="dr-popup__btn" onClick={onSubmit}>
              {okText}
            </button>
            <button type="button" className="dr-popup__btn dr-popup__btn--ghost" onClick={() => model.close()}>
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </OptionsProvider>
  )
})

Popup.displayName = 'Popup'
