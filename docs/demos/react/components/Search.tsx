import type { TableModel } from '@formvk/models'
import { createSchemaOptions, FormProvider, type ISchema, SchemaField } from '@formvk/react'
import { observer } from '@formvk/reactive-react'

import { ArrayItems, components, FormItem } from './index'

import './dr-search.css'

const { OptionsProvider } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

export interface SearchProps {
  model: TableModel
  schema: ISchema
}

export const Search = observer(function Search({ model, schema }: SearchProps) {
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

Search.displayName = 'Search'
