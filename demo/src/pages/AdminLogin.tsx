import { useState, type FormEvent } from 'react'
import { adminLogin } from '../lib/adminAuth'

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (adminLogin(user.trim(), pwd)) {
      onSuccess()
    } else {
      setErr('账号或密码错误，请重试')
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <div className="admin-login__logo">灵</div>
        <h1 className="admin-login__title">灵山胜境 · 智慧运营中心</h1>
        <p className="admin-login__sub">灵山智慧导览运营中心 · 仅限授权人员</p>

        <input
          className="admin-login__input"
          placeholder="账号"
          value={user}
          onChange={(e) => {
            setUser(e.target.value)
            setErr('')
          }}
          autoFocus
        />
        <input
          className="admin-login__input"
          type="password"
          placeholder="密码"
          value={pwd}
          onChange={(e) => {
            setPwd(e.target.value)
            setErr('')
          }}
        />

        {err ? <p className="admin-login__err">{err}</p> : null}

        <button className="admin-login__btn" type="submit">
          登 录
        </button>
        <p className="admin-login__hint">演示账号 admin / lingshan2026</p>
      </form>
    </div>
  )
}
