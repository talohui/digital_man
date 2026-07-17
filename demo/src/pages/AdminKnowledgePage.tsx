import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload
} from 'antd'
import {
  CloudUploadOutlined,
  CheckCircleFilled,
  DatabaseOutlined,
  FileTextOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  createFaq,
  deleteFaq,
  fetchFaqList,
  fetchKbStats,
  updateFaq,
  uploadKbDocument,
  type FaqItem,
  type KbStats,
  type UploadResult
} from '../api/kb'
import { describeUploadOperation, summarizeUploadQuality } from '../lib/kbUploadQuality'

const { Title, Text } = Typography

const palette = {
  bg: '#f5f1e8',
  gold: '#a87c34',
  text: '#263730',
  muted: '#728078',
  cyan: '#2f766c',
  green: '#3f7d5b',
  red: '#a34a3f',
  border: '#ddd4c4'
}

type QualityLevel = 'error' | 'warning' | 'info' | 'success'
type QualityFixMode =
  | 'upload'
  | 'faq-create'
  | 'faq-short'
  | 'faq-long'
  | 'faq-tags'
  | 'faq-duplicate'
  | 'config'
  | 'service'

type QualityIssue = {
  level: QualityLevel
  title: string
  detail: string
  action: string
  fixMode: QualityFixMode
}

type QualityReport = {
  label: string
  color: string
  issues: QualityIssue[]
}

const REQUIRED_TOPICS = [
  { label: '门票价格', keywords: ['门票', '票价', '学生票', '儿童', '老人票'] },
  { label: '路线推荐', keywords: ['路线', '游览', '怎么走', '亲子', '历史文化'] },
  { label: '演出时间', keywords: ['演出', '几点', '时间', '吉祥颂', '九龙灌浴'] },
  { label: '交通停车', keywords: ['交通', '停车', '观光车', '自驾'] },
  { label: '核心景点', keywords: ['灵山大佛', '梵宫', '五印坛城', '祥符禅寺'] }
]
const SHORT_ANSWER_MIN_LENGTH = 10

function normalizeQuestion(text: string) {
  return text
    .toLowerCase()
    .replace(/[，。！？、,.!?：:；;“”"'（）()【】\[\]\s]/g, '')
    .replace(/^(请问|想问|问一下|麻烦问下)/, '')
}

function getFaqQualityTags(item: FaqItem) {
  const tags: Array<{ label: string; color: string }> = []
  const question = item.question.trim()
  const answer = item.answer.trim()

  if (question.length < 4) tags.push({ label: '问题过短', color: 'orange' })
  if (answer.length < SHORT_ANSWER_MIN_LENGTH) tags.push({ label: '回答偏短', color: 'orange' })
  if (answer.length > 280) tags.push({ label: '口播偏长', color: 'blue' })
  if (!item.tags?.length) tags.push({ label: '缺标签', color: 'gold' })

  return tags.length ? tags : [{ label: '正常', color: 'green' }]
}

function buildQualityReport(stats: KbStats | null, faqs: FaqItem[]): QualityReport {
  if (!stats) {
    return {
      label: '待检测',
      color: 'default',
      issues: [{
        level: 'info',
        title: '等待知识库服务返回',
        detail: '连接成功后会自动检测文档、切片、FAQ 与覆盖主题。',
        action: '确认 5011 知识库服务已启动。',
        fixMode: 'service'
      }]
    }
  }

  const issues: QualityIssue[] = []
  const documents = stats.documents ?? []
  const unclassifiedDocs = documents.filter((doc) => !doc.category?.trim())
  const avgChunksPerDoc = stats.documentCount > 0 ? stats.chunkCount / stats.documentCount : 0
  const noTagFaqs = faqs.filter((faq) => !faq.tags?.length)
  const shortAnswerFaqs = faqs.filter((faq) => faq.answer.trim().length > 0 && faq.answer.trim().length < SHORT_ANSWER_MIN_LENGTH)
  const longAnswerFaqs = faqs.filter((faq) => faq.answer.trim().length > 280)
  const questionGroups = new Map<string, number>()

  faqs.forEach((faq) => {
    const key = normalizeQuestion(faq.question)
    if (key) questionGroups.set(key, (questionGroups.get(key) ?? 0) + 1)
  })
  const duplicateQuestionCount = Array.from(questionGroups.values()).filter((count) => count > 1).length

  if (stats.documentCount <= 0) {
    issues.push({
      level: 'error',
      title: '还没有入库文档',
      detail: '向量检索缺少基础资料，数字人只能依赖 FAQ 或大模型常识。',
      action: '先上传景区介绍、景点结构化资料或运营手册。',
      fixMode: 'upload'
    })
  }

  if (stats.chunkCount <= 0) {
    issues.push({
      level: 'error',
      title: '切片数为 0',
      detail: '文档没有成功切块或写入向量库，RAG 召回不可用。',
      action: '重新上传文档，检查解析日志和向量库写入状态。',
      fixMode: 'upload'
    })
  } else if (stats.documentCount > 0 && avgChunksPerDoc < 8) {
    issues.push({
      level: 'warning',
      title: '文档切片偏少',
      detail: `当前平均每份文档约 ${avgChunksPerDoc.toFixed(1)} 个切片，可能覆盖不够细。`,
      action: '优先补充结构化景点资料，或检查文档是否只解析到摘要。',
      fixMode: 'upload'
    })
  }

  if (unclassifiedDocs.length > 0) {
    issues.push({
      level: 'warning',
      title: `${unclassifiedDocs.length} 份文档未分类`,
      detail: '未分类文档后续检索、维护和排查会更难定位。',
      action: '上传时填写“灵山大佛 / 梵宫 / 交通服务”等分类。',
      fixMode: 'upload'
    })
  }

  if (!stats.collection?.trim() || !stats.embedModel?.trim()) {
    issues.push({
      level: 'warning',
      title: '向量库配置不完整',
      detail: 'collection 或 embedding 模型名缺失，不利于部署排查。',
      action: '检查知识库服务 /kb/stats 是否返回 collection 与 embedModel。',
      fixMode: 'config'
    })
  }

  if (faqs.length < 30) {
    issues.push({
      level: 'warning',
      title: 'FAQ 覆盖偏少',
      detail: `当前 FAQ 共 ${faqs.length} 条，硬事实与高频问法兜底可能不足。`,
      action: '优先补门票、演出时间、路线、交通、核心景点参数。',
      fixMode: 'faq-create'
    })
  }

  if (noTagFaqs.length > 0) {
    issues.push({
      level: 'warning',
      title: `${noTagFaqs.length} 条 FAQ 缺少标签`,
      detail: '缺标签会影响后续维护、检索归类和批量排查。',
      action: '给 FAQ 添加景点名、主题或“硬事实”等标签。',
      fixMode: 'faq-tags'
    })
  }

  if (shortAnswerFaqs.length > 0) {
    issues.push({
      level: 'info',
      title: `${shortAnswerFaqs.length} 条回答偏短`,
      detail: '过短回答可能缺少背景解释，数字人口播会显得生硬。',
      action: '为关键问题补一句上下文或游客行动建议。',
      fixMode: 'faq-short'
    })
  }

  if (longAnswerFaqs.length > 0) {
    issues.push({
      level: 'info',
      title: `${longAnswerFaqs.length} 条回答口播偏长`,
      detail: '过长回答会让数字人首轮播报拖沓，影响游客等待感。',
      action: '拆成“简短答复 + 追问展开”，或压缩到 1-2 段。',
      fixMode: 'faq-long'
    })
  }

  if (duplicateQuestionCount > 0) {
    issues.push({
      level: 'info',
      title: `${duplicateQuestionCount} 组 FAQ 问法重复`,
      detail: '完全重复的问题会增加维护成本，答案不一致时也更难排查。',
      action: '保留一条标准问法，把其他问法并入标签或相似问法库。',
      fixMode: 'faq-duplicate'
    })
  }

  const corpus = [
    ...faqs.map((faq) => `${faq.question} ${faq.answer} ${(faq.tags ?? []).join(' ')}`),
    ...documents.map((doc) => `${doc.name} ${doc.category}`)
  ].join(' ')
  const missingTopics = REQUIRED_TOPICS.filter((topic) => !topic.keywords.some((keyword) => corpus.includes(keyword)))
  if (missingTopics.length > 0) {
    issues.push({
      level: 'warning',
      title: `缺少 ${missingTopics.length} 类高频主题`,
      detail: `未检测到：${missingTopics.map((item) => item.label).join('、')}。`,
      action: '补齐游客最常问的硬事实主题，避免 RAG 兜底不足。',
      fixMode: 'faq-create'
    })
  }

  const hasError = issues.some((issue) => issue.level === 'error')
  const hasWarning = issues.some((issue) => issue.level === 'warning')

  return {
    label: hasError ? '需处理' : hasWarning ? '可优化' : '健康',
    color: hasError ? 'error' : hasWarning ? 'warning' : 'success',
    issues
  }
}

function getIssueFaqMatches(issue: QualityIssue | null, faqs: FaqItem[]) {
  if (!issue) return []

  if (issue.fixMode === 'faq-short') {
    return faqs.filter((faq) => faq.answer.trim().length > 0 && faq.answer.trim().length < SHORT_ANSWER_MIN_LENGTH)
  }

  if (issue.fixMode === 'faq-long') {
    return faqs.filter((faq) => faq.answer.trim().length > 280)
  }

  if (issue.fixMode === 'faq-tags') {
    return faqs.filter((faq) => !faq.tags?.length)
  }

  if (issue.fixMode === 'faq-duplicate') {
    const groups = new Map<string, number>()
    faqs.forEach((faq) => {
      const key = normalizeQuestion(faq.question)
      if (key) groups.set(key, (groups.get(key) ?? 0) + 1)
    })
    return faqs.filter((faq) => (groups.get(normalizeQuestion(faq.question)) ?? 0) > 1)
  }

  return []
}

function KnowledgeInner() {
  const { message } = App.useApp()
  const [stats, setStats] = useState<KbStats | null>(null)
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeIssue, setActiveIssue] = useState<QualityIssue | null>(null)
  const [form] = Form.useForm()
  const qualityReport = useMemo(() => buildQualityReport(stats, faqs), [stats, faqs])
  const qualityIssueSummary = useMemo(() => ({
    error: qualityReport.issues.filter((issue) => issue.level === 'error').length,
    warning: qualityReport.issues.filter((issue) => issue.level === 'warning').length,
    info: qualityReport.issues.filter((issue) => issue.level === 'info').length
  }), [qualityReport.issues])
  const activeIssueFaqs = useMemo(() => getIssueFaqMatches(activeIssue, faqs), [activeIssue, faqs])
  const uploadSummary = useMemo(
    () => uploadResult ? summarizeUploadQuality(uploadResult.quality) : null,
    [uploadResult]
  )

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
        message.success(`「${res.docName}」${describeUploadOperation(res.operation)}${catTip}`)
        setUploadResult(res)
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

  const openCreateFromIssue = () => {
    setActiveIssue(null)
    openCreate()
  }

  const openEditFromIssue = (item: FaqItem) => {
    setActiveIssue(null)
    openEdit(item)
  }

  const scrollToUpload = () => {
    setActiveIssue(null)
    window.setTimeout(() => {
      document.getElementById('kb-upload-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
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
      title: '质检',
      key: 'quality',
      width: 190,
      render: (_: unknown, item: FaqItem) => (
        <>
          {getFaqQualityTags(item).map((tag) => (
            <Tag key={tag.label} color={tag.color}>{tag.label}</Tag>
          ))}
        </>
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
    <main className="admin-page admin-ops-knowledge">
      <header className="admin-ops-page-intro">
        <div>
          <Text className="admin-ops-page-intro__eyebrow">知识库内容治理</Text>
          <Title level={2}>灵山知识库管理</Title>
          <Text className="admin-ops-page-intro__description">上传景区资料自动入库，在线质检并编辑 FAQ，发布后立即进入真实检索链路。</Text>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>刷新</Button>
        </div>
      </header>

      {serviceError ? (
        <Card style={{ marginBottom: 16, borderColor: '#c5505a', background: 'rgba(197,80,90,0.1)' }}>
          <Text style={{ color: palette.red }}>
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

      <Card
        title="知识库自动质检"
        extra={<Tag color={qualityReport.color}>{qualityReport.label}</Tag>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>检测结论</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={qualityReport.color} style={{ fontSize: 16, padding: '4px 12px' }}>{qualityReport.label}</Tag>
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 14, color: palette.text }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: palette.muted }}>风险项</span>
                <span style={{ color: qualityIssueSummary.error ? palette.red : palette.muted }}>{qualityIssueSummary.error}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: palette.muted }}>注意项</span>
                <span style={{ color: qualityIssueSummary.warning ? palette.gold : palette.muted }}>{qualityIssueSummary.warning}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: palette.muted }}>建议项</span>
                <span style={{ color: qualityIssueSummary.info ? palette.cyan : palette.muted }}>{qualityIssueSummary.info}</span>
              </div>
            </div>
            <div style={{ color: palette.muted, fontSize: 12, marginTop: 8 }}>
              基于文档、切片、FAQ、标签和高频主题自动检测
            </div>
          </Col>
          <Col xs={24} md={18}>
            {qualityReport.issues.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {qualityReport.issues.map((issue) => (
                  <div
                    key={`${issue.title}-${issue.detail}`}
                    style={{
                      border: `1px solid ${issue.level === 'error' ? 'rgba(255,120,117,0.45)' : issue.level === 'warning' ? 'rgba(212,175,55,0.45)' : palette.border}`,
                      borderRadius: 8,
                      padding: 12,
                      background: issue.level === 'error'
                        ? 'rgba(255,120,117,0.08)'
                        : issue.level === 'warning'
                          ? 'rgba(212,175,55,0.08)'
                          : 'rgba(57,208,216,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Tag color={issue.level === 'error' ? 'error' : issue.level === 'warning' ? 'warning' : 'blue'}>
                        {issue.level === 'error' ? '风险' : issue.level === 'warning' ? '注意' : '建议'}
                      </Tag>
                      <Text strong style={{ color: palette.text }}>{issue.title}</Text>
                    </div>
                    <div style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>{issue.detail}</div>
                    <div style={{ color: palette.cyan, fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{issue.action}</div>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      style={{ marginTop: 10 }}
                      onClick={() => setActiveIssue(issue)}
                    >
                      处理
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: palette.green, fontSize: 15 }}>当前知识库结构健康，暂未发现需要处理的问题。</div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 上传（B1.1 + B1.3 + B1.2 分类打标签） */}
      <Card id="kb-upload-card" title="上传景区资料（PDF / Word / TXT / Markdown）" style={{ marginBottom: 16 }}>
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
        title="知识库入库验收"
        open={Boolean(uploadResult)}
        onCancel={() => setUploadResult(null)}
        footer={<Button type="primary" onClick={() => setUploadResult(null)}>完成</Button>}
        width={680}
        destroyOnClose
      >
        {uploadResult && uploadSummary ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <CheckCircleFilled style={{ color: palette.green, fontSize: 34, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text strong style={{ color: palette.text, fontSize: 18 }}>{uploadResult.docName}</Text>
                  <Tag color={uploadResult.operation === 'unchanged' ? 'default' : 'green'}>
                    {describeUploadOperation(uploadResult.operation)}
                  </Tag>
                </div>
                <div style={{ color: palette.green, marginTop: 6, fontWeight: 600 }}>
                  {uploadSummary.retrievalLabel}
                </div>
                <div style={{ color: palette.muted, marginTop: 3, fontSize: 13 }}>
                  文件已完成解析、切块、向量写入和检索验证，可供数字人下一次问答使用。
                </div>
              </div>
            </div>

            <Divider style={{ margin: 0, borderColor: palette.border }} />

            <Row gutter={[12, 12]}>
              {[
                ['有效结构', uploadSummary.structureLabel],
                ['知识切片', `${uploadResult.quality.chunkCount} 个`],
                ['检索烟测', uploadSummary.probeLabel],
                ['资料分类', uploadResult.category || '未分类']
              ].map(([label, value]) => (
                <Col xs={24} sm={12} key={label}>
                  <div style={{ borderLeft: `3px solid ${palette.cyan}`, padding: '4px 0 4px 12' }}>
                    <div style={{ color: palette.muted, fontSize: 12 }}>{label}</div>
                    <div style={{ color: palette.text, marginTop: 3, lineHeight: 1.5 }}>{value}</div>
                  </div>
                </Col>
              ))}
            </Row>

            {uploadResult.quality.topics.length || uploadResult.quality.spots.length ? (
              <div>
                <Text style={{ color: palette.muted, fontSize: 12 }}>自动识别</Text>
                <div style={{ marginTop: 7 }}>
                  {uploadResult.quality.spots.map((spot) => <Tag color="gold" key={`spot-${spot}`}>{spot}</Tag>)}
                  {uploadResult.quality.topics.map((topic) => <Tag color="cyan" key={`topic-${topic}`}>{topic}</Tag>)}
                </div>
              </div>
            ) : null}

            {uploadResult.quality.retrieval.probes.length ? (
              <div>
                <Text style={{ color: palette.muted, fontSize: 12 }}>检索探针</Text>
                <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                  {uploadResult.quality.retrieval.probes.map((probe) => (
                    <div key={probe.query} style={{ display: 'flex', alignItems: 'center', gap: 8, color: palette.text }}>
                      <CheckCircleFilled style={{ color: probe.matched ? palette.green : palette.muted }} />
                      <span>{probe.query}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {uploadResult.quality.warnings.length ? (
              <div style={{ borderLeft: `3px solid ${palette.gold}`, paddingLeft: 12 }}>
                <Text style={{ color: palette.gold }}>可优化提示</Text>
                {uploadResult.quality.warnings.map((warning) => (
                  <div key={warning} style={{ color: palette.muted, marginTop: 4 }}>{warning}</div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

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
          <Form.Item name="question" label="问题" rules={[{ required: true, message: '请输入问题' }, { min: 4, message: '问题至少 4 个字，方便后续检索和维护' }]}>
            <Input placeholder="例如：灵山大佛有多高？" />
          </Form.Item>
          <Form.Item name="answer" label="回答" rules={[{ required: true, message: '请输入回答' }, { min: SHORT_ANSWER_MIN_LENGTH, message: `回答建议至少 ${SHORT_ANSWER_MIN_LENGTH} 个字，避免数字人口播过于生硬` }]}>
            <Input.TextArea rows={5} placeholder="标准答复，数字人将原样回答" />
          </Form.Item>
          <Form.Item name="tags" label="标签（用逗号分隔，可选）">
            <Input placeholder="灵山大佛，参数" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={activeIssue ? `处理：${activeIssue.title}` : '处理质检问题'}
        open={Boolean(activeIssue)}
        onCancel={() => setActiveIssue(null)}
        footer={null}
        destroyOnClose
      >
        {activeIssue ? (
          <div style={{ display: 'grid', gap: 14 }}>
            <div
              style={{
                border: `1px solid ${activeIssue.level === 'error' ? 'rgba(255,120,117,0.45)' : activeIssue.level === 'warning' ? 'rgba(212,175,55,0.45)' : palette.border}`,
                borderRadius: 8,
                padding: 12,
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ color: palette.text, fontWeight: 700, marginBottom: 6 }}>{activeIssue.detail}</div>
              <div style={{ color: palette.cyan, lineHeight: 1.6 }}>{activeIssue.action}</div>
            </div>

            {activeIssue.fixMode === 'upload' ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <Text style={{ color: palette.muted }}>
                  文档类问题通过“重新上传资料 + 填写分类”处理。上传时间由知识库服务自动记录，管理员不用手动填写。
                </Text>
                <Button type="primary" onClick={scrollToUpload}>去上传资料</Button>
              </div>
            ) : null}

            {activeIssue.fixMode === 'faq-create' ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <Text style={{ color: palette.muted }}>
                  建议新增一条标准 FAQ，覆盖游客高频问法。保存后数字人下一次问答即可读取。
                </Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateFromIssue}>新增 FAQ</Button>
              </div>
            ) : null}

            {['faq-short', 'faq-long', 'faq-tags', 'faq-duplicate'].includes(activeIssue.fixMode) ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <Text style={{ color: palette.muted }}>
                  下面是本次质检命中的 FAQ，点“编辑”即可在原编辑窗口里修改问题、回答或标签。
                </Text>
                {activeIssueFaqs.length ? activeIssueFaqs.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                      border: `1px solid ${palette.border}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: 'rgba(57,208,216,0.04)'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.question}
                      </div>
                      <div style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>
                        {getFaqQualityTags(item).map((tag) => tag.label).join(' / ')}
                      </div>
                    </div>
                    <Button size="small" onClick={() => openEditFromIssue(item)}>编辑</Button>
                  </div>
                )) : (
                  <Text style={{ color: palette.green }}>当前没有需要逐条编辑的 FAQ。</Text>
                )}
              </div>
            ) : null}

            {activeIssue.fixMode === 'config' ? (
              <Text style={{ color: palette.muted }}>
                这是服务配置问题，需要检查知识库服务返回的 collection 与 embedding 模型字段；前端不直接修改服务配置。
              </Text>
            ) : null}

            {activeIssue.fixMode === 'service' ? (
              <Text style={{ color: palette.muted }}>
                请先启动 5011 知识库服务；服务恢复后点击页面右上角“刷新”。
              </Text>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </main>
  )
}

function AdminKnowledgePage() {
  return (
    <App>
      <KnowledgeInner />
    </App>
  )
}

export default AdminKnowledgePage
