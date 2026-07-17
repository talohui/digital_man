import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { CloudOutlined, EyeOutlined, LockOutlined, MailOutlined, ReloadOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildServiceConfigUpdate,
  fetchServiceConfig,
  loginServiceConfig,
  revealServiceConfigSecret,
  saveServiceConfig,
  type ServiceConfig,
} from '../api/serviceConfig'
import {
  fetchEmailReportSettings,
  updateEmailReportSmtpSettings,
  type EmailReportSettings,
} from '../api/emailReports'
import {
  fetchWeatherSettings,
  updateWeatherSettings,
  type WeatherSettings,
} from '../api/weatherSettings'
import { SERVICE_CONFIG_GROUPS } from '../lib/serviceConfigFields'

const { Title, Text } = Typography

function AdminServiceConfigPage() {
  const [form] = Form.useForm<ServiceConfig>()
  const [sessionToken, setSessionToken] = useState('')
  const [config, setConfig] = useState<ServiceConfig | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mailSettings, setMailSettings] = useState<EmailReportSettings | null>(null)
  const [smtpAuthCode, setSmtpAuthCode] = useState('')
  const [mailSaving, setMailSaving] = useState(false)
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null)
  const [weatherApiKey, setWeatherApiKey] = useState('')
  const [weatherSaving, setWeatherSaving] = useState(false)
  const [revealField, setRevealField] = useState<string | null>(null)
  const [revealPassword, setRevealPassword] = useState('')
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set())
  const revealTimers = useRef<number[]>([])

  useEffect(() => () => revealTimers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const loadConfig = async (token: string) => {
    const nextConfig = await fetchServiceConfig(token)
    setConfig(nextConfig)
    form.setFieldsValue(nextConfig)
    try {
      setMailSettings(await fetchEmailReportSettings(token))
      setSmtpAuthCode('')
    } catch (error) {
      setMailSettings(null)
      message.warning(error instanceof Error ? error.message : '运营邮件设置暂时无法读取')
    }
    try {
      setWeatherSettings(await fetchWeatherSettings(token))
    } catch (error) {
      setWeatherSettings(null)
      message.warning(error instanceof Error ? error.message : '天气服务设置暂时无法读取')
    }
  }

  const onAuthenticate = async () => {
    if (!password) {
      message.warning('请输入配置管理员密码')
      return
    }
    setLoading(true)
    try {
      const session = await loginServiceConfig(password)
      setSessionToken(session.token)
      setPassword('')
      await loadConfig(session.token)
      message.success('Fay 服务配置已安全加载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '验证失败')
    } finally {
      setLoading(false)
    }
  }

  const onSave = async () => {
    if (!sessionToken || !config) return
    const draft = await form.validateFields()
    const update = buildServiceConfigUpdate(config, draft)
    if (Object.keys(update).length === 0) {
      message.info('没有需要保存的变更')
      return
    }
    setSaving(true)
    try {
      const nextConfig = await saveServiceConfig(sessionToken, update)
      setConfig(nextConfig)
      form.setFieldsValue(nextConfig)
      setRevealedFields(new Set())
      message.success('配置已保存并热加载到 Fay，无需重启进程')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onReveal = async () => {
    if (!sessionToken || !revealField || !revealPassword || !config) return
    try {
      const value = await revealServiceConfigSecret(sessionToken, revealField, revealPassword)
      form.setFieldValue(revealField, value)
      setRevealedFields((current) => new Set([...current, revealField]))
      const field = revealField
      revealTimers.current.push(
        window.setTimeout(() => {
          form.setFieldValue(field, config[field])
          setRevealedFields((current) => {
            const next = new Set(current)
            next.delete(field)
            return next
          })
        }, 5 * 60 * 1000),
      )
      setRevealField(null)
      setRevealPassword('')
      message.warning('完整 Key 仅在当前页面显示 5 分钟')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重新验证失败')
    }
  }

  const onSaveMailSmtpSettings = async () => {
    if (!sessionToken || !mailSettings) return
    setMailSaving(true)
    try {
      const next = await updateEmailReportSmtpSettings(sessionToken, {
        smtpUsername: mailSettings.senderEmail ?? '',
        ...(smtpAuthCode.trim() ? { smtpAuthCode: smtpAuthCode.trim() } : {}),
      })
      setMailSettings(next)
      setSmtpAuthCode('')
      message.success('QQ SMTP 配置已保存并动态生效')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '运营邮件设置保存失败')
    } finally {
      setMailSaving(false)
    }
  }

  const onSaveWeatherSettings = async () => {
    if (!sessionToken) return
    setWeatherSaving(true)
    try {
      const next = await updateWeatherSettings(sessionToken, weatherApiKey)
      setWeatherSettings(next)
      setWeatherApiKey('')
      message.success('天气 Key 已加密保存并立即应用到天气与路线建议')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '天气服务设置保存失败')
    } finally {
      setWeatherSaving(false)
    }
  }

  if (!sessionToken || !config) {
    return (
      <main className="admin-page">
        <Title level={3} className="admin-page__title">AI 服务配置</Title>
        <Text type="secondary">对 Fay 的敏感服务参数进行受控维护</Text>
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card className="glass-card" bordered={false}>
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <Space size={12} align="start">
                  <SafetyCertificateOutlined style={{ color: '#d4af37', fontSize: 26, marginTop: 3 }} />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>服务配置二次验证</Title>
                    <Text type="secondary">此验证由 Fay 后端处理，浏览器不会保存密码或服务 Key。</Text>
                  </div>
                </Space>
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="输入配置管理员密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onPressEnter={() => void onAuthenticate()}
                />
                <Button type="primary" size="large" loading={loading} onClick={() => void onAuthenticate()} block>
                  验证并加载配置
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Alert
              showIcon
              type="warning"
              message="敏感配置保护"
              description="Key 默认仅显示末四位。编辑时留空将保留原值；查看完整 Key 必须再次输入密码，且只在本页面临时显示。"
            />
          </Col>
        </Row>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={3} className="admin-page__title" style={{ marginBottom: 4 }}>AI 服务配置</Title>
          <Text type="secondary">配置保存后即时热加载至 Fay；不会启动、停止或重启其他服务。</Text>
        </div>
        <Space wrap>
          <Tag color="gold">Fay · 5000</Tag>
          <Button icon={<ReloadOutlined />} onClick={() => void loadConfig(sessionToken)}>重新读取</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void onSave()}>保存并应用</Button>
        </Space>
      </header>

      <Alert
        showIcon
        type="info"
        message="安全策略已启用"
        description="服务端仅接受白名单字段；普通读取始终脱敏。未改动或留空的 Key 不会覆盖现有值。"
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical">
        <Row gutter={[20, 20]}>
          {SERVICE_CONFIG_GROUPS.map((group) => (
            <Col xs={24} xl={12} key={group.id}>
              <Card className="glass-card" title={group.title} extra={<Text type="secondary">{group.description}</Text>} bordered={false}>
                <Row gutter={[12, 0]}>
                  {group.fields.map((field) => (
                    <Col xs={24} md={12} key={field.key}>
                      {field.sensitive ? (
                        <Form.Item label={field.label}>
                          <Space.Compact style={{ width: '100%' }}>
                            <Form.Item name={field.key} noStyle>
                              <Input.Password
                                placeholder="留空保持原值"
                                visibilityToggle={revealedFields.has(field.key)}
                              />
                            </Form.Item>
                            <Button icon={<EyeOutlined />} onClick={() => setRevealField(field.key)}>查看</Button>
                          </Space.Compact>
                        </Form.Item>
                      ) : (
                        <Form.Item name={field.key} label={field.label}>
                          <Input placeholder={field.placeholder} />
                        </Form.Item>
                      )}
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Form>

      <Card
        className="glass-card"
        bordered={false}
        title={<Space><CloudOutlined style={{ color: '#3f7d5b' }} />腾讯天气（WebService）</Space>}
        style={{ marginTop: 20 }}
      >
        {weatherSettings ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={weatherSettings.configured ? 'green' : 'orange'}>
                {weatherSettings.configured ? `天气 Key 已配置 · ${weatherSettings.maskedKey ?? ''}` : '天气 Key 尚未配置'}
              </Tag>
              <Text type="secondary">
                {weatherSettings.source === 'admin' ? '当前使用 B 端已保存配置。' : weatherSettings.source === 'environment' ? '当前使用部署环境变量。' : '保存后将立即用于游客端天气和路线建议。'}
              </Text>
            </Space>
            <Input.Password
              value={weatherApiKey}
              onChange={(event) => setWeatherApiKey(event.target.value)}
              autoComplete="off"
              placeholder="输入腾讯天气 WebService Key；留空保持当前值"
            />
            <Alert
              showIcon
              type="info"
              message="加密持久化，立即生效"
              description="Key 仅保存为 analytics 本地库中的加密数据，页面不会回显完整值；保存后会清除天气缓存，无需重启服务。"
            />
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={weatherSaving} onClick={() => void onSaveWeatherSettings()}>
                加密保存并立即应用
              </Button>
            </Space>
          </Space>
        ) : (
          <Alert showIcon type="warning" message="天气服务设置不可用" description="请确认 analytics-server 正在运行后点击“重新读取”。" />
        )}
      </Card>

      <Card
        className="glass-card"
        bordered={false}
        title={<Space><MailOutlined style={{ color: '#3f7d5b' }} />运营邮件（QQ SMTP）</Space>}
        extra={<Link to="/admin/reports">前往运营报告</Link>}
        style={{ marginTop: 20 }}
      >
        {mailSettings ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={mailSettings.smtpConfigured ? 'green' : 'orange'}>
                {mailSettings.smtpConfigured ? `QQ SMTP 已配置 · ${mailSettings.maskedSender ?? ''}` : 'QQ SMTP 尚未配置'}
              </Tag>
              <Text type="secondary">授权码只提交到后端加密保存，不会回显到页面；留空表示保持原授权码。</Text>
            </Space>
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Text strong>发件人邮箱</Text>
                <Input
                  style={{ marginTop: 8 }}
                  value={mailSettings.senderEmail ?? ''}
                  onChange={(event) => setMailSettings({ ...mailSettings, senderEmail: event.target.value })}
                  placeholder="例如：1109460648@qq.com"
                  autoComplete="email"
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong>QQ 授权码</Text>
                <Input.Password
                  style={{ marginTop: 8 }}
                  value={smtpAuthCode}
                  onChange={(event) => setSmtpAuthCode(event.target.value)}
                  placeholder={mailSettings.smtpConfigured ? '留空保持当前授权码' : '请输入 QQ 邮箱授权码'}
                  autoComplete="new-password"
                />
              </Col>
            </Row>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} loading={mailSaving} onClick={() => void onSaveMailSmtpSettings()}>保存 QQ SMTP 配置</Button>
              <Link to="/admin/reports"><Button>前往运营报告</Button></Link>
            </Space>
          </Space>
        ) : (
          <Alert showIcon type="warning" message="运营邮件设置不可用" description="请确认 analytics-server 正在运行后点击“重新读取”。QQ 授权码可由此页面提交到后端，也可继续使用服务部署环境中的默认配置。" />
        )}
      </Card>

      <Modal
        title="重新验证后查看完整 Key"
        open={Boolean(revealField)}
        onCancel={() => { setRevealField(null); setRevealPassword('') }}
        onOk={() => void onReveal()}
        okText="验证并查看"
        destroyOnClose
      >
        <Text type="secondary">完整值不会写入浏览器存储，5 分钟后自动重新掩码。</Text>
        <Divider />
        <Input.Password
          autoFocus
          placeholder="输入配置管理员密码"
          value={revealPassword}
          onChange={(event) => setRevealPassword(event.target.value)}
          onPressEnter={() => void onReveal()}
        />
      </Modal>
    </main>
  )
}

export default AdminServiceConfigPage
