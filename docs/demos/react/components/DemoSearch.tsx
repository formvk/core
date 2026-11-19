import type { TableModel } from '@formvk/models'
import { createSchemaOptions, FormProvider, type ISchema, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { DemoArrayItems, demoComponents, FormItem } from './index'

import './dr-search.css'

const { OptionsProvider } = createSchemaOptions({
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
    <OptionsProvider>
      <span className="dr-search">
        <FormProvider form={model.form}>
          <SchemaField schema={schema} />
        </FormProvider>
        <button type="button" className="dr-search__btn" onClick={() => model.onSearch()}>
          搜索
        </button>
        <button type="button" className="dr-search__btn dr-search__btn--ghost" onClick={onReset}>
          重置
        </button>
      </span>
    </OptionsProvider>
  )
})

DemoSearch.displayName = 'DemoSearch'
