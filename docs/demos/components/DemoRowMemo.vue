<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ seed: string }>()

// 内部状态：只在挂载时读取 seed，之后完全由组件自己持有，不回写表单
const draft = ref(props.seed)

function handleInput(event: Event) {
  draft.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <label class="dv-perf-array__memo">
    <span>内部状态</span>
    <input class="dv-input" :value="draft" :data-memo-seed="props.seed" @input="handleInput" />
  </label>
</template>
