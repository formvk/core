<script setup lang="ts">
import type { PopupModel } from '@formvk/models'
import { createSchemaOptions, FormProvider, type ISchema, SchemaField } from '@formvk/vue'

import { ArrayItems, components, FormItem } from './index'

const props = withDefaults(
  defineProps<{
    model: PopupModel<any>
    schema: ISchema
    title?: string
    okText?: string
    cancelText?: string
  }>(),
  { okText: '保存', cancelText: '取消' }
)

const { OptionsProvider } = createSchemaOptions({
  components,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems },
  defaultDecorator: 'FormItem',
})

async function onSubmit() {
  try {
    await props.model.onSubmit()
  } catch {
    // 校验失败时字段自身会展示错误，弹窗保持打开
  }
}
</script>

<template>
  <OptionsProvider>
    <div v-if="model.visible" class="dv-popup">
      <div class="dv-popup__body">
        <h4 v-if="title" class="dv-popup__title">{{ title }}</h4>
        <FormProvider :form="model.form">
          <SchemaField :schema="schema" />
        </FormProvider>
        <div class="dv-popup__actions">
          <button class="dv-popup__btn" @click="onSubmit">{{ okText }}</button>
          <button class="dv-popup__btn dv-popup__btn--ghost" @click="model.close()">{{ cancelText }}</button>
        </div>
      </div>
    </div>
  </OptionsProvider>
</template>

<style>
.dv-popup {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--dv-demo-backdrop, rgb(0 0 0 / 45%));
}

.dv-popup__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, 100%);
  padding: 20px;
  color: var(--dv-demo-text-1, #1e293b);
  background-color: var(--dv-demo-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 20%);
}

/* 暗色下加深投影并补一条边框，避免面板与遮罩糊在一起 */
.dark .dv-popup__body {
  border: 1px solid var(--dv-demo-divider, #2e2e32);
  box-shadow: 0 12px 32px rgb(0 0 0 / 60%);
}

.dv-popup__title {
  margin: 0;
  font-size: 16px;
}

/* Schema 字段布局：文档站由主题提供，这里补齐让在线沙箱同样有样式 */
.dv-popup .dv-field {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 2px 10px;
  align-items: start;
  margin-bottom: 0;
}

.dv-popup .dv-field__label {
  padding-top: 7px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--dv-demo-text-1, #1e293b);
}

.dv-popup .dv-field__required {
  margin-left: 2px;
  font-style: normal;
  color: var(--dv-demo-danger, #e5484d);
}

.dv-popup .dv-field__control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dv-popup .dv-field__description {
  font-size: 12px;
  color: var(--dv-demo-text-2, #64748b);
}

.dv-popup .dv-field__error {
  font-size: 12px;
  color: var(--dv-demo-danger, #e5484d);
}

.dv-popup .dv-input,
.dv-popup .dv-select {
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

.dv-popup .dv-input:focus,
.dv-popup .dv-select:focus {
  border-color: var(--dv-demo-brand, #2563eb);
  box-shadow: 0 0 0 3px var(--dv-demo-brand-soft, rgb(37 99 235 / 14%));
}

.dv-popup__actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.dv-popup__btn {
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

.dv-popup__btn:hover {
  opacity: 0.88;
}

.dv-popup__btn--ghost {
  color: var(--dv-demo-text-1, #1e293b);
  background-color: transparent;
  border-color: var(--dv-demo-divider, #e2e8f0);
}
</style>
