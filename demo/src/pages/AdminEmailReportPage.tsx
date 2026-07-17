import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Col, Divider, Input, Row, Select, Space, Spin, Switch, Tag, Typography, message } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchEmailReportDispatches,
  fetchEmailReportSettings,
  sendEmailReportTest,
  updateEmailReportSettings,
  type EmailReportDispatch,
  type EmailReportSettings,
} from '../api/emailReports'
import { loginServiceConfig } from '../api/serviceConfig'
import { useAdminOpsPageActions } from '../components/admin-ops/AdminOpsPageActions'

const { Title, Text, Paragraph } = Typography

const WEEK_DAYS: Array<{ value: EmailReportSettings['weeklyDay']; label: string }> = [
  { value: 'MONDAY', label: '周一' },
  { value: 'TUESDAY', label: '周二' },
  { value: 'WEDNESDAY', label: '周三' },
  { value: 'THURSDAY', label: '周四' },
  { value: 'FRIDAY', label: '周五' },
  { value: 'SATURDAY', label: '周六' },
  { value: 'SUNDAY', label: '周日' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function timeLabel(value: string | null) {
  if (!value) return '未发送'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function sourceLabel(source: string) {
  return source === 'llm' ? '大模型生成' : source === 'rules' ? '规则兜底' : source === 'pending' ? '生成中' : source
}

export default function AdminEmailReportPage() {
  const navigate = useNavigate()
  const [sessionToken, setSessionToken] = useState('')
  const [password, setPassword] = useState('')
  const [settings, setSettings] = useState<EmailReportSettings | null>(null)
  const [dispatches, setDispatches] = useState<EmailReportDispatch[]>([])
  const [recipientDraft, setRecipientDraft] = useState('')
  const [authenticating, setAuthenticating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async (token = sessionToken) => {
    if (!token) return false
    setLoading(true)
    try {
      const [nextSettings, nextDispatches] = await Promise.all([
        fetchEmailReportSettings(token),
        fetchEmailReportDispatches(token),
      ])
      setSettings(nextSettings)
      setDispatches(nextDispatches)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '无法读取运营报告配置')
      setSessionToken('')
      setSettings(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [sessionToken])

  useAdminOpsPageActions({
    refreshedAt: dispatches[0]?.createdAt ? timeLabel(dispatches[0].createdAt) : undefined,
    refreshing: loading,
    onRefresh: sessionToken ? async () => { await load() } : undefined,
  })

  const onAuthenticate = async () => {
    if (!password) {
      message.warning('请输入管理员密码')
      return
    }
    setAuthenticating(true)
    try {
      const session = await loginServiceConfig(password)
      setPassword('')
      setSessionToken(session.token)
      const loaded = await load(session.token)
      if (loaded) message.success('运营报告配置已安全加载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '管理员验证失败')
    } finally {
      setAuthenticating(false)
    }
  }

  const addRecipient = () => {
    if (!settings) return
    const email = recipientDraft.trim().toLowerCase()
    if (!emailPattern.test(email)) {
      message.warning('请输入有效的邮箱地址')
      return
    }
    if (settings.recipients.includes(email)) {
      setRecipientDraft('')
      return
    }
    if (settings.recipients.length >= 20) {
      message.warning('最多可配置 20 位收件人')
      return
    }
    setSettings({ ...settings, recipients: [...settings.recipients, email] })
    setRecipientDraft('')
  }

  const save = async () => {
    if (!settings || !sessionToken) return
    setSaving(true)
    try {
      const next = await updateEmailReportSettings(sessionToken, {
        recipients: settings.recipients,
        dailyEnabled: settings.dailyEnabled,
        dailyTime: settings.dailyTime,
        weeklyEnabled: settings.weeklyEnabled,
        weeklyDay: settings.weeklyDay,
        weeklyTime: settings.weeklyTime,
      })
      setSettings(next)
      message.success('发送计划已保存，调度无需重启服务即可生效')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!sessionToken) return
    setTesting(true)
    try {
      const dispatch = await sendEmailReportTest(sessionToken)
      setDispatches((current) => [dispatch, ...current.filter((item) => item.id !== dispatch.id)].slice(0, 20))
      if (dispatch.status === 'SENT') message.success('测试邮件已提交至 QQ SMTP')
      else message.warning(dispatch.safeErrorCode === 'SMTP_NOT_CONFIGURED' ? '尚未配置 QQ SMTP 环境变量' : '测试邮件未发送，请查看下方安全错误码')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '测试邮件发送失败')
    } finally {
      setTesting(false)
    }
  }

  const scheduleSummary = useMemo(() => {
    if (!settings) return ''
    const weeklyDay = WEEK_DAYS.find((item) => item.value === settings.weeklyDay)?.label ?? '周一'
    const items = [settings.dailyEnabled ? `日报 · 每日 ${settings.dailyTime}` : null, settings.weeklyEnabled ? `周报 · ${weeklyDay} ${settings.weeklyTime}` : null]
      .filter(Boolean)
    return items.length ? items.join('  /  ') : '当前未启用自动发送'
  }, [settings])

  if (!sessionToken || !settings) {
    return (
      <main className="admin-page admin-ops-reports">
        <header className="admin-ops-page-intro" style={{ alignItems: 'flex-end' }}>
          <div>
            <Text className="admin-ops-page-intro__eyebrow">运营邮件与定时报表</Text>
            <Title level={2}>AI 运营报告</Title>
            <Text className="admin-ops-page-intro__description">让日报与周报在固定时刻，把真实运营汇总转化为可读、可追溯的邮件简报。</Text>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>
            返回运营总览
          </Button>
        </header>
        <Row gutter={[18, 18]}>
          <Col xs={24} lg={13}>
            <Card className="admin-ops-reports__auth" bordered={false}>
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <Space size={12} align="start">
                  <span className="admin-ops-reports__seal"><SafetyCertificateOutlined /></span>
                  <div>
                    <Text strong>管理员二次验证</Text>
                    <Paragraph type="secondary" style={{ margin: '5px 0 0' }}>收件人、发送计划和审计记录都需要 Fay 的短期管理员会话。密码与会话不会写入浏览器存储。</Paragraph>
                  </div>
                </Space>
                <Input.Password
                  size="large"
                  prefix={<MailOutlined />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onPressEnter={() => void onAuthenticate()}
                  placeholder="输入管理员密码以加载报告配置"
                />
                <Button type="primary" size="large" loading={authenticating} onClick={() => void onAuthenticate()}>
                  验证并加载报告设置
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={11}>
            <Alert
              showIcon
              type="info"
              message="安全投递边界"
              description="QQ 发件邮箱与授权码请在服务配置页维护并加密保存；邮件正文由固定 HTML 模板渲染。大模型只生成受结构校验的运营摘要，异常时自动切换规则兜底。"
            />
          </Col>
        </Row>
      </main>
    )
  }

  return (
    <main className="admin-page admin-ops-reports">
      <header className="admin-ops-page-intro" style={{ alignItems: 'flex-end' }}>
        <div>
          <Text className="admin-ops-page-intro__eyebrow">运营邮件与定时报表</Text>
          <Title level={2}>AI 运营报告</Title>
          <Text className="admin-ops-page-intro__description">{scheduleSummary}。报告使用真实运营汇总，显示“大模型生成”或“规则兜底”来源。</Text>
        </div>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>返回运营总览</Button>
          <Tag color={settings.smtpConfigured ? 'green' : 'orange'}>{settings.smtpConfigured ? `QQ SMTP · ${settings.maskedSender}` : 'QQ SMTP 未配置'}</Tag>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>刷新记录</Button>
          <Button icon={<SendOutlined />} loading={testing} onClick={() => void sendTest()}>发送测试邮件</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} loading={saving} onClick={() => void save()}>保存发送计划</Button>
        </Space>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="投递名册与发送节奏" bordered={false} className="admin-ops-reports__settings-card">
            <Text type="secondary">收件人最多 20 位，保存后将用于后续日报与周报。发送审计只保存不可逆摘要，不保存明文地址。</Text>
            <Divider />
            <div className="admin-ops-reports__recipient-input">
              <Input
                value={recipientDraft}
                onChange={(event) => setRecipientDraft(event.target.value)}
                onPressEnter={addRecipient}
                placeholder="输入收件人邮箱后按回车"
                suffix={<Button type="text" icon={<PlusOutlined />} onClick={addRecipient}>添加</Button>}
              />
            </div>
            <div className="admin-ops-reports__recipient-tags" aria-label="邮件收件人">
              {settings.recipients.length ? settings.recipients.map((email) => (
                <Tag key={email} closable onClose={() => setSettings({ ...settings, recipients: settings.recipients.filter((item) => item !== email) })}>
                  <MailOutlined /> {email}
                </Tag>
              )) : <Text type="secondary">尚未添加收件人；启用定时发送前必须至少添加一位。</Text>}
            </div>
            <Divider />
            <div className="admin-ops-reports__schedule-grid">
              <section>
                <div className="admin-ops-reports__schedule-heading"><ClockCircleOutlined /><strong>运营日报</strong><Switch checked={settings.dailyEnabled} onChange={(dailyEnabled) => setSettings({ ...settings, dailyEnabled })} /></div>
                <Text type="secondary">基于前一个完整自然日的数据生成。</Text>
                <Input type="time" aria-label="日报发送时间" value={settings.dailyTime} disabled={!settings.dailyEnabled} onChange={(event) => setSettings({ ...settings, dailyTime: event.target.value })} />
              </section>
              <section>
                <div className="admin-ops-reports__schedule-heading"><CalendarOutlined /><strong>运营周报</strong><Switch checked={settings.weeklyEnabled} onChange={(weeklyEnabled) => setSettings({ ...settings, weeklyEnabled })} /></div>
                <Text type="secondary">基于上一个完整周一至周日的数据生成。</Text>
                <Space.Compact block>
                  <Select aria-label="周报发送星期" value={settings.weeklyDay} disabled={!settings.weeklyEnabled} options={WEEK_DAYS} onChange={(weeklyDay) => setSettings({ ...settings, weeklyDay })} />
                  <Input type="time" aria-label="周报发送时间" value={settings.weeklyTime} disabled={!settings.weeklyEnabled} onChange={(event) => setSettings({ ...settings, weeklyTime: event.target.value })} />
                </Space.Compact>
              </section>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="生成与投递策略" bordered={false} className="admin-ops-reports__policy-card">
            <div className="admin-ops-reports__policy-line"><span>报告正文</span><strong>大模型结构化生成</strong></div>
            <div className="admin-ops-reports__policy-line"><span>异常处理</span><strong>规则兜底，不漏报</strong></div>
            <div className="admin-ops-reports__policy-line"><span>重复触发</span><strong>同周期仅投递一次</strong></div>
            <div className="admin-ops-reports__policy-line"><span>时区</span><strong>Asia/Shanghai</strong></div>
            <Alert showIcon type="warning" message="发送前提示" description="请先在服务配置页配置 QQ 发件邮箱和授权码，再点击“发送测试邮件”验证。" style={{ marginTop: 16 }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近发送记录" bordered={false} className="admin-ops-reports__audit-card" style={{ marginTop: 16 }}>
        {dispatches.length ? (
          <div className="admin-ops-reports__audit-list">
            {dispatches.map((item) => (
              <article className="admin-ops-reports__audit-item" key={item.id}>
                <span className={`admin-ops-reports__audit-state is-${item.status.toLowerCase()}`} aria-hidden="true" />
                <div>
                  <Space wrap size={7}>
                    <Text strong>{item.subject || `${item.reportType} 运营报告`}</Text>
                    <Tag>{item.reportType === 'TEST' ? '测试' : item.reportType === 'DAILY' ? '日报' : '周报'}</Tag>
                    <Tag color={item.generationSource === 'llm' ? 'green' : 'orange'}>{sourceLabel(item.generationSource)}</Tag>
                    <Tag color={item.status === 'SENT' ? 'green' : item.status === 'FAILED' ? 'red' : 'blue'}>{item.status}</Tag>
                  </Space>
                  <Text type="secondary" className="admin-ops-reports__audit-meta">周期 {item.periodKey} · {item.recipientCount} 位收件人 · {timeLabel(item.sentAt || item.createdAt)}{item.safeErrorCode ? ` · ${item.safeErrorCode}` : ''}</Text>
                </div>
              </article>
            ))}
          </div>
        ) : <Text type="secondary">暂未产生发送记录。完成配置后可先发送一封测试邮件。</Text>}
      </Card>
    </main>
  )
}
