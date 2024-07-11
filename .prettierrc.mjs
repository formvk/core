/**
 * @type {import('prettier').Options}
 */
export default {
  /**
   * 使用了两个插件，prettier-plugin-organize-imports 和 prettier-plugin-packagejson
   * prettier-plugin-organize-imports 用于排序 import 语句
   * prettier-plugin-packagejson 用于排序 package.json 中的依赖
   */
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-packagejson'],
  /**
   * 打印宽度
   */
  printWidth: 120,
  /**
   * 缩进
   */
  tabWidth: 2,
  /**
   * 使用空格缩进
   */
  useTabs: false,
  /**
   * 行尾分号
   */
  singleQuote: true,
  /**
   * 单引号
   */
  semi: false,
  /**
   * 尾逗号
   */
  trailingComma: 'es5',
  /**
   * 大括号空格
   */
  bracketSpacing: true,
  /**
   * 箭头函数参数括号
   */
  arrowParens: 'avoid',
}
