import { CalendarOutlined, CheckCircleOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { captureTicketPurchase } from '../lib/analytics'
import {
  ticketTypeOptions,
  useTicketStore,
  type TicketAgeBand,
  type TicketGender,
  type TicketType,
} from '../store/useTicketStore'

const ageBands: TicketAgeBand[] = ['18-24', '25-34', '35-44', '45-59', '60+']
const genderOptions: TicketGender[] = ['女', '男', '不便透露']

function today() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function MobileTicketPage() {
  const navigate = useNavigate()
  const submitTicket = useTicketStore((state) => state.submitTicket)
  const currentTicket = useTicketStore((state) => state.ticketProfile)
  const [ageBand, setAgeBand] = useState<TicketAgeBand>(currentTicket?.ageBand ?? '25-34')
  const [gender, setGender] = useState<TicketGender>(currentTicket?.gender ?? '不便透露')
  const [groupSize, setGroupSize] = useState(currentTicket?.groupSize ?? 2)
  const [visitDate, setVisitDate] = useState(currentTicket?.visitDate ?? today())
  const [ticketType, setTicketType] = useState<TicketType>(currentTicket?.ticketType ?? 'standard')

  const selectedTicket = useMemo(
    () => ticketTypeOptions.find((item) => item.id === ticketType) ?? ticketTypeOptions[0],
    [ticketType]
  )

  const handleSubmit = () => {
    const ticket = submitTicket({
      ageBand,
      gender,
      groupSize,
      visitDate,
      ticketType,
    })
    captureTicketPurchase(ticket)
    navigate('/consume')
  }

  return (
    <div className="mobile-ticket-page">
      <section className="mobile-ticket-hero">
        <div>
          <span className="mobile-section-kicker">TICKET PROFILE</span>
          <h2>购票入园</h2>
          <p>用分段信息生成基础游客画像，后续地图、聊天、评分会继续补充实时行为。</p>
        </div>
        <CheckCircleOutlined />
      </section>

      <section className="mobile-panel mobile-ticket-form">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">基础信息</span>
            <h3>只采集分析字段</h3>
          </div>
          <UserOutlined />
        </div>

        <label className="mobile-field">
          <span>年龄段</span>
          <div className="mobile-segmented">
            {ageBands.map((item) => (
              <button
                key={item}
                type="button"
                className={ageBand === item ? 'is-active' : ''}
                onClick={() => setAgeBand(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </label>

        <label className="mobile-field">
          <span>性别</span>
          <div className="mobile-segmented mobile-segmented--three">
            {genderOptions.map((item) => (
              <button
                key={item}
                type="button"
                className={gender === item ? 'is-active' : ''}
                onClick={() => setGender(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </label>

        <div className="mobile-ticket-row">
          <label className="mobile-field">
            <span>同行人数</span>
            <div className="mobile-stepper">
              <button type="button" onClick={() => setGroupSize((value) => Math.max(1, value - 1))}>-</button>
              <strong>{groupSize}</strong>
              <button type="button" onClick={() => setGroupSize((value) => Math.min(5, value + 1))}>+</button>
            </div>
          </label>

          <label className="mobile-field">
            <span>游览日期</span>
            <div className="mobile-date-input">
              <CalendarOutlined />
              <input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
            </div>
          </label>
        </div>
      </section>

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">票型</span>
            <h3>选择今天的游览倾向</h3>
          </div>
          <TeamOutlined />
        </div>
        <div className="mobile-ticket-types">
          {ticketTypeOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={ticketType === item.id ? 'is-active' : ''}
              onClick={() => setTicketType(item.id)}
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <b>¥{item.price}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="mobile-ticket-summary">
        <div>
          <span>预计入园</span>
          <strong>{groupSize} 人 · {selectedTicket.label}</strong>
        </div>
        <div>
          <span>模拟票价</span>
          <strong>¥{selectedTicket.price}</strong>
        </div>
      </section>

      <button className="mobile-primary-action" type="button" onClick={handleSubmit}>
        确认购票并去消费页
      </button>
      <p className="mobile-muted">比赛演示版不接真实支付，不采集身份证、姓名、手机号或支付账号。</p>
    </div>
  )
}

export default MobileTicketPage
