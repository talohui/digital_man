import { useEffect, type ReactNode } from 'react'
import '../../../styles/c-app/mobileConsumeV2Overlays.css'

type CAppBottomSheetProps = {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
  className?: string
  closeLabel?: string
  dialogId?: string
}

function CAppBottomSheet({
  title,
  eyebrow,
  onClose,
  children,
  className = '',
  closeLabel = '合卷',
  dialogId
}: CAppBottomSheetProps) {
  const titleId = dialogId ? `${dialogId}-title` : undefined
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="consume-v2-overlay-layer" role="presentation" onPointerDown={onClose}>
      <section
        id={dialogId}
        className={`consume-v2-overlay ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : title}
        aria-labelledby={titleId}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="consume-v2-overlay__header">
          <span><small>{eyebrow}</small><strong id={titleId}>{title}</strong></span>
          <button type="button" onClick={onClose}>{closeLabel}</button>
        </header>
        {children}
      </section>
    </div>
  )
}

export default CAppBottomSheet
export type { CAppBottomSheetProps }
