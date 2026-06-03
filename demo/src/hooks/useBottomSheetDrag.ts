import { useRef, type Dispatch, type SetStateAction, type TouchEventHandler } from 'react'

/**
 * 通用底部 sheet 拖拽 hook(三档/N 档自定义)。
 *
 * 抽离自 MobileMapPage:让 sheet 跟手,松手按速度阈值跨档或就近吸附。
 * 调用方提供:
 *   - sheetRef:挂在 <section> 上的 ref
 *   - snapsOf:根据视口宽高返回各档高度(px)
 *   - state / setState:外部控制的状态机
 *   - opts.dragSelector:只在指定 selector 命中的子元素上才发起拖拽(避免影响内滚动)
 *   - opts.velocityThreshold:px/ms,正=向上;默认 0.55
 *   - opts.overshoot:松手前允许超出最大档多少 px(rubber band 观感),默认 60
 */
export interface UseBottomSheetDragOptions<S extends string> {
  sheetRef: React.RefObject<HTMLElement | null>
  snapsOf: () => Record<S, number>
  state: S
  setState: Dispatch<SetStateAction<S>>
  /** 状态前后顺序,按从小到大(高度由低到高)给出 */
  order: S[]
  dragSelector: string
  velocityThreshold?: number
  overshoot?: number
}

export interface BottomSheetDragApi {
  /** 拖拽中 = true,用于外部加 is-dragging 标记关动画 */
  isDragging: () => boolean
  onTouchStart: TouchEventHandler<HTMLElement>
  onTouchMove: TouchEventHandler<HTMLElement>
  onTouchEnd: () => void
}

export function useBottomSheetDrag<S extends string>(
  opts: UseBottomSheetDragOptions<S>
): BottomSheetDragApi {
  const {
    sheetRef,
    snapsOf,
    state,
    setState,
    order,
    dragSelector,
    velocityThreshold = 0.55,
    overshoot = 60
  } = opts

  // dragRef 全部走 ref,不触发任何 React 渲染。
  // touchmove 直接改 DOM style.height,touchend 才 setState。
  // 收益:低端 Android 拖拽从 ~30fps 提到 60fps。
  const dragRef = useRef<{
    startY: number
    startHeight: number
    lastY: number
    lastT: number
    velocity: number
    lastHeight: number
  } | null>(null)

  const indexOf = (s: S) => order.indexOf(s)
  const up = (curr: S): S =>
    order[Math.min(order.length - 1, indexOf(curr) + 1)] ?? curr
  const down = (curr: S): S => order[Math.max(0, indexOf(curr) - 1)] ?? curr

  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    const target = event.target as HTMLElement
    if (!target.closest(dragSelector)) return
    const sheet = sheetRef.current
    if (!sheet) return
    const rect = sheet.getBoundingClientRect()
    const y = event.touches[0].clientY
    dragRef.current = {
      startY: y,
      startHeight: rect.height,
      lastY: y,
      lastT: performance.now(),
      velocity: 0,
      lastHeight: rect.height
    }
    // 拖拽期间停掉 CSS height 过渡,跟手即时
    sheet.style.transition = 'none'
    void state // 闭包稳定占位
  }

  const onTouchMove: TouchEventHandler<HTMLElement> = (event) => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    if (!drag || !sheet) return
    const y = event.touches[0].clientY
    const delta = drag.startY - y
    const now = performance.now()
    const dt = Math.max(1, now - drag.lastT)
    drag.velocity = (drag.lastY - y) / dt
    drag.lastY = y
    drag.lastT = now
    const snaps = snapsOf()
    const max = Math.max(...(Object.values(snaps) as number[])) + overshoot
    const newHeight = Math.max(80, Math.min(max, drag.startHeight + delta))
    drag.lastHeight = newHeight
    // 直接 DOM 写入,不走 React
    sheet.style.height = `${newHeight}px`
  }

  const onTouchEnd = () => {
    const drag = dragRef.current
    const sheet = sheetRef.current
    if (!drag || !sheet) return
    const finalHeight = drag.lastHeight
    const velocity = drag.velocity
    dragRef.current = null

    // 清掉 inline,让 CSS class 接管(带过渡的吸附动画)
    sheet.style.height = ''
    sheet.style.transition = ''

    if (velocity > velocityThreshold) {
      setState((curr) => up(curr))
      return
    }
    if (velocity < -velocityThreshold) {
      setState((curr) => down(curr))
      return
    }
    const snaps = snapsOf()
    let best = order[0]
    let bestDist = Infinity
    for (const k of order) {
      const d = Math.abs(snaps[k] - finalHeight)
      if (d < bestDist) {
        best = k
        bestDist = d
      }
    }
    setState(best)
  }

  return {
    isDragging: () => dragRef.current !== null,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
