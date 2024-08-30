<script setup lang="tsx">
import { Form } from '@formvk/core'
import { provideForm, RecursionField, Field } from '@formvk/vue'
import { Schema } from '@formvk/schema'

const form = new Form()
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
      component: 'input',
      componentProps: {
        placeholder: '1',
      },
    },
    age: {
      type: 'string',
      title: 'Name',
      required: true,
      component: 'input',
      componentProps: {
        placeholder: '2',
        type: 'number',
      },
    },
    address: {
      type: 'void',
      properties: {
        city: {
          component: 'div',
          reactions(field, scope) {
            console.log(field, { ...scope })
            setTimeout(() => {
              field.setComponent('span')
            }, 2000)
          },
        },
      },
    },
  },
})

console.log(schema)
</script>

<template>
  <div>
    <RecursionField :schema />
    <Field name="name1" :component="['input']" />
  </div>
</template>

<style scoped></style>
