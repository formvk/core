import DemoArrayItems from './DemoArrayItems.vue'
import DemoCheckbox from './DemoCheckbox.vue'
import DemoInput from './DemoInput.vue'
import DemoSelect from './DemoSelect.vue'
import DemoTextarea from './DemoTextarea.vue'

/**
 * 扁平 name → component 映射：
 * 传给 createSchemaField 推断 fragment 类型，未声明分类的组件默认按 field 处理；
 * ArrayItems 属于数组组件，通过工厂的 arrayComponents 组件 map 单独归类并自动合并进运行时映射。
 */
export const demoComponents = {
  Input: DemoInput,
  NumberInput: DemoInput,
  Select: DemoSelect,
  Checkbox: DemoCheckbox,
  Textarea: DemoTextarea,
}

export { DemoArrayItems, DemoCheckbox, DemoInput, DemoSelect, DemoTextarea }
