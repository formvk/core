<script setup lang="ts">
const modelRef = defineModel<string>()
</script>

<template>
  <input v-model="modelRef" />
</template>
