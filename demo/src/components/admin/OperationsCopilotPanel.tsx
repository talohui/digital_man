import {
  BulbOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LockOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Input, Modal, Space, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import {
  confirmOperationsCopilotProposal,
  discardOperationsCopilotProposal,
  queryOperationsCopilot,
  type OperationsCopilotResponse,
} from '../../api/operationsCopilot'
import { loginServiceConfig } from '../../api/serviceConfig'
import { isConfirmableProposal } from '../../lib/operationsCopilotProposal'

const { Paragraph, Text } = Typography

const promptStarters = [
  '今天应优先处理什么运营问题？',
  '客流和消费数据有什么可执行机会？',
  '帮我起草一条入口拥堵提醒',
]

const proposalLabels: Record<string, string> = {
  EMERGENCY_DRAFT: '应急发布草案',
  KB_CREATE: '新增知识草案',
  KB_UPDATE: '更新知识草案',
  KB_DEACTIVATE: '停用知识草案',
}

function generationLabel(value?: string) {
  return value === 'llm' ? { color: 'green', label: '大模型生成' } : { color: 'gold', label: '规则兜底' }
}

function confirmationLabel(type?: string) {
  if (type === 'EMERGENCY_DRAFT') return '确认并发布'
  if (type === 'KB_DEACTIVATE') return '确认并停用'
  return '确认并写入'
}

export default function OperationsCopilotPanel() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<OperationsCopilotResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  const source = useMemo(() => generationLabel(result?.generationSource), [result?.generationSource])
  const proposal = result?.proposal ?? null
  const confirmable = Boolean(proposal && result?.proposalRevision && result?.proposalStatus && isConfirmableProposal({ status: result.proposalStatus, type: proposal.type }))

  const ask = async (nextQuestion = question) => {
    const value = nextQuestion.trim()
    if (!value) {
      message.warning('请输入要分析的运营问题')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await queryOperationsCopilot(value)
      setResult(response)
      setQuestion('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '运营 Copilot 暂不可用')
    } finally {
      setLoading(false)
    }
  }

  const confirm = async () => {
    if (!result || !proposal || !password) {
      message.warning('请输入管理员密码后确认执行')
      return
    }
    if (!result.proposalRevision) {
      message.error('草案版本信息缺失，请重新生成或保存草案后再确认')
      return
    }
    setConfirming(true)
    try {
      // 每次确认都重新向 Fay 换取短期会话，不保存在浏览器或 analytics-server。
      const session = await loginServiceConfig(password)
      const response = await confirmOperationsCopilotProposal(result.id, session.token, result.proposalRevision)
      setResult(response)
      setConfirmationOpen(false)
      message.success(proposal.type === 'EMERGENCY_DRAFT' ? '应急信息已发布并进入联动流程' : '知识库草案已执行')
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '确认操作未完成')
    } finally {
      setPassword('')
      setConfirming(false)
    }
  }

  const discard = async () => {
    if (!result) return
    setDiscarding(true)
    try {
      setResult(await discardOperationsCopilotProposal(result.id))
      message.info('已忽略该 Copilot 草案')
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '无法忽略该草案')
    } finally {
      setDiscarding(false)
    }
  }

  return (
    <section className="operations-copilot-panel" aria-label="运营 Copilot">
      <Card
        bordered={false}
        className="operations-copilot-panel__card"
        title={(
          <Space size={9}>
            <span className="operations-copilot-panel__seal"><RobotOutlined /></span>
            <span>
              <span className="operations-copilot-panel__eyebrow">全局运营智能助手</span>
              <span className="operations-copilot-panel__title">运营 Copilot</span>
            </span>
          </Space>
        )}
        extra={<Tag color="cyan">仅草案</Tag>}
      >
        <Text className="operations-copilot-panel__intro">分析当前运营数据，也可起草应急提醒与知识库维护动作。所有变更均需二次密码确认。</Text>
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
          placeholder="例如：今天应优先处理什么？或帮我起草入口拥堵提醒"
          autoSize={{ minRows: 3, maxRows: 5 }}
          maxLength={600}
          showCount
          disabled={loading}
        />
        <Button type="primary" block icon={<SendOutlined />} loading={loading} onClick={() => void ask()} style={{ marginTop: 10 }}>
          分析并生成建议
        </Button>
        <div className="operations-copilot-panel__starters" aria-label="快捷提问">
          {promptStarters.map((item) => (
            <button key={item} type="button" onClick={() => void ask(item)} disabled={loading}>{item}</button>
          ))}
        </div>

        {error ? <Alert showIcon type="warning" message={error} style={{ marginTop: 14 }} /> : null}

        {result ? (
          <div className="operations-copilot-panel__result">
            <div className="operations-copilot-panel__result-meta">
              <Space size={7} wrap>
                <Tag color={source.color}>{source.label}</Tag>
                {result.proposalStatus ? <Tag>{result.proposalStatus === 'DRAFT' ? '待确认' : result.proposalStatus}</Tag> : <Tag>只读分析</Tag>}
              </Space>
            </div>
            <Paragraph className="operations-copilot-panel__answer">{result.answer}</Paragraph>
            <Space wrap size={[5, 5]}>
              {result.sources.map((item) => <Tag key={item} icon={<BulbOutlined />}>{item}</Tag>)}
            </Space>

            {proposal ? (
              <div className="operations-copilot-panel__proposal">
                <Space align="start" size={9}>
                  <FileTextOutlined className="operations-copilot-panel__proposal-icon" />
                  <div>
                    <Text strong>{proposalLabels[proposal.type] ?? '待确认草案'}</Text>
                    <Text className="operations-copilot-panel__proposal-title">{proposal.title}</Text>
                  </div>
                </Space>
                <Paragraph>{proposal.summary}</Paragraph>
                {confirmable ? (
                  <Space wrap>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setConfirmationOpen(true)}>
                      {confirmationLabel(proposal.type)}
                    </Button>
                    <Button danger type="text" icon={<DeleteOutlined />} loading={discarding} onClick={() => void discard()}>忽略</Button>
                  </Space>
                ) : result.executionResult ? (
                  <Alert
                    showIcon
                    type={result.proposalStatus === 'CONFIRMED' ? 'success' : 'info'}
                    message={result.proposalStatus === 'CONFIRMED' ? '已记录执行结果' : '该草案未执行'}
                    description={typeof result.executionResult.status === 'string' ? `状态：${result.executionResult.status}` : undefined}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Modal
        title={proposal ? `${confirmationLabel(proposal.type)}：${proposal.title}` : '确认 Copilot 草案'}
        open={confirmationOpen}
        okText={proposal ? confirmationLabel(proposal.type) : '确认'}
        okButtonProps={{ loading: confirming, danger: proposal?.type === 'EMERGENCY_DRAFT' }}
        onCancel={() => { setConfirmationOpen(false); setPassword('') }}
        onOk={() => void confirm()}
      >
        <Alert
          showIcon
          type="warning"
          icon={<LockOutlined />}
          message="此操作会写入真实服务"
          description="请重新输入管理员密码。密码只发送给 Fay 进行验证，analytics-server 不保存密码或短期会话令牌。"
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          autoFocus
          prefix={<LockOutlined />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onPressEnter={() => void confirm()}
          placeholder="输入管理员密码以确认"
        />
      </Modal>
    </section>
  )
}
