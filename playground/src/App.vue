<script setup lang="tsx">
import { Form } from '@formvk/core'
import { provideForm, createSchemaField } from '@formvk/vue'
import { Schema, SchemaProperties } from '@formvk/schema'
import { ref, shallowRef } from 'vue'
import { AntdvInput as Input } from './components'
console.log(Input)
const form = new Form({
  values: {
    name: '123',
    age: 12,
  },
})
console.log(form)
provideForm(form)

const length = 2500

const getSchema = () => {
  const properties = Array.from({ length }).reduce<SchemaProperties>((prev, _, index) => {
    prev[`name${index}`] = {
      type: 'string',
      title: 'Name',
      required: true,
      component: 'Input',
      componentProps: {
        placeholder: 'Please enter your name',
      },
    }
    return prev
  }, {})
  return new Schema({
    type: 'object',
    properties,
  })
}

const schemaRef = shallowRef()

const { SchemaField, SchemaStringField } = createSchemaField({
  components: { Input },
})

const onSubmit = async () => {
  console.log(form.values)
  console.log(name.value)
  const result = await form.submit()
  console.log(result)
}
const name = ref('123')

const load = () => {
  const now = performance.now()
  schemaRef.value = getSchema()
  requestAnimationFrame(() => {
    console.log('update', performance.now() - now)
  })
}

const lengthRef = ref(0)

const load1 = () => {
  const now = performance.now()
  lengthRef.value = length
  requestAnimationFrame(() => {
    console.log('update', performance.now() - now)
  })
}
</script>

<template>
  <div>
    <!-- <RecursionField :schema /> -->
    <!-- <Field name="name1" :component="['button']" content="测试" /> -->
    <SchemaField :schema="schemaRef" v-if="schemaRef">
      <SchemaStringField
        name="name2"
        component="Input"
        :componentProps="{
          placeholder: 'Please enter your name',
        }"
      />
    </SchemaField>
    <template v-for="i in lengthRef" :key="i">
      <Input placeholder="Please enter your name" :value="i" />
    </template>
    <button @click="onSubmit">提交</button>
    <button @click="load">加载</button>
    <button @click="load1">加载1</button>
  </div>
</template>

<style scoped></style>
