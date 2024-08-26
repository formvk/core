<script setup lang="ts">
import { Form } from '@formvk/vk-core'
import { provideForm, Field } from '@formvk/vue'
import HelloWorld from './components/HelloWorld.vue'

const form = new Form()
console.log(form)
provideForm(form)

const decorator = [HelloWorld, { msg: 'Hello World' }]
</script>

<template>
  <div>
    <Field name="name" :decorator="decorator"> </Field>
  </div>
</template>

<style scoped></style>
