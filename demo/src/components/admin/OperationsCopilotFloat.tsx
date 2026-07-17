import { CloseOutlined, RobotOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import OperationsCopilotChat from './OperationsCopilotChat'

export default function OperationsCopilotFloat() {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key === 'Tab' && drawerRef.current?.contains(document.activeElement)) {
        const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        )).filter((element) => element.offsetParent !== null)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [open])

  return (
    <>
      {open ? <button type="button" className="operations-copilot-float__backdrop" onClick={() => setOpen(false)} aria-label="点击背景关闭运营 Copilot" /> : null}
      <aside
        ref={drawerRef}
        className={`operations-copilot-float__drawer${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="运营 Copilot 全局对话"
        aria-hidden={!open}
        inert={open ? undefined : ''}
      >
        <header className="operations-copilot-float__header">
          <span className="operations-copilot-float__seal"><RobotOutlined /></span>
          <div>
            <small>全局运营智能助手</small>
            <strong>运营 Copilot</strong>
          </div>
          <span className="operations-copilot-float__online"><i />全局数据在线</span>
          <button ref={closeButtonRef} type="button" className="operations-copilot-float__close" onClick={() => setOpen(false)} aria-label="关闭运营 Copilot"><CloseOutlined /></button>
        </header>
        <OperationsCopilotChat />
      </aside>

      <button
        ref={triggerRef}
        type="button"
        className={`operations-copilot-float__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        tabIndex={open ? -1 : 0}
        aria-label={open ? '收起运营 Copilot' : '打开运营 Copilot'}
      >
        <span className="operations-copilot-float__trigger-icon"><RobotOutlined /><i /></span>
        <span><strong>运营 Copilot</strong><small>问全局 · 发应急</small></span>
      </button>
    </>
  )
}
