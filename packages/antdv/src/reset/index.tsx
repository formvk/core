import { observer } from '@formvk/reactive-vue'
import { useParentForm } from '@formvk/vue'
import { Button } from 'ant-design-vue'
import { defineComponent } from 'vue'

export const Reset = observer(
  defineComponent({
    name: 'Reset',
    props: {
      forceClear: {
        type: Boolean,
        default: false,
      },
      validate: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['resetValidateSuccess', 'resetValidateFailed'],
    setup(props, { attrs, slots, emit }) {
      const formRef = useParentForm()
      return () => {
        const form = formRef?.value
        return (
          <Button
            {...attrs}
            onClick={async e => {
              const result = await (attrs as any).onClick?.(e)
              if (result === false) return
              form
                ?.reset('*', {
                  forceClear: props.forceClear,
                  validate: props.validate,
                })
                .then(e => emit('resetValidateSuccess', e))
                .then(e => emit('resetValidateFailed', e))
            }}
          >
            {slots.default?.()}
          </Button>
        )
      }
    },
  })
)

export default Reset
