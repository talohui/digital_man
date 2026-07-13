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
import { EyeOutlined, LockOutlined, ReloadOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import {
  buildServiceConfigUpdate,
  fetchServiceConfig,
  loginServiceConfig,
  revealServiceConfigSecret,
  saveServiceConfig,
  type ServiceConfig,
} from '../api/serviceConfig'
import { SERVICE_CONFIG_GROUPS } from '../lib/serviceConfigFields'

const { Title, Text } = Typography

function AdminServiceConfigPage() {
  const [form] = Form.useForm<ServiceConfig>()
  const [sessionToken, setSessionToken] = useState('')
  const [config, setConfig] = useState<ServiceConfig | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revealField, setRevealField] = useState<string | null>(null)
  const [revealPassword, setRevealPassword] = useState('')
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set())
  const revealTimers = useRef<number[]>([])

  useEffect(() => () => revealTimers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const loadConfig = async (token: string) => {
    const nextConfig = await fetchServiceConfig(token)
    setConfig(nextConfig)
    form.setFieldsValue(nextConfig)
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
