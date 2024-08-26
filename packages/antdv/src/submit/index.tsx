import type { IFormFeedback } from '@formvk/core'
import { useParentForm } from '@formvk/vue'
import type { ButtonProps } from 'ant-design-vue'
import { Button } from 'ant-design-vue'
import { defineComponent } from 'vue'

export interface ISubmitProps extends ButtonProps {
  onClick?: (e: MouseEvent) => any
  onSubmit?: (values: any) => any
  onSubmitSuccess?: (payload: any) => void
  onSubmitFailed?: (feedbacks: IFormFeedback[]) => void
}

export const Submit = defineComponent(
  (props: Partial<ISubmitProps>, { slots }) => {
    const formRef = useParentForm()

    return () => {
      const { onClick, onSubmit, onSubmitSuccess, onSubmitFailed } = props

      const form = formRef?.value

      const onSubmitHandel = (e: any) => {
        if (onClick) {
          onClick(e)
        }
        if (formRef?.value) {
          form?.submit(onSubmit).then(onSubmitSuccess).catch(onSubmitFailed)
        }
      }

      const loading = props.loading !== undefined ? props.loading : form?.submitting
      return (
        <Button nativeType="submit" type="primary" loading={loading} onClick={onSubmitHandel} v-slots={slots}></Button>
      )
    }
  },
  {
    props: ['onSubmit', 'onSubmitSuccess', 'onSubmitFailed', 'onClick'],
  }
)

export default Submit
