import { Alert, App, Button, Card, Col, Form, Input, Row, Select, Space, Typography } from 'antd'
import { CheckOutlined, SoundOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import AdminLive2DPreview from '../components/admin/AdminLive2DPreview'
import { adminGet, adminPut } from '../api/admin'
import { parseCostumeId, type CostumeId } from '../lib/live2dCostume'
import {
  DEFAULT_LIVE2D_PRESET,
  listLive2DPresets,
  resolveLive2DPreset,
  type Live2DPreset
} from '../lib/live2dPresets'
import { playVoiceSample } from '../lib/voicePreview'

const { Title, Text } = Typography

const LIVE2D_PRESETS = listLive2DPresets()

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
  const [previewPreset, setPreviewPreset] = useState<Live2DPreset>(DEFAULT_LIVE2D_PRESET)
  const [previewCostumeId, setPreviewCostumeId] = useState<CostumeId>('default')
  const [previewVoiceId, setPreviewVoiceId] = useState<string>('')
  const [form] = Form.useForm()

  const load = () => {
    adminGet<AvatarAdminConfig>('/admin/avatar-config')
      .then((data) => {
        setConfig(data)
        setPreviewPreset(resolveLive2DPreset(data.live2dModelUrl))
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
        live2dModelUrl: previewPreset.modelUrl,
        live2dPresetName: previewPreset.name,
        costumeId: previewPreset.supportsCostumes
          ? parseCostumeId(values.costumeId)
          : 'default',
        voiceId: values.voiceId,
        voiceName: config?.voices?.find((v) => v.id === values.voiceId)?.name,
        displayName: values.displayName
      })
      message.success(`已启用：${previewPreset.name}`)
      if (res.voiceSyncWarning) {
        message.warning(res.voiceSyncWarning)
      }
      if (res.fayRestartRequired) {
        message.info(
          '音色已写入 Fay 的 config.json 与 cache_data/config.json，请在本机 Fay-main 目录重启 Fay 后生效'
        )
      }
      setPreviewCostumeId(
        previewPreset.supportsCostumes ? parseCostumeId(values.costumeId) : 'default'
      )
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
        message="形象资源均随项目本地发布。默认小灵保留现有换装能力；新增形象使用各自原始服装。音色保存后请重启 Fay 生效。"
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
                          if (!preset.supportsCostumes) {
                            form.setFieldValue('costumeId', 'default')
                            setPreviewCostumeId('default')
                          }
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
              <Form.Item
                name="costumeId"
                label="景区服装"
                extra={
                  previewPreset.supportsCostumes
                    ? undefined
                    : '该形象使用原始服装，暂不支持默认小灵的换装贴图。'
                }
              >
                <Select options={costumeOptions} disabled={!previewPreset.supportsCostumes} />
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
            extra={<Text type="secondary">{previewPreset.name}</Text>}
            bordered={false}
          >
            {config ? (
              <AdminLive2DPreview
                modelUrl={previewPreset.modelUrl}
                costumeId={previewCostumeId}
                supportsCostumes={previewPreset.supportsCostumes}
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
