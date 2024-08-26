import type { GenerateStyle } from '../../__builtins__'
import { genStyleHook } from '../../__builtins__'
import { getAnimationStyle } from './animation'
import { getGridStyle } from './grid'
import { genOtherStyle } from './other'

const genSmallStyle: GenerateStyle = token => {
  const { componentCls, controlHeightSM, fontSizeSM, lineHeightSM } = token
  return {
    fontSize: fontSizeSM,
    [`${componentCls}-label`]: {
      height: controlHeightSM,
      lineHeight: lineHeightSM,

      label: {
        fontSize: fontSizeSM,
      },
    },

    [`${componentCls}-control-content`]: {
      minHeight: controlHeightSM,
      '&-component': {
        minHeight: controlHeightSM,
      },
    },
  }
}

const genLargeStyle: GenerateStyle = token => {
  const { componentCls, fontSizeLG, controlHeightLG, lineHeightLG } = token
  return {
    fontSize: fontSizeLG,
    [`${componentCls}-label`]: {
      height: controlHeightLG,
      lineHeight: lineHeightLG,

      label: {
        fontSize: fontSizeLG,
      },
    },

    [`${componentCls}-control-content`]: {
      minHeight: controlHeightLG,
      '&-component': {
        minHeight: controlHeightLG,
      },
    },
  }
}

const genLabelStyle: GenerateStyle = token => {
  const { controlHeight } = token
  return {
    height: controlHeight,
    verticalAlign: 'middle',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    color: token.colorTextHeading,

    label: {
      cursor: 'text',
    },

    '&-content': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      label: {
        whiteSpace: 'nowrap',
      },
    },

    '&-tooltip': {
      cursor: 'help',
      '*': {
        cursor: 'help',
      },
      label: {
        borderBottom: '1px dashed currentColor',
      },
    },
  }
}

const genFormItemStyle: GenerateStyle = token => {
  const { componentCls, fontSize, marginLG } = token
  return {
    [componentCls]: {
      display: 'flex',
      position: 'relative',
      marginBottom: marginLG,
      fontSize: fontSize,

      [`${componentCls}-label`]: genLabelStyle(token),

      [`&${componentCls}-size-small`]: genSmallStyle(token),

      [`&${componentCls}-size-large`]: genLargeStyle(token),

      '&-label': {
        '&-align': {
          [`&-left`]: {
            [`> ${componentCls}-label`]: {
              justifyContent: 'flex-start',
            },
          },

          [`&-right`]: {
            [`> ${componentCls}-label`]: {
              justifyContent: 'flex-end',
            },
          },
        },
        ['&-wrap']: {
          [`${componentCls}-label`]: {
            label: {
              whiteSpace: 'pre-line',
              wordBreak: 'break-all',
            },
          },
        },
      },
    },
  }
}

export default genStyleHook('Form', token => {
  return [genFormItemStyle(token), getAnimationStyle(token), genOtherStyle(token), getGridStyle(token)]
})
