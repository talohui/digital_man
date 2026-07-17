import {
  BulbOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LockOutlined,
  EditOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, Modal, Space, Tag, Typography, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  confirmOperationsCopilotProposal,
  discardOperationsCopilotProposal,
  queryOperationsCopilot,
  updateOperationsCopilotProposal,
  type OperationsCopilotProposalUpdate,
  type OperationsCopilotResponse,
} from '../../api/operationsCopilot'
import { loginServiceConfig } from '../../api/serviceConfig'
import { isConfirmableProposal } from '../../lib/operationsCopilotProposal'
import {
  clearOperationsCopilotSession,
  createOperationsCopilotSession,
  readOperationsCopilotSession,
  saveOperationsCopilotSession,
  type OperationsCopilotSession,
} from '../../lib/operationsCopilotSession'
import { getAdminPageHeading } from '../admin-ops/adminOpsNavigation'
import { GuideVoiceButton } from '../guide/GuideVoiceButton'
import OperationsCopilotExecutionResult from './OperationsCopilotExecutionResult'
import OperationsCopilotProposalEditor from './OperationsCopilotProposalEditor'

const { Paragraph, Text } = Typography

const promptStarters = [
  '结合全局数据，今天应优先处理什么？',
  '客流和消费数据有什么可执行机会？',
  '帮我起草一条入口拥堵应急提醒',
]

const proposalLabels: Record<string, string> = {
  EMERGENCY_DRAFT: '应急发布草案',
  KB_CREATE: '新增知识草案',
  KB_UPDATE: '更新知识草案',
  KB_DEACTIVATE: '停用知识草案',
}

type CopilotMessage =
  | { id: string; kind: 'welcome'; text: string }
  | { id: string; kind: 'question'; text: string }
  | { id: string; kind: 'error'; text: string }
  | { id: string; kind: 'history'; role: 'user' | 'assistant'; text: string }
  | { id: string; kind: 'answer'; response: OperationsCopilotResponse }

const welcomeMessage: CopilotMessage = {
  id: 'operations-copilot-welcome',
  kind: 'welcome',
  text: '你好，我是灵山运营 Copilot。每次提问都会重新汇总全局运营数据，不局限于当前页面。你也可以让我起草应急信息或维护知识库。',
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function generationMeta(value?: string) {
  return value === 'llm' ? { color: 'green', label: '大模型生成' } : { color: 'gold', label: '规则兜底' }
}

function confirmationLabel(type?: string) {
  if (type === 'EMERGENCY_DRAFT') return '确认并发布'
  if (type === 'KB_DEACTIVATE') return '确认并停用'
  return '确认并写入'
}

export default function OperationsCopilotChat() {
  const location = useLocation()
  const heading = getAdminPageHeading(location.pathname)
  const [session, setSession] = useState<OperationsCopilotSession>(() => readOperationsCopilotSession() ?? createOperationsCopilotSession())
  const [conversation, setConversation] = useState<CopilotMessage[]>(() => [
    welcomeMessage,
    ...(readOperationsCopilotSession()?.turns.map((turn, index): CopilotMessage => ({
      id: `restored-${index}`,
      kind: 'history',
      role: turn.role,
      text: turn.content,
    })) ?? []),
  ])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [discardingId, setDiscardingId] = useState('')
  const [pendingConfirmation, setPendingConfirmation] = useState<OperationsCopilotResponse | null>(null)
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [editingResponse, setEditingResponse] = useState<OperationsCopilotResponse | null>(null)
  const [savingProposal, setSavingProposal] = useState(false)
  const confirmingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation, loading])

  useEffect(() => {
    saveOperationsCopilotSession(session)
  }, [session])

  const replaceResponse = (response: OperationsCopilotResponse) => {
    setConversation((current) => current.map((entry) => (
      entry.kind === 'answer' && entry.response.id === response.id
        ? { ...entry, response }
        : entry
    )))
  }

  const ask = async (nextQuestion = question) => {
    const value = nextQuestion.trim()
    if (!value || loading) {
      if (!value) message.warning('请输入要分析的运营问题')
      return
    }

    setConversation((current) => [...current, { id: createMessageId(), kind: 'question', text: value }])
    setQuestion('')
    setLoading(true)
    try {
      const response = await queryOperationsCopilot({
        question: value,
        sessionId: session.sessionId,
        history: session.turns,
        pageContext: {
          pathname: location.pathname,
          pageLabel: `${heading.parent} / ${heading.title}`,
        },
      })
      setConversation((current) => [...current, { id: createMessageId(), kind: 'answer', response }])
      setSession((current) => createOperationsCopilotSession(response.sessionId || current.sessionId, [
        ...current.turns,
        { role: 'user', content: value },
        { role: 'assistant', content: response.answer },
      ]))
    } catch (cause) {
      setConversation((current) => [...current, {
        id: createMessageId(),
        kind: 'error',
        text: cause instanceof Error ? cause.message : '运营 Copilot 暂不可用',
      }])
    } finally {
      setLoading(false)
    }
  }

  const saveProposal = async (update: OperationsCopilotProposalUpdate) => {
    if (!editingResponse) return
    setSavingProposal(true)
    try {
      const response = await updateOperationsCopilotProposal(editingResponse.id, update)
      replaceResponse(response)
      setEditingResponse(null)
      message.success('草案已保存，确认执行前仍可再次核对')
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '草案保存失败')
    } finally {
      setSavingProposal(false)
    }
  }

  const clearConversation = () => {
    const nextSession = createOperationsCopilotSession()
    clearOperationsCopilotSession()
    setSession(nextSession)
    setConversation([welcomeMessage])
    message.info('本次运营会话已清空')
  }

  const confirm = async () => {
    if (confirmingRef.current) return
    const proposal = pendingConfirmation?.proposal
    if (!pendingConfirmation || !proposal || !password) {
      message.warning('请输入管理员密码后确认执行')
      return
    }
    if (!pendingConfirmation.proposalRevision) {
      message.error('草案版本信息缺失，请重新生成或保存草案后再确认')
      return
    }

    confirmingRef.current = true
    setConfirming(true)
    try {
      const session = await loginServiceConfig(password)
      const response = await confirmOperationsCopilotProposal(
        pendingConfirmation.id,
        session.token,
        pendingConfirmation.proposalRevision,
      )
      replaceResponse(response)
      setPendingConfirmation(null)
      message.success(proposal.type === 'EMERGENCY_DRAFT' ? '应急信息已发布并进入联动流程' : '知识库草案已执行')
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '确认操作未完成')
    } finally {
      confirmingRef.current = false
      setPassword('')
      setConfirming(false)
    }
  }

  const discard = async (response: OperationsCopilotResponse) => {
    setDiscardingId(response.id)
    try {
      replaceResponse(await discardOperationsCopilotProposal(response.id))
      message.info('已忽略该 Copilot 草案')
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '无法忽略该草案')
    } finally {
      setDiscardingId('')
    }
  }

  return (
    <div className="operations-copilot-chat">
      <div className="operations-copilot-chat__context">
        <span className="operations-copilot-chat__context-dot" />
        <span>当前页：{heading.title} · 已连接全局票务消费、客流热力、问答情绪、画像、时延和应急事件</span>
        <button type="button" onClick={clearConversation}>清空会话</button>
      </div>

      <div className="operations-copilot-chat__messages" aria-live="polite">
        {conversation.map((entry) => {
          if (entry.kind === 'question') {
            return <article key={entry.id} className="operations-copilot-message is-user"><p>{entry.text}</p></article>
          }
          if (entry.kind === 'history') {
            return entry.role === 'user'
              ? <article key={entry.id} className="operations-copilot-message is-user is-history"><p>{entry.text}</p></article>
              : <article key={entry.id} className="operations-copilot-message is-assistant is-history"><span className="operations-copilot-message__speaker">已恢复的会话</span><p>{entry.text}</p></article>
          }
          if (entry.kind === 'error') {
            return <article key={entry.id} className="operations-copilot-message is-assistant is-error"><Alert showIcon type="warning" message={entry.text} /></article>
          }
          if (entry.kind === 'welcome') {
            return (
              <article key={entry.id} className="operations-copilot-message is-assistant">
                <span className="operations-copilot-message__speaker">小灵 · 运营助手</span>
                <p>{entry.text}</p>
              </article>
            )
          }

          const result = entry.response
          const proposal = result.proposal
          const source = generationMeta(result.generationSource)
          const confirmable = Boolean(proposal && result.proposalRevision && result.proposalStatus && isConfirmableProposal({ status: result.proposalStatus, type: proposal.type }))
          return (
            <article key={entry.id} className="operations-copilot-message is-assistant">
              <div className="operations-copilot-message__meta">
                <span className="operations-copilot-message__speaker">小灵 · 运营助手</span>
                <Tag color={source.color}>{source.label}</Tag>
              </div>
              <Paragraph className="operations-copilot-message__answer">{result.answer}</Paragraph>
              {result.fallbackReason ? <Alert showIcon type="warning" message={result.fallbackReason} className="operations-copilot-message__fallback" /> : null}
              {result.evidence?.length || result.recommendedActions?.length || result.risks?.length ? (
                <div className="operations-copilot-message__analysis-grid">
                  {result.evidence?.length ? <section><strong>判断依据</strong><ul>{result.evidence.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                  {result.recommendedActions?.length ? <section><strong>建议动作</strong><ol>{result.recommendedActions.map((item) => <li key={item}>{item}</li>)}</ol></section> : null}
                  {result.risks?.length ? <section className="is-risk"><strong><WarningOutlined /> 执行风险</strong><ul>{result.risks.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                </div>
              ) : null}
              {result.sources.length ? (
                <Space wrap size={[4, 4]} className="operations-copilot-message__sources">
                  {result.sources.map((item) => <Tag key={item} icon={<BulbOutlined />}>{item}</Tag>)}
                </Space>
              ) : null}

              {proposal ? (
                <div className="operations-copilot-message__proposal">
                  <div className="operations-copilot-message__proposal-title">
                    <FileTextOutlined />
                    <div>
                      <Text strong>{proposalLabels[proposal.type] ?? '待确认草案'}</Text>
                      <Text>{proposal.title}</Text>
                    </div>
                  </div>
                  <Paragraph>{proposal.summary}</Paragraph>
                  {confirmable ? (
                    <Space wrap>
                      <Button size="small" icon={<EditOutlined />} onClick={() => setEditingResponse(result)}>编辑草案</Button>
                      <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => setPendingConfirmation(result)}>
                        {confirmationLabel(proposal.type)}
                      </Button>
                      <Button size="small" danger type="text" icon={<DeleteOutlined />} loading={discardingId === result.id} onClick={() => void discard(result)}>忽略</Button>
                    </Space>
                  ) : proposal.type === 'KB_UPDATE' || proposal.type === 'KB_DEACTIVATE' ? (
                    <Alert showIcon type="warning" message="需先在知识库目录选择可信条目，模型给出的 FAQ 标识不会直接执行。" />
                  ) : result.executionResult && Object.keys(result.executionResult).length ? <OperationsCopilotExecutionResult result={result.executionResult} /> : null}
                </div>
              ) : null}
            </article>
          )
        })}
        {loading ? (
          <article className="operations-copilot-message is-assistant is-thinking">
            <span className="operations-copilot-message__speaker">小灵正在汇总全局数据</span>
            <span className="operations-copilot-thinking"><i /><i /><i /></span>
          </article>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="operations-copilot-chat__starters" aria-label="快捷提问">
        {promptStarters.map((item) => (
          <button key={item} type="button" onClick={() => void ask(item)} disabled={loading}>{item}</button>
        ))}
      </div>

      <div className="operations-copilot-chat__composer">
        <GuideVoiceButton
          className="operations-copilot-chat__voice"
          disabled={loading}
          onTranscript={(text) => void ask(text)}
        />
        <Input.TextArea
          aria-label="向运营 Copilot 提问"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault()
              void ask()
            }
          }}
          placeholder="询问全局运营，或起草应急发布、知识库维护动作…"
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={600}
          disabled={loading}
        />
        <Button type="primary" aria-label="发送问题" icon={<SendOutlined />} loading={loading} disabled={!question.trim()} onClick={() => void ask()} />
      </div>
      <Text className="operations-copilot-chat__safety">分析只读；发布应急与知识库变更均需二次密码确认。</Text>

      <Modal
        title={pendingConfirmation?.proposal ? `${confirmationLabel(pendingConfirmation.proposal.type)}：${pendingConfirmation.proposal.title}` : '确认 Copilot 草案'}
        open={Boolean(pendingConfirmation)}
        okText={pendingConfirmation?.proposal ? confirmationLabel(pendingConfirmation.proposal.type) : '确认'}
        okButtonProps={{ loading: confirming, danger: pendingConfirmation?.proposal?.type === 'EMERGENCY_DRAFT' }}
        cancelButtonProps={{ disabled: confirming }}
        closable={!confirming}
        keyboard={!confirming}
        maskClosable={!confirming}
        onCancel={() => {
          if (confirming) return
          setPendingConfirmation(null)
          setPassword('')
        }}
        onOk={() => void confirm()}
      >
        <Alert
          showIcon
          type="warning"
          icon={<LockOutlined />}
          message="此操作会写入真实服务"
          description="请重新输入管理员密码。密码只发送给 Fay 验证，不会被 analytics-server 或浏览器保存。"
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          autoFocus
          prefix={<LockOutlined />}
          value={password}
          disabled={confirming}
          onChange={(event) => setPassword(event.target.value)}
          onPressEnter={() => void confirm()}
          placeholder="输入管理员密码以确认"
        />
      </Modal>
      <OperationsCopilotProposalEditor
        open={Boolean(editingResponse?.proposal)}
        proposal={editingResponse?.proposal ?? null}
        saving={savingProposal}
        onCancel={() => { if (!savingProposal) setEditingResponse(null) }}
        onSave={(update) => void saveProposal(update)}
      />
    </div>
  )
}
