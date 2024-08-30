<script setup lang="tsx">
import { Form } from '@formvk/core'
import { provideForm, RecursionField, Field, createSchemaField } from '@formvk/vue'
import { Schema } from '@formvk/schema'
import { ref } from 'vue'
import { Input } from './components/Input'
console.log(Input)
const form = new Form({
  values: {
    name: '123',
    age: 12,
  },
})
console.log(form)
provideForm(form)
const schema = new Schema({
  type: 'string',
  definitions: {
    name: {
      type: 'string',
      title: 'Name',
      required: true,
      component: 'input',
      componentProps: {
        placeholder: 'Please enter your name',
      },
    },
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      required: true,
      component: 'Input',
      componentProps: {
        placeholder: '1',
      },
    },
    age: {
      type: 'string',
      title: 'Name',
      required: true,
      component: 'Input',
      componentProps: {
        placeholder: '2',
        type: 'number',
      },
    },
    address: {
      type: 'object',
      properties: {
        city: {
          component: 'Input',
        },
      },
    },
  },
})

console.log(schema)

const { SchemaField } = createSchemaField({
  components: { Input },
})

const onSubmit = async () => {
  console.log(form.values)
  console.log(name.value)
  const result = await form.submit()
  console.log(result)
}
const name = ref('123')
</script>

<template>
  <div>
    <!-- <RecursionField :schema /> -->
    <!-- <Field name="name1" :component="['button']" content="测试" /> -->
    <SchemaField :schema="schema" />
    <button @click="onSubmit">提交</button>
  </div>
</template>

<style scoped></style>
