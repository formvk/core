import type { PopupModel } from '@formvk/models'
import { createSchemaField, FormProvider, type ISchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { DemoArrayItems, demoComponents, FormItem } from './index'

import './demo-popup.css'

const { SchemaField } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

export interface DemoPopupProps {
  model: PopupModel<any>
  schema: ISchema
  title?: string
  okText?: string
  cancelText?: string
}

export const DemoPopup = observer(
  ({ model, schema, title, okText = 'Save', cancelText = 'Cancel' }: DemoPopupProps) => {
    if (!model.visible) return null

    async function onSubmit() {
      try {
        await model.onSubmit()
      } catch {
        // Validation errors are rendered by the fields, keep the popup open
      }
    }

    return (
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
    )
  }
)

DemoPopup.displayName = 'DemoPopup'
