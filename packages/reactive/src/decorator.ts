type AccessorDecorator = (
  value: ClassAccessorDecoratorTarget<any, any>,
  context: ClassAccessorDecoratorContext
) => ClassAccessorDecoratorResult<any, any>

/** 懒加载哨兵：构造期暂存原始值，字段首次读写时才替换成真正的响应式盒子 */
interface LazySlot {
  raw: unknown
}

/**
 * accessor 装饰器通用工厂：字段值存进 createBox 返回的盒子，读写都经过盒子，
 * 因此重新赋值也能保持响应式（普通 field 装饰器只能改写初始值）。
 * normalize 用于写入前归一化（如把对象包成响应式代理），默认原样透传。
 *
 * 懒加载：构造期只创建轻量哨兵保存初始值，不调用 createBox；
 * 直到该字段第一次被读/写时才真正创建响应式盒子并回写私有槽，之后一直复用。
 *
 * 实现约束：
 * 1. 用 WeakSet 识别哨兵而非 symbol 品牌——盒子可能是 Vue Proxy，属性访问会触发
 *    get trap 并污染依赖收集，WeakSet 按对象 identity 判定，零 trap 副作用；
 * 2. WeakSet 的 key 必须是槽位对象而不能是类实例：实例首次作为 WeakCollection key
 *    会被 V8 附加 identity hash 并触发 map transition，使实例隐藏类失稳、字段访问
 *    内联缓存多态化，实测全激活路径反而慢 4~18 倍；
 * 3. 槽位替换后哨兵失去引用即可被 GC，WeakSet 不造成泄漏。
 *
 * 注意：field 装饰器没有读写拦截点，无法懒加载，仍在构造期即时转换。
 */
export function accessorDecorator(
  createBox: (initialValue: any) => any,
  normalize: (value: any) => any = value => value
): AccessorDecorator {
  // 每个被装饰字段独立一份哨兵集合，随类定义常驻
  const lazySlots = new WeakSet<object>()

  return (target, _context) => ({
    init(initialValue) {
      const slot: LazySlot = { raw: initialValue }
      lazySlots.add(slot)
      return slot
    },
    get(this: any) {
      const slot = target.get.call(this)
      if (lazySlots.has(slot)) {
        const box = createBox(normalize(slot.raw))
        target.set.call(this, box)
        return box.value
      }
      return slot.value
    },
    set(this: any, value: any) {
      const slot = target.get.call(this)
      if (lazySlots.has(slot)) {
        // 初始值从未对外暴露，直接以新值建盒，等价于覆盖初始值
        target.set.call(this, createBox(normalize(value)))
        return
      }
      slot.value = normalize(value)
    },
  })
}
