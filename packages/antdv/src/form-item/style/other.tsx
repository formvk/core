import type { CSSProperties } from 'vue'
import type { GenerateStyle } from '../../__builtins__'

export const genOtherStyle: GenerateStyle = token => {
  const {
    componentCls,
    colorError,
    colorWarningBg,
    colorWarning,
    colorBorder,
    colorSuccess,
    lineWidth,
    colorPrimaryBorderHover,
    colorPrimary,
    antCls,
    fontSize,
    marginSM,
    marginLG,
    controlHeight,
    controlHeightLG,
    controlHeightSM,
    lineHeight,
    controlOutlineWidth,
    controlOutline,
    colorPrimaryHover,
    colorTextSecondary,
    paddingXS,
    borderRadius,
  } = token

  const hover = (color = colorPrimaryBorderHover): CSSProperties => ({
    borderColor: color,
    borderInlineEndWidth: lineWidth,
  })

  const active = (color = colorPrimary): CSSProperties => ({
    borderColor: color,
    borderInlineEndWidth: lineWidth,
    outline: 0,
    boxShadow: `${controlOutlineWidth} 0 ${controlOutline} ${colorPrimaryHover}`,
  })

  return {
    [componentCls]: {
      '&-layout-vertical': {
        display: 'block',

        // Vertical Label: https://github.com/ant-design/ant-design/blob/master/components/form/style/index.ts#L391C1-L404C4
        [`${componentCls}-label`]: {
          minHeight: lineHeight * fontSize + paddingXS,
          lineHeight,
          padding: `0 0 ${paddingXS}px`,

          '&-content': {
            whiteSpace: 'initial',
            textAlign: 'start',
          },
        },

        [`${antCls}-label`]: {
          minHeight: controlHeight - 10,
          lineHeight,
        },
      },

      '&-success': {
        [`${antCls}-select-selector,
          ${antCls}-cascader-picker,
          ${antCls}-picker,
          ${antCls}-input,
          ${antCls}-input-number,
          ${antCls}-input-affix-wrapper,
          ${antCls}-input-affix-wrapper,
          ${antCls}-input`]: {
          borderColor: `${colorSuccess} !important`,
        },
        [`${antCls}-select-selector,
        ${antCls}-cascader-picker,
        ${antCls}-picker,
        ${antCls}-input,
        ${antCls}-input-number,
        ${antCls}-input-affix-wrapper,
        ${antCls}-input-affix-wrapper:hover,
        ${antCls}-input:hover`]: {
          borderColor: `${colorSuccess} !important`,
        },
        [`${antCls}-input-affix-wrapper-focused,
        ${antCls}-input-affix-wrapper:focus,
        ${antCls}-input-focused,
        ${antCls}-input:focus`]: {
          borderColor: `${colorSuccess} !important`,
          borderInlineEndWidth: '1px !important',
          outline: 0,
        },
      },

      '&-warning': {
        [`${antCls}-select-selector,
          ${antCls}-cascader-picker,
          ${antCls}-picker,
          ${antCls}-input,
          ${antCls}-input-number,
          ${antCls}-input-affix-wrapper,
          ${antCls}-input-affix-wrapper,
          ${antCls}-input`]: {
          borderColor: colorSuccess,
        },

        [`${antCls}-select-selector,
          ${antCls}-cascader-picker,
          ${antCls}-picker,
          ${antCls}-input,
          ${antCls}-input-number,
          ${antCls}-input-affix-wrapper,
          ${antCls}-input-affix-wrapper:hover,
          ${antCls}-input:hover`]: {
          borderColor: colorSuccess,
        },

        [`${antCls}-select:not(${antCls}-select-disabled):not(${antCls}-select-customize-input)`]: {
          [`${antCls}-select-selector`]: {
            backgroundColor: colorWarningBg,
            borderColor: colorSuccess,
          },

          [`&${antCls}-select-open ${antCls}-select-selector,
              &${antCls}-select-focused ${antCls}-select-selector`]: {
            ...active(colorWarning),
          },
        },

        [`${antCls}-input-number,
          ${antCls}-picker`]: {
          backgroundColor: colorWarningBg,
          borderColor: colorWarning,

          [`&-focused,
            &:focus`]: {
            ...active(colorWarning),
          },

          '&:not([disabled]):hover': {
            backgroundColor: colorWarningBg,
            borderColor: colorWarning,
          },
        },

        [`${antCls}-cascader-picker:focus ${antCls}-cascader-input`]: {
          backgroundColor: colorWarningBg,
          ...active(colorWarning),
        },

        [`${antCls}-input-affix-wrapper-focused,
          ${antCls}-input-affix-wrapper:focus,
          ${antCls}-input-focused,
          ${antCls}-input:focus`]: {
          ...active(colorWarning),
        },
      },

      '&-error': {
        [`${antCls}-select-selector,
            ${antCls}-cascader-picker,
            ${antCls}-picker,
            ${antCls}-input,
            ${antCls}-input-number,
            ${antCls}-input-affix-wrapper,
            ${antCls}-input`]: {
          borderColor: `${colorError} !important`,
        },

        [`${antCls}-select-selector,
            ${antCls}-cascader-picker,
            ${antCls}-picker,
            ${antCls}-input,
            ${antCls}-input-number,
            ${antCls}-input-affix-wrapper,
            ${antCls}-input-affix-wrapper:hover,
            ${antCls}-input:hover`]: {
          borderColor: `${colorError}  !important`,
        },

        [`${antCls}-select:not(${antCls}-select-disabled):not(${antCls}-select-customize-input)`]: {
          [`${antCls}-select-selector`]: {
            borderColor: `${colorError}  !important`,
          },

          [`&${antCls}-select-open ${antCls}-select-selector,
                &${antCls}-select-focused ${antCls}-select-selector`]: {
            ...active(colorError),
          },
        },

        [`${antCls}-input-number,
            ${antCls}-picker`]: {
          borderColor: colorError,

          [`&-focused,
            &:focus`]: {
            ...active(colorError),
          },

          [`&:not([disabled]):hover`]: {
            borderColor: colorError,
          },
        },

        [`${antCls}-cascader-picker:focus ${antCls}-cascader-input`]: {
          ...active(colorError),
        },

        [`${antCls}-input-affix-wrapper-focused,
            ${antCls}-input-affix-wrapper:focus,
            ${antCls}-input-focused,
            ${antCls}-input:focus`]: {
          ...active(colorError),
        },
      },

      '&-feedback-layout': {
        '&-terse': {
          marginBottom: marginSM,
          [`${componentCls}-help,
            ${componentCls}-extra `]: {
            minHeight: controlHeightSM,
          },
        },

        '&-loose': {
          marginBottom: marginLG,

          [`${componentCls}-help,
            ${componentCls}-extra `]: {
            minHeight: controlHeightLG,
          },
        },

        '&-none': {
          marginBottom: 0,
        },

        '&-terse, &-loose, &-none': {
          [`&${componentCls}-feedback-has-text:not(${componentCls}-inset)`]: {
            marginBottom: 0,
          },
        },
      },

      '&-control-wrap': {
        [`${componentCls}-control`]: {
          whiteSpace: 'pre-line',
          wordBreak: 'break-all',
        },
      },

      '&-control-align': {
        '&-left': {
          [`${componentCls}-control-content`]: {
            justifyContent: 'flex-start',
          },
        },

        '&-right': {
          [`${componentCls}-control-content`]: {
            justifyContent: 'flex-end',
          },
        },
      },

      "input[type='radio'], input[type='checkbox']": {
        width: fontSize,
        height: fontSize,
      },

      '&-feedback-layout-popover': {
        marginBottom: 8,
      },

      '&-fullness': {
        [`> ${componentCls}-control`]: {
          [`> ${componentCls}-control-content`]: {
            [`> ${componentCls}-control-content-component`]: {
              [`> *:first-child:not(${antCls}-switch)`]: {
                width: '100%',
              },
            },
          },
        },
      },

      '&-inset': {
        borderRadius,
        border: `1px solid ${colorBorder}`,
        paddingInlineStart: 12,
        transition: '0.3s all',

        '&:hover': {
          ...hover(),
        },
      },

      '&-active': {
        [`${componentCls}-control-content-component-has-feedback-icon`]: {
          ...active(),
        },

        [`${antCls}-input-number,
          ${antCls}-picker,
          ${antCls}-cascader-picker:focus ${antCls}-cascader-input,
          ${antCls}-select:not(${antCls}-select-customize-input)
          ${antCls}-select-selector,
          ${antCls}-input`]: {
          ...active(),
        },
      },

      '&-inset-active': {
        ...active(),
      },

      '&:hover': {
        [`${componentCls}-control-content-component-has-feedback-icon`]: {
          ...hover(),
        },
      },

      [`textarea${antCls}-input`]: {
        height: 'auto',
      },

      [`${componentCls}-label-tooltip-icon`]: {
        marginInlineStart: 4,

        color: token.colorTextSecondary,
        display: 'flex',
        alignItems: 'center',
        maxHeight: controlHeight,

        span: {
          display: 'inline-block',
        },
      },

      [`${componentCls}-asterisk`]: {
        color: colorError,
        marginInlineEnd: '4px',
        display: 'inline-block',
        fontFamily: 'SimSun, sans-serif',
      },

      [`${componentCls}-colon`]: {
        marginInlineStart: 2,
        marginInlineEnd: 8,
      },

      [`${componentCls}-control`]: {
        flex: 1,
        maxWidth: '100%',

        '&-content': {
          display: 'flex',
          minHeight: controlHeight,

          '&-component': {
            width: '100%',
            display: 'flex',
            alignItems: 'center',

            [`&-has-feedback-icon`]: {
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            },
          },

          [`${componentCls}-addon-before `]: {
            marginInlineEnd: 8,
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: controlHeight,
            flexShrink: 0,
          },

          [`${componentCls}-addon-after`]: {
            marginInlineStart: 8,
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: controlHeight,
            flexShrink: 0,
          },
        },
      },
      [`${componentCls}-help,
        ${componentCls}-extra `]: {
        minHeight: controlHeightSM,
        color: colorTextSecondary,
        lineHeight: 1.5,
      },

      [`${componentCls}-control-content-component-has-feedback-icon`]: {
        borderRadius,
        border: `1px solid ${colorBorder}`,
        paddingInlineEnd: 8,
        transition: 'all 0.3s',
        touchAction: 'manipulation',
        outline: 'none',
      },

      [`${componentCls}-error-help`]: {
        color: `${colorError}  !important`,
      },

      [`${componentCls}-warning-help`]: {
        color: colorSuccess,
      },

      [`${componentCls}-success-help`]: {
        color: `${colorSuccess} !important`,
      },

      [`${antCls}-upload`]: {
        background: 'transparent',
      },

      [`${antCls}-upload${antCls}-upload-drag`]: {
        background: token.colorBgBase,
      },

      [`${antCls}-radio-inline, ${antCls}-checkbox-inline`]: {
        display: 'inline-block',
        marginInlineStart: marginSM,
        fontWeight: 'normal',
        verticalAlign: 'middle',
        cursor: 'pointer',

        '&:first-child': {
          marginInlineStart: 0,
        },
      },

      [`${antCls}-radio-vertical,
          ${antCls}-checkbox-vertical`]: {
        display: 'block',
      },

      [`${antCls}-checkbox-vertical + ${antCls}-checkbox-vertical,
          ${antCls}-radio-vertical + ${antCls}-radio-vertical`]: {
        marginInlineStart: 0,
      },

      [`${antCls}-input-number`]: {
        width: '100%',
        verticalAlign: 'top',

        [`+ ${antCls}-form-text`]: {
          marginInlineStart: marginSM,
        },

        '&-handler-wrap': {
          zIndex: 2,
        },
      },
      [`${antCls}-select,
          ${antCls}-cascader-picker,
          ${antCls}-picker`]: {
        width: '100%',
      },

      [`${antCls}-input-group ${antCls}-select,
          ${antCls}-input-group ${antCls}-cascader-picker`]: {
        width: 'auto',
      },
    },
    [`${componentCls}-help`]: {
      display: 'flex',
      alignItems: 'center',
      clear: 'both',
      transition: 'color 0.3s cubic-bezier(0.215, 0.61, 0.355, 1)',
      paddingTop: 0,
      lineHeight: 1.5,

      '.anticon': {
        display: 'flex',
        alignItems: 'center',
        justifyItems: 'center',
        marginRight: 4,
      },
    },
    [`${componentCls}-error-help`]: {
      color: `${colorError}  !important`,
    },

    [`${componentCls}-warning-help`]: {
      color: colorSuccess,
    },

    [`${componentCls}-success-help`]: {
      color: `${colorSuccess} !important`,
    },
  }
}
