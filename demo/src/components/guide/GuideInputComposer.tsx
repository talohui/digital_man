import { type FormEvent } from 'react'

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
      <button type="button" disabled aria-label="语音输入暂未接入" title="语音输入建设中">◎</button>
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
