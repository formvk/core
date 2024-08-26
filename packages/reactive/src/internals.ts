import { EffectScope, getCurrentScope } from '@vue/reactivity'
import { isFn } from './checkers'
import { MakeObModelSymbol } from './environment'
import type { BoundaryFunction, IVisitor, ReactionScope } from './types'

export const NOOP = () => {}

export const toArray = (value: any) => {
  return Array.isArray(value) ? value : value !== undefined && value !== null ? [value] : []
}

export const createAnnotation = <T extends (visitor: IVisitor) => any>(maker: T) => {
  const annotation = (target: any): ReturnType<T> => {
    return maker({ value: target })
  }
  if (isFn(maker)) {
    annotation[MakeObModelSymbol] = maker
  }
  return annotation
}

export const remove = <T>(arr: T[], el: T) => {
  const i = arr.indexOf(el)
  if (i > -1) {
    arr.splice(i, 1)
  }
}

export const getObservableMaker = (target: any) => {
  if (target[MakeObModelSymbol]) {
    if (!target[MakeObModelSymbol][MakeObModelSymbol]) {
      return target[MakeObModelSymbol]
    }
    return getObservableMaker(target[MakeObModelSymbol])
  }
}

export const createBindFunction = <Boundary extends BoundaryFunction>(boundary: Boundary) => {
  function bind<F extends (...args: any[]) => any>(callback: F, context?: any): F {
    return ((...args: any[]) => boundary(() => callback.apply(context, args))) as any
  }
  return bind
}

export const createBoundaryFunction = (start: (...args: any) => void, end: (...args: any) => void) => {
  function boundary<F extends (...args: any) => any>(fn?: F): ReturnType<F> {
    let results!: ReturnType<F>
    try {
      start()
      if (isFn(fn)) {
        results = fn()
      }
    } finally {
      end()
    }
    return results
  }

  boundary.bound = createBindFunction(boundary)
  return boundary
}

export const createBoundaryAnnotation = (start: (...args: any) => void, end: (...args: any) => void) => {
  const boundary = createBoundaryFunction(start, end)
  const annotation = createAnnotation(({ target, key }) => {
    if (!key) return target
    target[key] = boundary.bound(target[key], target)
    return target
  })
  boundary[MakeObModelSymbol] = annotation
  boundary.bound[MakeObModelSymbol] = annotation
  return boundary
}

export const createReactionScope = (): ReactionScope => {
  const scope = new EffectScope()
  return Object.assign(scope, {
    _memos: {
      queue: [],
      cursor: 0
    },
    _effects: {
      queue: [],
      cursor: 0
    },
    _disposed: false
  })
}

export const getReactionScope = () => {
  return getCurrentScope() as ReactionScope
}
