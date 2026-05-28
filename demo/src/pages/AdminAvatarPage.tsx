import { Alert, App, Button, Card, Col, Form, Input, Row, Select, Space, Typography } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import AdminLive2DPreview, { HARU_MODEL_URL } from '../components/admin/AdminLive2DPreview'
import { adminGet, adminPut } from '../api/admin'
import { parseCostumeId, type CostumeId } from '../lib/live2dCostume'
import { playVoiceSample } from '../lib/voicePreview'

const { Title, Text } = Typography

const HARU_PRESET_NAME = '默认·小灵'

interface CostumeOption {
  id: string
  name: string
  textureUrl: string
}

interface AvatarAdminConfig {
  live2dModelUrl: string
  live2dPresetName: string
  voiceId: string
  voiceName: string
  displayName: string
  costumeId?: string
  voices: { id: string; name: string }[]
  costumes?: CostumeOption[]
}

function AdminAvatarPage() {
  const { message } = App.useApp()
  const [config, setConfig] = useState<AvatarAdminConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewCostumeId, setPreviewCostumeId] = useState<CostumeId>('default')
  const [previewVoiceId, setPreviewVoiceId] = useState<string>('')
  const [form] = Form.useForm()

  const load = () => {
    adminGet<AvatarAdminConfig>('/admin/avatar-config')
      .then((data) => {
        setConfig(data)
        const costumeId = parseCostumeId(data.costumeId)
        form.setFieldsValue({
          costumeId,
          voiceId: data.voiceId,
          displayName: data.displayName
        })
        setPreviewCostumeId(costumeId)
        setPreviewVoiceId(data.voiceId)
      })
      .catch(() => message.error('加载配置失败'))
  }

  useEffect(() => {
    load()
  }, [])

  const watchedVoiceId = Form.useWatch('voiceId', form)

  const onPreviewVoice = async () => {
    const voiceId = (watchedVoiceId as string | undefined) || form.getFieldValue('voiceId')
    if (!voiceId) return
    const result = await playVoiceSample(voiceId)
    const voiceName = config?.voices?.find((v) => v.id === voiceId)?.name ?? voiceId
    if (result === 'played') {
      message.success(`正在试听：${voiceName}（${voiceId}）`)
    } else {
      message.warning(
        `未找到试听文件，请将 ${voiceId}.wav 或 ${voiceId}.mp3 放入 demo/public/admin/voice-samples/。线上音色以保存后重启 Fay 为准。`
      )
    }
  }

  const onSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const res = await adminPut<
        AvatarAdminConfig & { fayRestartRequired?: boolean; voiceSyncWarning?: string }
      >('/admin/avatar-config', {
        live2dModelUrl: HARU_MODEL_URL,
        live2dPresetName: HARU_PRESET_NAME,
        costumeId: parseCostumeId(values.costumeId),
        voiceId: values.voiceId,
        voiceName: config?.voices?.find((v) => v.id === values.voiceId)?.name,
        displayName: values.displayName
      })
      message.success('已保存')
      if (res.voiceSyncWarning) {
        message.warning(res.voiceSyncWarning)
      }
      if (res.fayRestartRequired) {
        message.info(
          '音色已写入 Fay 的 config.json 与 cache_data/config.json，请在本机 Fay-main 目录重启 Fay 后生效'
        )
      }
      setPreviewCostumeId(parseCostumeId(values.costumeId))
      load()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const costumeOptions =
    config?.costumes?.map((c) => ({ value: c.id, label: c.name })) ?? [
      { value: 'default', label: '默认（官方）' },
      { value: 'costume1', label: '服装一 · 红色' },
      { value: 'costume2', label: '服装二 · 绿色' }
    ]

  const displayName = Form.useWatch('displayName', form) ?? config?.displayName ?? '小灵'

  return (
    <div className="admin-page">
      <Title level={3} className="admin-page__title">
        数字人形象管理
      </Title>
      <Text type="secondary">配置 Live2D 外观与 TTS 音色，游客端将自动读取</Text>

      <Alert
        className="admin-avatar-alert"
        type="info"
        showIcon
        message="线上音色同时写入 Fay 目录下 config.json 与 cache_data/config.json（Fay 启动可能读后者）。保存后请在 Fay-main 目录重启 Fay。试听为 voice-samples 示意文件；景区服装为成套换装。"
      />

      <Row gutter={[24, 24]} className="admin-avatar-row">
        <Col xs={24} lg={10}>
          <Card className="glass-card admin-avatar-form-card" title="形象与音色" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onSave}
              onValuesChange={(changed) => {
                if ('costumeId' in changed) {
                  setPreviewCostumeId(parseCostumeId(changed.costumeId))
                }
                if ('voiceId' in changed) {
                  setPreviewVoiceId(changed.voiceId as string)
                }
              }}
            >
              <Form.Item name="displayName" label="导游显示名">
                <Input placeholder="小灵" />
              </Form.Item>
              <Form.Item name="costumeId" label="景区服装">
                <Select options={costumeOptions} />
              </Form.Item>
              <Form.Item label="语音音色">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="voiceId" noStyle rules={[{ required: true, message: '请选择音色' }]}>
                    <Select
                      style={{ flex: 1 }}
                      options={config?.voices?.map((v) => ({ value: v.id, label: v.name }))}
                    />
                  </Form.Item>
                  <Button icon={<SoundOutlined />} onClick={onPreviewVoice}>
                    试听
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Text type="secondary" className="admin-avatar-voice-hint">
                试听为示意音频（voice-samples 目录下与音色 ID 同名的 .wav 或 .mp3），与线上一致性以 Fay TTS 为准。
              </Text>
              <Button type="primary" htmlType="submit" loading={saving} block style={{ marginTop: 16 }}>
                保存配置
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            className="glass-card admin-avatar-preview-card"
            title={`2D 数字人预览 · ${displayName}`}
            bordered={false}
          >
            {config ? (
              <AdminLive2DPreview costumeId={previewCostumeId} />
            ) : (
              <div className="admin-live2d-preview admin-live2d-preview--placeholder" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminAvatarPage
