<script setup lang="ts">
import type { PopupModel } from '@formvk/models'
import { createSchemaField, FormProvider, type ISchema } from '@formvk/vue'

import { DemoArrayItems, demoComponents, FormItem } from './index'

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

const { SchemaField } = createSchemaField({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
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
  background-color: rgb(0 0 0 / 45%);
}

.dv-popup__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, 100%);
  padding: 20px;
  color: var(--vp-c-text-1, #1e293b);
  background-color: var(--vp-c-bg, #fff);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 20%);
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
  color: var(--vp-c-text-1, #1e293b);
}

.dv-popup .dv-field__required {
  margin-left: 2px;
  font-style: normal;
  color: #e5484d;
}

.dv-popup .dv-field__control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dv-popup .dv-field__description {
  font-size: 12px;
  color: var(--vp-c-text-2, #64748b);
}

.dv-popup .dv-field__error {
  font-size: 12px;
  color: #e5484d;
}

.dv-popup .dv-input,
.dv-popup .dv-select {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 12px;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1, #1e293b);
  background-color: var(--vp-c-bg, #fff);
  outline: none;
}

.dv-popup .dv-input:focus,
.dv-popup .dv-select:focus {
  border-color: var(--vp-c-brand-1, #2563eb);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft, rgb(37 99 235 / 14%));
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
  color: #fff;
  cursor: pointer;
  background-color: var(--vp-c-brand-1, #2563eb);
  transition:
    opacity 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.dv-popup__btn:hover {
  opacity: 0.88;
}

.dv-popup__btn--ghost {
  color: var(--vp-c-text-1, #1e293b);
  background-color: transparent;
  border-color: var(--vp-c-divider, #e2e8f0);
}
</style>
