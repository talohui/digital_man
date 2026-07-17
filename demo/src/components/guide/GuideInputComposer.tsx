import { type FormEvent } from 'react'

import { GuideVoiceButton } from './GuideVoiceButton'

export function GuideInputComposer({
  value,
  onChange,
  onSubmit
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="guide-input-composer" onSubmit={handleSubmit}>
      <GuideVoiceButton
        className="guide-input-composer__voice"
        onTranscript={onChange}
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="问小灵路线、景点或服务"
        aria-label="输入问题"
      />
      <button type="submit" aria-label="发送">↑</button>
    </form>
  )
}
