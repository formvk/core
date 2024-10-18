/**
 * copy from https://github.com/vuejs/core/blob/main/packages/runtime-core/src/index.ts
 * Vue 3 core runtime
 * support @vue/reactivity umd build, in vue sense it's will be from 'Vue'
 */
export {
  EffectScope,
  ReactiveEffect,
  computed,
  // advanced
  customRef,
  // effect
  effect,
  // effect scope
  effectScope,
  getCurrentScope,
  getCurrentWatcher,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  isShallow,
  markRaw,
  onScopeDispose,
  onWatcherCleanup,
  proxyRefs,
  // core
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  stop,
  toRaw,
  toRef,
  toRefs,
  toValue,
  triggerRef,
  // utilities
  unref,
} from '@vue/reactivity'
