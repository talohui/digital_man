import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertOutlined, EditOutlined, PlusOutlined,
  SafetyCertificateOutlined, SyncOutlined
} from '@ant-design/icons'
import {
  Alert, Button, Card, Col, DatePicker, Drawer, Form, Input,
  Popconfirm, Row, Select, Space, Statistic, Table, Tag, Typography, message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import {
  createEmergency, fetchAdminEmergencies, publishEmergency, resolveEmergency,
  retryEmergencyKnowledgeSync, updateEmergency,
  type EmergencyEvent, type EmergencyEventInput, type EmergencySeverity,
  type EmergencyType, type RoutePolicy
} from '../api/emergencies'
import { useAdminOpsPageActions } from '../components/admin-ops/AdminOpsPageActions'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker

const EVENT_TYPES: Array<{ value: EmergencyType; label: string }> = [
  { value: 'SCENIC_CLOSURE', label: '临时闭园' },
  { value: 'SHOW_CANCELLED', label: '演出取消' },
  { value: 'EXTREME_WEATHER', label: '极端天气' },
  { value: 'CROWDING', label: '景点拥堵' },
  { value: 'ROAD_CLOSURE', label: '道路封闭' },
  { value: 'MISSING_PERSON', label: '游客走失' },
  { value: 'MEDICAL_HELP', label: '医疗求助' }
]

const SPOTS = [
  ['south_gate', '南门'], ['jiulong_guanyu', '九龙灌浴'], ['puti_avenue', '菩提大道'],
  ['foshou_square', '佛手广场'], ['giant_buddha', '灵山大佛'], ['fan_gong', '梵宫'],
  ['wuyin_tancheng', '五印坛城'], ['exit', '景区出口']
].map(([value, label]) => ({ value, label }))

const ROUTES = [
  { value: 'historical_culture', label: '文化探秘路线' },
  { value: 'prayer_meditation', label: '祈福静心路线' },
  { value: 'family', label: '亲子游路线' }
]

const palette = {
  bg: '#f5f1e8', panel: 'rgba(232, 240, 226, 0.82)', panelRaised: 'rgba(218, 231, 212, 0.76)', border: '#ddd4c4',
  text: '#263730', muted: '#728078', gold: '#a87c34', cyan: '#2f766c', red: '#a34a3f'
}

type EditorValues = {
  type: EmergencyType
  title: string
  message: string
  severity: EmergencySeverity
  validity: [Dayjs, Dayjs]
  routePolicy: RoutePolicy
  affectedSpotIds?: string[]
  affectedRouteIds?: string[]
  knowledgeQuestion?: string
  knowledgeAnswer?: string
}

function typeLabel(type: EmergencyType) {
  return EVENT_TYPES.find(item => item.value === type)?.label ?? type
}

function effectiveStatus(event: EmergencyEvent) {
  if (event.status === 'ACTIVE' && dayjs(event.validUntil).isBefore(dayjs())) return 'EXPIRED'
  return event.status ?? 'DRAFT'
}

function AdminEmergencyPage() {
  const [form] = Form.useForm<EditorValues>()
  const selectedType = Form.useWatch('type', form)
  const [events, setEvents] = useState<EmergencyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EmergencyEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [actingId, setActingId] = useState('')
  const [refreshedAt, setRefreshedAt] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEvents(await fetchAdminEmergencies())
      setError('')
      setRefreshedAt(dayjs().format('HH:mm:ss'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '应急事件读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => ({
    active: events.filter(event => effectiveStatus(event) === 'ACTIVE').length,
    critical: events.filter(event => effectiveStatus(event) === 'ACTIVE' && event.severity === 'CRITICAL').length,
    draft: events.filter(event => event.status === 'DRAFT').length,
    syncFailed: events.filter(event => event.kbSyncStatus === 'FAILED').length
  }), [events])

  const showCreate = () => {
    setEditing(null)
    form.setFieldsValue({
      type: 'CROWDING', severity: 'WARNING', routePolicy: 'PENALIZE',
      validity: [dayjs(), dayjs().add(2, 'hour')], affectedSpotIds: [], affectedRouteIds: []
    })
    setOpen(true)
  }

  const showEdit = (event: EmergencyEvent) => {
    setEditing(event)
    form.setFieldsValue({
      type: event.type, title: event.title, message: event.message, severity: event.severity,
      validity: [dayjs(event.validFrom), dayjs(event.validUntil)], routePolicy: event.routePolicy,
      affectedSpotIds: event.affectedSpotIds, affectedRouteIds: event.affectedRouteIds,
      knowledgeQuestion: event.knowledgeQuestion ?? '', knowledgeAnswer: event.knowledgeAnswer ?? ''
    })
    setOpen(true)
  }

  const save = async (values: EditorValues) => {
    const payload: EmergencyEventInput = {
      type: values.type, title: values.title.trim(), message: values.message.trim(), severity: values.severity,
      affectedSpotIds: values.affectedSpotIds ?? [], affectedRouteIds: values.affectedRouteIds ?? [],
      validFrom: values.validity[0].format('YYYY-MM-DDTHH:mm:ss'),
      validUntil: values.validity[1].format('YYYY-MM-DDTHH:mm:ss'), routePolicy: values.routePolicy,
      knowledgeQuestion: values.knowledgeQuestion?.trim() || null,
      knowledgeAnswer: values.knowledgeAnswer?.trim() || null
    }
    setSaving(true)
    try {
      if (editing) await updateEmergency(editing.id, payload)
      else await createEmergency(payload)
      message.success(editing ? '事件已更新' : '草稿已创建')
      setOpen(false)
      await load()
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const act = async (id: string, action: 'publish' | 'resolve' | 'retry') => {
    setActingId(id)
    try {
      if (action === 'publish') await publishEmergency(id)
      if (action === 'resolve') await resolveEmergency(id)
      if (action === 'retry') await retryEmergencyKnowledgeSync(id)
      message.success(action === 'publish' ? '事件已发布' : action === 'resolve' ? '事件已解除' : '已重试知识库同步')
      await load()
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : '操作失败')
    } finally {
      setActingId('')
    }
  }

  const columns: ColumnsType<EmergencyEvent> = [
    {
      title: '事件', dataIndex: 'title', width: 260,
      render: (_, event) => <div><Text strong style={{ color: palette.text }}>{event.title}</Text><br /><Text style={{ color: palette.muted, fontSize: 12 }}>{typeLabel(event.type)}</Text></div>
    },
    {
      title: '等级', dataIndex: 'severity', width: 90,
      render: value => <Tag color={value === 'CRITICAL' ? 'red' : value === 'WARNING' ? 'orange' : 'blue'}>{value}</Tag>
    },
    {
      title: '状态', width: 110,
      render: (_, event) => {
        const status = effectiveStatus(event)
        return <Tag color={status === 'ACTIVE' ? 'green' : status === 'DRAFT' ? 'default' : status === 'EXPIRED' ? 'orange' : 'blue'}>{status}</Tag>
      }
    },
    {
      title: '有效期', width: 205,
      render: (_, event) => <Text style={{ color: palette.muted, fontSize: 12 }}>{dayjs(event.validFrom).format('MM-DD HH:mm')} → {dayjs(event.validUntil).format('MM-DD HH:mm')}</Text>
    },
    {
      title: '路线策略', dataIndex: 'routePolicy', width: 120,
      render: value => <Tag color={value === 'EXCLUDE' ? 'red' : value === 'PENALIZE' ? 'gold' : 'default'}>{value}</Tag>
    },
    {
      title: '知识库', width: 120,
      render: (_, event) => <Tag color={event.kbSyncStatus === 'SYNCED' ? 'green' : event.kbSyncStatus === 'FAILED' ? 'red' : 'orange'}>{event.kbSyncStatus ?? 'PENDING'}</Tag>
    },
    {
      title: '操作', fixed: 'right', width: 300,
      render: (_, event) => (
        <Space size={4} wrap>
          {event.status !== 'RESOLVED' && <Button size="small" icon={<EditOutlined />} onClick={() => showEdit(event)}>编辑</Button>}
          {event.status === 'DRAFT' && <Popconfirm title="发布后游客端、路线和知识库将立即联动，确认发布？" onConfirm={() => void act(event.id, 'publish')}><Button size="small" type="primary" loading={actingId === event.id}>发布</Button></Popconfirm>}
          {event.status === 'ACTIVE' && <Popconfirm title="确认事件已处置完毕并解除？" onConfirm={() => void act(event.id, 'resolve')}><Button size="small" danger loading={actingId === event.id}>解除</Button></Popconfirm>}
          {event.kbSyncStatus === 'FAILED' && <Button size="small" icon={<SyncOutlined />} loading={actingId === event.id} onClick={() => void act(event.id, 'retry')}>重试知识库同步</Button>}
        </Space>
      )
    }
  ]

  const requiresConfirmedKnowledge = selectedType === 'MISSING_PERSON' || selectedType === 'MEDICAL_HELP'
  const activeEvent = events.find((event) => effectiveStatus(event) === 'ACTIVE')

  useAdminOpsPageActions({
    refreshedAt,
    refreshing: loading,
    onRefresh: load,
  })

  return (
      <main className="admin-page admin-ops-emergency">
        <header className="admin-ops-page-intro">
          <div>
            <Text className="admin-ops-page-intro__eyebrow">应急事件协同处置</Text>
            <Title level={2}>应急事件协同中心</Title>
            <Paragraph className="admin-ops-page-intro__description">一次发布，联动临时知识、路线约束、游客提醒、数字人播报与 NBA 待办。</Paragraph>
          </div>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={showCreate}>新建应急事件</Button>
          </Space>
        </header>

        {error && <Alert showIcon type="error" message={error} style={{ marginBottom: 16 }} />}
        {activeEvent && (
          <Card className="admin-ops-emergency__spotlight" bordered={false}>
            <div>
              <Text className="admin-ops-page-intro__eyebrow">当前生效事件</Text>
              <Title level={4}>{activeEvent.title}</Title>
              <Paragraph>{activeEvent.message}</Paragraph>
            </div>
            <div className="admin-ops-emergency__spotlight-meta">
              <Tag color={activeEvent.severity === 'CRITICAL' ? 'red' : 'orange'}>{activeEvent.severity}</Tag>
              <span>{dayjs(activeEvent.validUntil).format('MM-DD HH:mm')} 前有效</span>
            </div>
          </Card>
        )}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card style={{ borderColor: palette.border, background: palette.panel }}><Statistic title="生效中" value={stats.active} valueStyle={{ color: '#61d878' }} /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderColor: palette.border, background: palette.panel }}><Statistic title="紧急事件" value={stats.critical} valueStyle={{ color: palette.red }} /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderColor: palette.border, background: palette.panel }}><Statistic title="待发布草稿" value={stats.draft} valueStyle={{ color: palette.gold }} /></Card></Col>
          <Col xs={12} md={6}><Card style={{ borderColor: palette.border, background: palette.panel }}><Statistic title="知识同步异常" value={stats.syncFailed} valueStyle={{ color: stats.syncFailed ? palette.red : palette.cyan }} /></Card></Col>
        </Row>

        <Card bordered={false} style={{ border: `1px solid ${palette.border}`, background: palette.panel }} bodyStyle={{ padding: 0 }}>
          <Table rowKey="id" columns={columns} dataSource={events} loading={loading} scroll={{ x: 1180 }} pagination={{ pageSize: 10, showSizeChanger: false }} />
        </Card>

        <Drawer title={editing ? '编辑应急事件' : '新建应急事件'} width={560} open={open} destroyOnClose onClose={() => setOpen(false)} extra={<SafetyCertificateOutlined style={{ color: palette.gold }} />}>
          <Form form={form} layout="vertical" onFinish={save} requiredMark="optional">
            <Form.Item name="type" label="事件类型" rules={[{ required: true }]}><Select options={EVENT_TYPES} /></Form.Item>
            <Form.Item name="title" label="事件标题" rules={[{ required: true, message: '请输入标题' }, { max: 200 }]}><Input placeholder="例如：菩提大道临时封闭" /></Form.Item>
            <Form.Item name="message" label="游客端提醒与数字人播报内容" rules={[{ required: true, message: '请输入已确认的提醒内容' }]}><Input.TextArea rows={4} placeholder="只填写已经确认的事实与处置指引" /></Form.Item>
            <Row gutter={12}>
              <Col span={12}><Form.Item name="severity" label="严重等级" rules={[{ required: true }]}><Select options={[{ value: 'INFO' }, { value: 'WARNING' }, { value: 'CRITICAL' }]} /></Form.Item></Col>
              <Col span={12}><Form.Item name="routePolicy" label="路线策略" rules={[{ required: true }]}><Select options={[{ value: 'NONE', label: '不调整' }, { value: 'PENALIZE', label: '降低优先级' }, { value: 'EXCLUDE', label: '移除受影响站点/路线' }]} /></Form.Item></Col>
            </Row>
            <Form.Item name="validity" label="生效时间" rules={[{ required: true, message: '请选择有效期' }]}><RangePicker showTime style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="affectedSpotIds" label="受影响景点"><Select mode="multiple" allowClear options={SPOTS} placeholder="不选表示全景区提醒" /></Form.Item>
            <Form.Item name="affectedRouteIds" label="受影响路线"><Select mode="multiple" allowClear options={ROUTES} /></Form.Item>
            {requiresConfirmedKnowledge && <Alert showIcon icon={<AlertOutlined />} type="warning" message="走失或医疗信息必须由管理员确认" description="系统不会让大模型改写或补全人名、伤情、位置和联系方式。以下问答会作为临时知识同步到 RAG。" style={{ marginBottom: 16 }} />}
            <Form.Item name="knowledgeQuestion" label="临时知识问题" rules={requiresConfirmedKnowledge ? [{ required: true, message: '请填写管理员确认的问题' }] : []}><Input placeholder="例如：遇到医疗求助应联系哪里？" /></Form.Item>
            <Form.Item name="knowledgeAnswer" label="管理员确认的处置答案" rules={requiresConfirmedKnowledge ? [{ required: true, message: '请填写管理员确认的答案' }] : []}><Input.TextArea rows={4} /></Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button onClick={() => setOpen(false)}>取消</Button><Button type="primary" htmlType="submit" loading={saving}>{editing ? '保存修改' : '创建草稿'}</Button></Space>
          </Form>
        </Drawer>
      </main>
  )
}

export default AdminEmergencyPage
