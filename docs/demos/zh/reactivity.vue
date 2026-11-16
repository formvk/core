<script setup lang="ts">
import { autorun, batch, computed, observable } from '@formvk/reactive'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const state = observable({ count: 0, step: 1 })
const doubled = computed(() => state.count * 2)
const log = ref('')

let dispose: (() => void) | undefined

onMounted(() => {
  dispose = autorun(() => {
    log.value = `autorun 触发 → count = ${state.count}, doubled = ${doubled.value}`
  })
})

onBeforeUnmount(() => dispose?.())

function increment() {
  state.count += state.step
}

function addTwice() {
  batch(() => {
    state.count += 1
    state.count += 1
  })
}
</script>

<template>
  <div class="demo">
    <p>
      count: <strong>{{ state.count }}</strong> · step: {{ state.step }} · doubled:
      <strong>{{ doubled }}</strong>
    </p>
    <div class="demo-actions">
      <button class="demo-btn" @click="increment">+{{ state.step }}</button>
      <button class="demo-btn demo-btn--ghost" @click="addTwice">batch +2</button>
      <button class="demo-btn demo-btn--ghost" @click="state.step = state.step === 1 ? 5 : 1">
        step → {{ state.step === 1 ? 5 : 1 }}
      </button>
    </div>
    <div class="demo-result"><pre>{{ log }}</pre></div>
  </div>
</template>
