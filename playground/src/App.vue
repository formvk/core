<script setup lang="ts">
import { Form } from '@formvk/vk-core'
import { provideForm, Field } from '@formvk/vue'

const form = new Form()
console.log(form)
provideForm(form)
console.log(form, Field)
</script>

<template>
  <div></div>
</template>

<style scoped></style>
