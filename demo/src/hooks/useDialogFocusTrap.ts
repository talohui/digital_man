import { useEffect, useRef } from 'react'

/**
 * 通用对话框焦点管理 hook:
 *   - 打开时自动 focus 第一个 focusable(或指定元素)
 *   - Esc 关闭
 *   - Tab/Shift+Tab 限制焦点在浮层内
 *
 * 用法:
 *   const dialogRef = useRef<HTMLDivElement | null>(null)
 *   useDialogFocusTrap({ open: showRoutes, ref: dialogRef, onClose: () => setShowRoutes(false) })
 */
export interface UseDialogFocusTrapOptions {
  open: boolean
  ref: React.RefObject<HTMLElement | null>
  onClose: () => void
  /** 指定打开时自动 focus 的元素 ref(不指定则取第一个 focusable) */
  initialFocusRef?: React.RefObject<HTMLElement | null>
}

export function useDialogFocusTrap({
  open,
  ref,
  onClose,
  initialFocusRef
}: UseDialogFocusTrapOptions): void {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null

    const focusFirst = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
        return
      }
      const dialog = ref.current
      if (!dialog) return
      const first = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    }
    focusFirst()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = ref.current
      if (!dialog) return
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      // 关闭后把焦点还给打开前的元素(若仍存在)
      const prev = previouslyFocused.current
      if (prev && document.contains(prev)) {
        try { prev.focus() } catch { /* noop */ }
      }
    }
  }, [open, ref, onClose, initialFocusRef])
}
