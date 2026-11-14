<script setup lang="ts">
import { createElement, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

/**
 * VitePress 主题是 Vue 应用，React demo 通过本桥接组件挂载：
 * - onMounted 时创建 React root 并渲染传入的 TSX 组件
 * - component / componentProps 引用变化时重新渲染
 * - 卸载时 unmount，避免 HMR 与路由切换后残留 React 树
 */
const props = defineProps<{
  component: ComponentType<Record<string, unknown>>
  componentProps?: Record<string, unknown>
}>()

const host = ref<HTMLDivElement>()
const root = shallowRef<Root>()

function renderReact() {
  root.value?.render(createElement(props.component, props.componentProps))
}

onMounted(() => {
  if (!host.value) return
  root.value = createRoot(host.value)
  renderReact()
})

watch(() => [props.component, props.componentProps], renderReact)

onBeforeUnmount(() => {
  root.value?.unmount()
})
</script>

<template>
  <div ref="host" class="react-demo-host" />
</template>
