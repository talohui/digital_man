import {
  App,
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
  theme
} from 'antd'
import {
  CloudUploadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createFaq,
  deleteFaq,
  fetchFaqList,
  fetchKbStats,
  updateFaq,
  uploadKbDocument,
  type FaqItem,
  type KbStats
} from '../api/kb'

const { Title, Text } = Typography

const palette = {
  bg: '#0a1626',
  gold: '#d4af37',
  text: '#e8eef6',
  muted: '#8aa0b6',
  cyan: '#39d0d8'
}

function KnowledgeInner() {
  const { message } = App.useApp()
  const [stats, setStats] = useState<KbStats | null>(null)
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const refresh = async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([fetchKbStats(), fetchFaqList()])
      setStats(s)
      setFaqs(f)
      setServiceError(null)
    } catch (err) {
      setServiceError(
        err instanceof Error ? err.message : '无法连接知识库服务（默认 5011 端口）'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: '.pdf,.doc,.docx,.txt,.md,.markdown',
    beforeUpload: async (file) => {
      setUploading(true)
      try {
        const res = await uploadKbDocument(file as File, uploadCategory)
        const catTip = uploadCategory.trim() ? `（分类：${uploadCategory.trim()}）` : ''
        message.success(`「${res.docName}」已入库${catTip}，新增 ${res.chunkCount} 个切片`)
        setStats(res.stats)
        await refresh()
      } catch (err) {
        message.error(err instanceof Error ? err.message : '上传失败')
      } finally {
        setUploading(false)
      }
      return Upload.LIST_IGNORE
    }
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: FaqItem) => {
    setEditing(item)
    form.setFieldsValue({
      question: item.question,
      answer: item.answer,
      tags: (item.tags || []).join('，')
    })
    setModalOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    const tags = String(values.tags || '')
      .split(/[，,]/)
      .map((t: string) => t.trim())
      .filter(Boolean)
    setSaving(true)
    try {
      if (editing) {
        await updateFaq(editing.id, { question: values.question, answer: values.answer, tags })
        message.success('FAQ 已更新，数字人下一次问答即生效')
      } else {
        await createFaq({ question: values.question, answer: values.answer, tags })
        message.success('FAQ 已新增，数字人下一次问答即生效')
      }
      setModalOpen(false)
      await refresh()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (item: FaqItem) => {
    try {
      await deleteFaq(item.id)
      message.success('已删除')
      await refresh()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const faqColumns = [
    { title: '问题', dataIndex: 'question', key: 'question', width: '34%' },
    { title: '回答', dataIndex: 'answer', key: 'answer', ellipsis: true },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[] = []) => (
        <>{tags.map((t) => <Tag key={t} color="gold">{t}</Tag>)}</>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, item: FaqItem) => (
        <>
          <Button type="link" size="small" onClick={() => openEdit(item)}>编辑</Button>
          <Popconfirm title="确定删除该 FAQ？" onConfirm={() => onDelete(item)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

  return (
    <main style={{ minHeight: '100vh', background: `radial-gradient(circle at top left, #143055 0, ${palette.bg} 40%, #050b14 100%)`, color: palette.text, padding: 22 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <Text style={{ color: palette.gold, fontWeight: 700 }}>KNOWLEDGE BASE</Text>
          <Title level={2} style={{ color: palette.text, margin: '4px 0 0', fontSize: 28 }}>灵山知识库管理</Title>
          <Text style={{ color: palette.muted }}>上传景区资料自动入库 · 在线编辑 FAQ 立即生效</Text>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>刷新</Button>
          <Link to="/admin"><Button>返回驾驶舱</Button></Link>
        </div>
      </header>

      {serviceError ? (
        <Card style={{ marginBottom: 16, borderColor: '#c5505a', background: 'rgba(197,80,90,0.1)' }}>
          <Text style={{ color: '#ff9aa2' }}>
            知识库服务未连接：{serviceError}。请在 lingshan-rag 目录运行 <code>python kb_server/app.py</code>（默认 5011 端口）。
          </Text>
        </Card>
      ) : null}

      {/* 统计（B1.6 顺带展示） */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card><Statistic title="文档数" value={stats?.documentCount ?? 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="切片数" value={stats?.chunkCount ?? 0} prefix={<DatabaseOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="FAQ 条数" value={stats?.faqCount ?? 0} prefix={<QuestionCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Text style={{ color: palette.muted, fontSize: 13 }}>最后更新</Text>
            <div style={{ color: palette.cyan, marginTop: 6, fontSize: 14 }}>
              {stats?.lastDocUpdatedAt || stats?.faqUpdatedAt || '—'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 上传（B1.1 + B1.3 + B1.2 分类打标签） */}
      <Card title="上传景区资料（PDF / Word / TXT / Markdown）" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: palette.muted, fontSize: 13 }}>景点 / 主题分类（可选，将随文档一起入库便于归类检索）</Text>
          <Input
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value.slice(0, 40))}
            placeholder="例如：灵山大佛 / 梵宫 / 交通服务 / 历史文化"
            allowClear
            maxLength={40}
            style={{ marginTop: 6, maxWidth: 420 }}
          />
        </div>
        <Upload.Dragger {...uploadProps} disabled={uploading}>
          <p style={{ fontSize: 40, color: palette.gold, margin: 0 }}><CloudUploadOutlined /></p>
          <p style={{ color: palette.text, fontSize: 16 }}>
            {uploading ? '正在解析并写入向量库…' : '点击或拖拽文件到此处上传'}
          </p>
          <p style={{ color: palette.muted }}>
            上传后自动完成「切块 → 向量化 → 写入知识库」，数字人随即可检索到新内容。单文件 ≤ 20MB。
          </p>
        </Upload.Dragger>
      </Card>

      {/* 已入库文档列表（B1.2 分类 / B1.6 统计） */}
      <Card title="已入库文档" style={{ marginBottom: 16 }}>
        <Table
          rowKey="name"
          size="middle"
          loading={loading}
          dataSource={stats?.documents ?? []}
          pagination={false}
          locale={{ emptyText: '暂无已入库文档' }}
          columns={[
            { title: '文档', dataIndex: 'name', key: 'name', ellipsis: true },
            {
              title: '分类',
              dataIndex: 'category',
              key: 'category',
              width: 180,
              render: (c: string) =>
                c ? <Tag color="cyan">{c}</Tag> : <Text style={{ color: palette.muted }}>未分类</Text>
            },
            { title: '切片数', dataIndex: 'chunkCount', key: 'chunkCount', width: 100 },
            {
              title: '上传时间',
              dataIndex: 'uploadedAt',
              key: 'uploadedAt',
              width: 180,
              render: (t: string) => <Text style={{ color: palette.muted }}>{t || '—'}</Text>
            }
          ]}
        />
      </Card>

      {/* FAQ 在线编辑（B1.4） */}
      <Card
        title="FAQ 管理（在线编辑，立即生效）"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增 FAQ</Button>}
      >
        <Table
          rowKey="id"
          size="middle"
          loading={loading}
          dataSource={faqs}
          columns={faqColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editing ? '编辑 FAQ' : '新增 FAQ'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="question" label="问题" rules={[{ required: true, message: '请输入问题' }]}>
            <Input placeholder="例如：灵山大佛有多高？" />
          </Form.Item>
          <Form.Item name="answer" label="回答" rules={[{ required: true, message: '请输入回答' }]}>
            <Input.TextArea rows={5} placeholder="标准答复，数字人将原样回答" />
          </Form.Item>
          <Form.Item name="tags" label="标签（用逗号分隔，可选）">
            <Input placeholder="灵山大佛，参数" />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

function AdminKnowledgePage() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: palette.gold } }}>
      <App>
        <KnowledgeInner />
      </App>
    </ConfigProvider>
  )
}

export default AdminKnowledgePage
