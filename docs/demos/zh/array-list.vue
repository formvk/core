<script setup lang="ts">
import { createForm, FormProvider, createSchema, createSchemaOptions, SchemaField } from '@formvk/vue'
import { ref } from 'vue'

import { DemoArrayItems, demoComponents, FormItem } from '../components'

const form = createForm({
  values: {
    members: [{ id: 'member-1', name: 'Alice', email: 'alice@example.com' }],
  },
})

const submitted = ref('')

const { OptionsProvider, fragment: f } = createSchemaOptions({
  components: demoComponents,
  voidComponents: { FormItem },
  arrayComponents: { ArrayItems: DemoArrayItems },
  defaultDecorator: 'FormItem',
})

// 新增行携带稳定 id，recordKey 才能在删除/重排时复用行组件实例
let memberUid = 1
function createMember() {
  return { id: `member-${++memberUid}` }
}

const schema = createSchema({
  members: f.ArrayItems(
    f.Object({
      // 隐藏字段，但属于数据模型：recordKey 需要 schema 声明过的 key
      id: f.Input({ hidden: true }),
      name: f.Input({
        title: '姓名',
        required: true,
        validator: [{ required: true, message: '请输入姓名' }],
        componentProps: { placeholder: '例如：张三' },
      }),
      email: f.Input({
        title: '邮箱',
        componentProps: { placeholder: 'you@example.com' },
      }),
    }),
    {
      title: '成员',
      // 默认装饰器只作用于 string 字段，array 需要显式声明
      decorator: 'FormItem',
      // id 在行内不可变，适合作为渲染键
      recordKey: 'id',
      componentProps: { addText: '添加成员', removeText: '删除', createItem: createMember },
    }
  ),
})

async function onSubmit() {
  try {
    submitted.value = JSON.stringify(await form.submit(), null, 2)
  } catch {
    submitted.value = '请修正高亮的字段。'
  }
}
</script>

<template>
  <OptionsProvider>
    <FormProvider :form="form">
      <div class="dv-demo">
        <SchemaField :schema="schema" />
        <div class="dv-actions">
          <button class="dv-btn" @click="onSubmit">提交</button>
        </div>
        <div v-if="submitted" class="dv-result">
          <pre>{{ submitted }}</pre>
        </div>
      </div>
    </FormProvider>
  </OptionsProvider>
</template>
