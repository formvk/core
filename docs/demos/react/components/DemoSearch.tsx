import type { TableModel } from '@formvk/models'
import { createSchemaField, FormProvider, type ISchema } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { DemoArrayItems, demoComponents, FormItem } from './index'

import './demo-search.css'

const { SchemaField } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

export interface DemoSearchProps {
  model: TableModel
  schema: ISchema
}

export const DemoSearch = observer(function DemoSearch({ model, schema }: DemoSearchProps) {
  async function onReset() {
    await model.form.reset()
    await model.resetSearch()
  }

  return (
    <span className="dr-search">
      <FormProvider form={model.form}>
        <SchemaField schema={schema} />
      </FormProvider>
      <button type="button" className="dr-search__btn" onClick={() => model.onSearch()}>
        Search
      </button>
      <button type="button" className="dr-search__btn dr-search__btn--ghost" onClick={onReset}>
        Reset
      </button>
    </span>
  )
})

DemoSearch.displayName = 'DemoSearch'
