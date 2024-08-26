import { UploadOutlined } from '@ant-design/icons-vue'
import { connect, mapProps } from '@formvk/vue'
import type { UploadFile, UploadProps } from 'ant-design-vue'
import { Upload as AntdUpload, Button } from 'ant-design-vue'
import { defineComponent } from 'vue'

export type IUploadOnchange = (fileList: UploadFile[]) => void

export type IUploadProps = Omit<UploadProps, 'onChange'> & {
  textContent?: string
  onChange?: IUploadOnchange
}

export type IDraggerUploadProps = Omit<UploadProps, 'onChange'> & {
  onChange?: IUploadOnchange
}

const UploadWrapper = defineComponent({
  name: 'UploadWrapper',
  props: ['textContent', 'onChange'],
  emits: ['change'],
  setup(props, { attrs, emit }) {
    return () => {
      return (
        <AntdUpload
          {...attrs}
          onChange={({ fileList }) => {
            // eslint-disable-next-line @typescript-eslint/no-extra-semi
            ;(attrs.onChange as IUploadOnchange)?.(fileList)
            emit('change', fileList)
          }}
        >
          <Button>
            <UploadOutlined />
            {props.textContent || '上传'}
          </Button>
        </AntdUpload>
      )
    }
  },
})

const UploadDraggerWrapper = defineComponent<IUploadProps>({
  name: 'UploadDraggerWrapper',
  emits: ['change'],
  setup(props, { slots, attrs, emit }) {
    return () => {
      return (
        <div>
          <AntdUpload.Dragger
            {...attrs}
            onChange={({ fileList }) => {
              // eslint-disable-next-line @typescript-eslint/no-extra-semi
              ;(attrs.onChange as IUploadOnchange)?.(fileList)
              emit('change', fileList)
            }}
          >
            {slots.default?.()}
          </AntdUpload.Dragger>
        </div>
      )
    }
  },
})

const _Upload = connect(
  UploadWrapper,
  mapProps({
    value: 'fileList',
    onInput: 'onChange',
  })
)

const UploadDragger = connect(
  UploadDraggerWrapper,
  mapProps({
    value: 'fileList',
    onInput: 'onChange',
  })
)

export const Upload = Object.assign(_Upload, {
  Dragger: UploadDragger,
})

export default Upload
