import type { IGridOptions } from '@formvk/grid'
import { Grid } from '@formvk/grid'
import { markRaw } from '@formvk/reactive'
import { observer } from '@formvk/reactive-vue'
import type { InjectionKey, PropType, Ref } from 'vue'
import { computed, defineComponent, inject, onMounted, provide, ref, watchEffect } from 'vue'
import { usePrefixCls } from '../__builtins__'
import { useFormLayout } from '../form-layout'
import useStyle from './style'

export interface IFormGridProps extends IGridOptions {
  grid?: Grid<HTMLElement>
  prefixCls?: string
  className?: string
}

const FormGridSymbol: InjectionKey<Ref<Grid<HTMLElement>>> = Symbol('FormGridContext')

export const createFormGrid = (props: IFormGridProps): Grid<HTMLElement> => {
  return markRaw(new Grid(props))
}

export const useFormGrid = (): Ref<Grid<HTMLElement>> => inject(FormGridSymbol)

const FormGridInner = observer(
  defineComponent({
    name: 'FormGrid',
    props: {
      columnGap: {
        type: Number,
      },
      rowGap: {
        type: Number,
      },
      minColumns: {
        type: [Number, Array],
      },
      minWidth: {
        type: [Number, Array],
      },
      maxColumns: {
        type: [Number, Array],
      },
      maxWidth: {
        type: [Number, Array],
      },
      breakpoints: {
        type: Array,
      },
      colWrap: {
        type: Boolean,
        default: true,
      },
      strictAutoFit: {
        type: Boolean,
        default: false,
      },
      shouldVisible: {
        type: Function as PropType<IGridOptions['shouldVisible']>,
        default() {
          return () => true
        },
      },
      grid: {
        type: Object as PropType<Grid<HTMLElement>>,
      },
    },
    setup(props, { slots }) {
      const layout = useFormLayout()

      const gridInstance = computed(() => {
        const newProps: IFormGridProps = {}
        Object.keys(props).forEach(key => {
          if (typeof props[key] !== 'undefined') {
            newProps[key] = props[key]
          }
        })
        const options: any = {
          columnGap: layout.value?.gridColumnGap ?? 8,
          rowGap: layout.value?.gridRowGap ?? 4,
          ...newProps,
        }
        return markRaw(options?.grid ? options.grid : new Grid(options))
      })
      const prefixCls = usePrefixCls('formily-form-grid')
      const [wrapSSR, hashId] = useStyle(prefixCls)
      const rootRef = ref(null)

      provide(FormGridSymbol, gridInstance)

      onMounted(() => {
        watchEffect(onInvalidate => {
          const dispose = gridInstance.value.connect(rootRef.value)
          onInvalidate(() => {
            dispose()
          })
        })
      })

      return () => {
        return wrapSSR(
          <div
            ref={rootRef}
            class={[prefixCls, hashId.value]}
            style={{
              gridTemplateColumns: gridInstance.value.templateColumns,
              gap: gridInstance.value.gap,
            }}
          >
            {slots.default?.()}
          </div>
        )
      }
    },
  })
)

const FormGridColumn = observer(
  defineComponent({
    name: 'FormGridColumn',
    props: {
      gridSpan: {
        type: Number,
        default: 1,
      },
    },
    setup(props, { slots }) {
      return () => {
        return <div data-grid-span={props.gridSpan}>{slots.default?.()}</div>
      }
    },
  })
)

export const FormGrid = Object.assign(FormGridInner, {
  GridColumn: FormGridColumn,
  useFormGrid,
  createFormGrid,
})

export default FormGrid
