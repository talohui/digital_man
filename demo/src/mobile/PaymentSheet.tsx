import { useState } from 'react'

type Method = 'wechat' | 'alipay'
type Stage = 'select' | 'password' | 'paying' | 'success'

type Props = {
  amount: number
  onClose: () => void
  onPaid: (method: Method) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

// 一比一模拟微信/支付宝收银台:选支付方式 → 输入 6 位支付密码(自带数字键盘)
// → 支付中 → 支付成功。演示环境,随意 6 位数字均通过,不产生真实交易。
export default function PaymentSheet({ amount, onClose, onPaid }: Props) {
  const [method, setMethod] = useState<Method>('wechat')
  const [stage, setStage] = useState<Stage>('select')
  const [pwd, setPwd] = useState('')

  const methodName = method === 'wechat' ? '微信支付' : '支付宝'

  const startPay = () => {
    setPwd('')
    setStage('password')
  }

  const onKey = (k: string) => {
    if (k === '') return
    if (k === 'del') {
      setPwd((p) => p.slice(0, -1))
      return
    }
    if (pwd.length >= 6) return
    const next = pwd + k
    setPwd(next)
    if (next.length === 6) {
      window.setTimeout(() => {
        setStage('paying')
        window.setTimeout(() => {
          setStage('success')
          window.setTimeout(() => onPaid(method), 1100)
        }, 1400)
      }, 220)
    }
  }

  return (
    <div className={`pay-mask pay--${method}`} onClick={stage === 'select' ? onClose : undefined}>
      <div className="pay-sheet" onClick={(e) => e.stopPropagation()}>
        {stage === 'select' && (
          <>
            <div className="pay-sheet__head">
              <span>收银台</span>
              <button className="pay-sheet__close" type="button" onClick={onClose} aria-label="关闭">
                ✕
              </button>
            </div>
            <div className="pay-amount">¥{amount.toFixed(2)}</div>
            <p className="pay-merchant">灵山胜境景区 · 消费</p>
            <div className="pay-methods">
              <button
                type="button"
                className={`pay-method ${method === 'wechat' ? 'is-active' : ''}`}
                onClick={() => setMethod('wechat')}
              >
                <span className="pay-method__icon pay-method__icon--wx">微</span>
                <span className="pay-method__name">微信支付</span>
                <span className="pay-method__radio" />
              </button>
              <button
                type="button"
                className={`pay-method ${method === 'alipay' ? 'is-active' : ''}`}
                onClick={() => setMethod('alipay')}
              >
                <span className="pay-method__icon pay-method__icon--ali">支</span>
                <span className="pay-method__name">支付宝</span>
                <span className="pay-method__radio" />
              </button>
            </div>
            <button type="button" className="pay-confirm" onClick={startPay}>
              确认支付 ¥{amount.toFixed(2)}
            </button>
            <p className="pay-tip">演示环境 · 模拟支付,不产生真实交易</p>
          </>
        )}

        {stage === 'password' && (
          <div className="pay-pwd">
            <div className="pay-pwd__head">
              <button className="pay-pwd__back" type="button" onClick={() => setStage('select')} aria-label="返回">
                ‹
              </button>
              <span>请输入支付密码</span>
              <button className="pay-pwd__close" type="button" onClick={onClose} aria-label="关闭">
                ✕
              </button>
            </div>
            <p className="pay-pwd__merchant">{methodName} · 灵山胜境景区</p>
            <div className="pay-pwd__amount">¥{amount.toFixed(2)}</div>
            <div className="pay-pwd__dots">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={`pay-pwd__dot ${i < pwd.length ? 'is-filled' : ''}`} />
              ))}
            </div>
            <p className="pay-pwd__hint">演示:随意输入 6 位数字即可</p>
            <div className="pay-keypad">
              {KEYS.map((k, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pay-key ${k === '' ? 'pay-key--empty' : ''} ${k === 'del' ? 'pay-key--del' : ''}`}
                  onClick={() => onKey(k)}
                  disabled={k === ''}
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'paying' && (
          <div className="pay-status">
            <div className="pay-status__spinner" />
            <p className="pay-status__text">支付中…</p>
          </div>
        )}

        {stage === 'success' && (
          <div className="pay-status">
            <div className="pay-success__icon">✓</div>
            <p className="pay-status__text">支付成功</p>
            <p className="pay-success__amount">¥{amount.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
