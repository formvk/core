<script setup lang="ts">
import type { TableModel } from '@formvk/models'
import { createSchemaOptions, FormProvider, type ISchema, SchemaField } from '@formvk/vue'

import { ArrayItems, components, FormItem } from './index'

const props = defineProps<{
  model: TableModel
  schema: ISchema
}>()

const { OptionsProvider } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

async function onReset() {
  await props.model.form.reset()
  await props.model.resetSearch()
}
</script>

<template>
  <OptionsProvider>
    <span class="dv-search">
      <FormProvider :form="model.form">
        <SchemaField :schema="schema" />
      </FormProvider>
      <button class="dv-search__btn" @click="model.onSearch()">搜索</button>
      <button class="dv-search__btn dv-search__btn--ghost" @click="onReset">重置</button>
    </span>
  </OptionsProvider>
</template>

<style>
.dv-search {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

/* Schema 字段在工具栏里横向排布：文档站由主题提供基础样式，这里补齐沙箱所需的部分 */
.dv-search .dv-field {
  display: grid;
  flex: 1;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  margin-bottom: 0;
}

.dv-search .dv-field__label {
  padding-top: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--dv-demo-text-1, #1e293b);
  white-space: nowrap;
}

.dv-search .dv-field__control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dv-search .dv-field__error {
  font-size: 12px;
  color: var(--dv-demo-danger, #e5484d);
}

.dv-search .dv-input {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 12px;
  border: 1px solid var(--dv-demo-divider, #e2e8f0);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--dv-demo-text-1, #1e293b);
  background-color: var(--dv-demo-bg, #fff);
  outline: none;
}

.dv-search .dv-input:focus {
  border-color: var(--dv-demo-brand, #2563eb);
  box-shadow: 0 0 0 3px var(--dv-demo-brand-soft, rgb(37 99 235 / 14%));
}

.dv-search__btn {
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--dv-demo-on-brand, #fff);
  cursor: pointer;
  background-color: var(--dv-demo-brand, #2563eb);
  transition:
    opacity 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.dv-search__btn:hover {
  opacity: 0.88;
}

.dv-search__btn--ghost {
  color: var(--dv-demo-text-1, #1e293b);
  background-color: transparent;
  border-color: var(--dv-demo-divider, #e2e8f0);
}
</style>
