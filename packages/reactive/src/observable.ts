import * as annotations from './annotations'

export const observable = Object.assign(annotations.observable, {
  box: annotations.box,
  ref: annotations.ref,
  deep: annotations.observable,
  shallow: annotations.shallow,
  computed: annotations.computed
})
