import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from 'antd'
import { CheckOutlined, SoundOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import AdminLive2DPreview from '../components/admin/AdminLive2DPreview'
import { adminGet, adminPut, notifyPublicAvatarConfigUpdated } from '../api/admin'
import {
  DEFAULT_LIVE2D_PRESET,
  listLive2DPresets,
  resolveLive2DPreset,
  type Live2DPreset
} from '../lib/live2dPresets'
import { FAY_FEMALE_VOICE_OPTIONS } from '../lib/fayVoices'
import { playVoiceSample } from '../lib/voicePreview'

const { Title, Text } = Typography

const LIVE2D_PRESETS = listLive2DPresets()
const FAY_VOICE_OPTIONS = FAY_FEMALE_VOICE_OPTIONS.map((voice) => ({
  value: voice.id,
  label: voice.label,
}))

interface AvatarAdminConfig {
  live2dModelUrl: string
  live2dPresetName: string
  voiceId: string
  voiceName: string
  displayName: string
  voices: { id: string; name: string }[]
}

function AdminAvatarPage() {
  const [config, setConfig] = useState<AvatarAdminConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewPreset, setPreviewPreset] = useState<Live2DPreset>(DEFAULT_LIVE2D_PRESET)
  const [previewVoiceId, setPreviewVoiceId] = useState<string>('')
  const [form] = Form.useForm()

  const load = () => {
    adminGet<AvatarAdminConfig>('/admin/avatar-config')
      .then((data) => {
        setConfig(data)
        setPreviewPreset(resolveLive2DPreset(data.live2dModelUrl))
        form.setFieldsValue({
          voiceId: data.voiceId,
          displayName: data.displayName
        })
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
    const voiceName = FAY_FEMALE_VOICE_OPTIONS.find((voice) => voice.id === voiceId)?.label ?? voiceId
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
        AvatarAdminConfig & { fayRestartRequired?: boolean; voiceAppliedOnNextTts?: boolean; voiceSyncWarning?: string }
      >('/admin/avatar-config', {
        live2dModelUrl: previewPreset.modelUrl,
        live2dPresetName: previewPreset.name,
        voiceId: values.voiceId,
        voiceName: FAY_FEMALE_VOICE_OPTIONS.find((voice) => voice.id === values.voiceId)?.label,
        displayName: values.displayName
      })
      message.success(`已启用：${previewPreset.name}`)
      notifyPublicAvatarConfigUpdated()
      if (res.voiceSyncWarning) {
        message.warning(res.voiceSyncWarning)
      }
      if (res.voiceAppliedOnNextTts) {
        message.info('音色已同步至 Fay，下一次语音合成立即使用，无需重启')
      } else if (res.fayRestartRequired) {
        message.warning('音色已保存，但当前 Fay 版本需重启后生效')
      }
      load()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

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
        message="形象资源均随项目本地发布。当前提供雅致、清新、灵动三套本地形象。Fay TTS 音色保存后会在下一次合成时生效。"
      />

      <Row gutter={[24, 24]} className="admin-avatar-row">
        <Col xs={24} lg={10}>
          <Card className="glass-card admin-avatar-form-card" title="形象与音色" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onSave}
              onValuesChange={(changed) => {
                if ('voiceId' in changed) {
                  setPreviewVoiceId(changed.voiceId as string)
                }
              }}
            >
              <Form.Item label="形象预设">
                <div className="admin-avatar-presets" role="radiogroup" aria-label="数字人形象预设">
                  {LIVE2D_PRESETS.map((preset, index) => {
                    const selected = previewPreset.id === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`admin-avatar-preset${selected ? ' admin-avatar-preset--selected' : ''}`}
                        onClick={() => {
                          setPreviewPreset(preset)
                        }}
                      >
                        <span className="admin-avatar-preset__index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="admin-avatar-preset__copy">
                          <strong>{preset.name}</strong>
                          <small>{preset.supportsCostumes ? '支持景区换装' : '原始服装'}</small>
                        </span>
                        <span className="admin-avatar-preset__check" aria-hidden="true">
                          {selected && <CheckOutlined />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Form.Item>
              <Form.Item name="displayName" label="导游显示名">
                <Input placeholder="小灵" />
              </Form.Item>
              <Form.Item label="Fay TTS 音色">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="voiceId" noStyle rules={[{ required: true, message: '请选择音色' }]}>
                    <Select
                      style={{ flex: 1 }}
                      options={FAY_VOICE_OPTIONS}
                    />
                  </Form.Item>
                  <Button icon={<SoundOutlined />} onClick={onPreviewVoice}>
                    试听
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Text type="secondary" className="admin-avatar-voice-hint">
                所有可选音色均提供真实本地试听；保存后同步 Fay 的 attribute.voice，下一次阿里云 NLS TTS 合成立即生效。
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
            extra={<Text type="secondary">{previewPreset.name}</Text>}
            bordered={false}
          >
            {config ? (
              <AdminLive2DPreview
                modelUrl={previewPreset.modelUrl}
              />
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
