import './demo.css'
import ArrayItems from './ArrayItems.vue'
import Checkbox from './Checkbox.vue'
import FormItem from './FormItem.vue'
import Input from './Input.vue'
import PerfRows from './PerfRows.vue'
import Select from './Select.vue'
import Textarea from './Textarea.vue'

/**
 * 扁平 name → component 映射：
 * 传给 createSchemaOptions 推断 fragment 类型，未声明分类的组件默认按 field 处理；
 * ArrayItems 属于数组组件，FormItem 属于无值组件（decorator），
 * 分别通过工厂的 arrayComponents / voidComponents 组件 map 单独归类并自动合并进运行时映射。
 */
export const components = {
  Input,
  NumberInput: Input,
  Select,
  Checkbox,
  Textarea,
}

export { ArrayItems, Checkbox, Input, PerfRows, Select, Textarea, FormItem }
