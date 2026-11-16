<script setup lang="ts">
import { RecursionField, useField, useFieldSchema } from '@formvk/vue'

const field = useField<any>()
const schema = useFieldSchema()
</script>

<template>
  <div>
    <div v-for="(item, index) in field.value" :key="index">
      <RecursionField :schema="schema.items" :name="index" />
      <button @click="field.remove(index)">Remove</button>
    </div>
    <button @click="field.push({})">Add item</button>
  </div>
</template>
