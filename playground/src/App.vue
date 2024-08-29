<script setup lang="tsx">
import { Form } from '@formvk/core'
import { provideForm, Field } from '@formvk/vue'
import { Schema } from '@formvk/schema'

const form = new Form()
console.log(form)
provideForm(form)
console.log(form, Field)
const schema = new Schema({
  type: 'string',
  definitions: {
    name: {
      type: 'string',
      title: 'Name',
      required: true,
    },
    age: {
      type: 'number',
      title: 'Age',
      required: true,
    },
  },
  properties: {
    name: {
      $ref: '#/definitions/name',
    },
    age: {
      $ref: '#/definitions/age',
    },
  },
})

console.log(schema)
</script>

<template>
  <div></div>
</template>

<style scoped></style>
