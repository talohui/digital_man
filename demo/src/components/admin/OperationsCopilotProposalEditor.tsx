import { Alert, Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'
import type { OperationsCopilotProposal } from '../../api/operationsCopilot'
import {
  buildOperationsCopilotProposalUpdate,
  proposalToEditorValues,
  type OperationsCopilotEditorValues,
} from '../../lib/operationsCopilotEditor'

type Props = {
  open: boolean
  proposal: OperationsCopilotProposal | null
  saving: boolean
  onCancel: () => void
  onSave: (update: Pick<OperationsCopilotProposal, 'title' | 'summary' | 'payload'>) => void
}

const emergencyTypes = [
  { value: 'SCENIC_CLOSURE', label: '临时闭园' },
  { value: 'SHOW_CANCELLED', label: '演出取消' },
  { value: 'EXTREME_WEATHER', label: '极端天气' },
  { value: 'CROWDING', label: '景点拥堵' },
  { value: 'ROAD_CLOSURE', label: '道路封闭' },
]

export default function OperationsCopilotProposalEditor({ open, proposal, saving, onCancel, onSave }: Props) {
  const [form] = Form.useForm<OperationsCopilotEditorValues>()

  useEffect(() => {
    if (open && proposal) form.setFieldsValue(proposalToEditorValues(proposal))
  }, [form, open, proposal])

  const save = async () => {
    if (!proposal) return
    try {
      const values = await form.validateFields()
      onSave(buildOperationsCopilotProposalUpdate(proposal, values))
    } catch {
      // Ant Design 已在具体字段旁展示校验信息。
    }
  }

  const emergency = proposal?.type === 'EMERGENCY_DRAFT'
  const knowledgeCreate = proposal?.type === 'KB_CREATE'

  return (
    <Modal
      title="核对并编辑执行草案"
      open={open}
      okText="保存草案"
      cancelText="取消"
      confirmLoading={saving}
      maskClosable={!saving}
      closable={!saving}
      onCancel={onCancel}
      onOk={() => void save()}
      width={620}
    >
      <Alert showIcon type="info" message="此处只保存草案，不会直接发布；执行前仍需重新输入管理员密码。" style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical" disabled={saving}>
        <Form.Item name="proposalTitle" label="草案标题" rules={[{ required: true, message: '请输入草案标题' }]}><Input maxLength={160} /></Form.Item>
        <Form.Item name="proposalSummary" label="操作摘要" rules={[{ required: true, message: '请输入操作摘要' }]}><Input.TextArea rows={2} maxLength={600} /></Form.Item>

        {emergency ? (
          <>
            <Form.Item name="type" label="事件类型" rules={[{ required: true }]}><Select options={emergencyTypes} /></Form.Item>
            <Form.Item name="title" label="游客端标题" rules={[{ required: true }]}><Input maxLength={120} /></Form.Item>
            <Form.Item name="message" label="游客端提醒内容" rules={[{ required: true }]}><Input.TextArea rows={3} maxLength={400} /></Form.Item>
            <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}><Select options={[{ value: 'INFO', label: '提示' }, { value: 'WARNING', label: '警告' }, { value: 'CRITICAL', label: '紧急' }]} /></Form.Item>
            <Form.Item name="routePolicy" label="路线策略" rules={[{ required: true }]}><Select options={[{ value: 'NONE', label: '不调整路线' }, { value: 'PENALIZE', label: '降低推荐权重' }, { value: 'EXCLUDE', label: '从路线中排除' }]} /></Form.Item>
            <Form.Item name="affectedSpotIds" label="受影响景点 ID（逗号分隔）"><Input /></Form.Item>
            <Form.Item name="affectedRouteIds" label="受影响路线 ID（逗号分隔）"><Input /></Form.Item>
            <Form.Item name="validFrom" label="生效时间（如 2026-07-16T14:00:00）"><Input /></Form.Item>
            <Form.Item name="validUntil" label="失效时间"><Input /></Form.Item>
          </>
        ) : null}

        {knowledgeCreate ? (
          <>
            <Form.Item name="question" label="游客问题" rules={[{ required: true }]}><Input maxLength={240} /></Form.Item>
            <Form.Item name="answer" label="官方答案" rules={[{ required: true }]}><Input.TextArea rows={5} maxLength={1200} /></Form.Item>
            <Form.Item name="tags" label="标签（逗号分隔）"><Input /></Form.Item>
            <Form.Item name="validFrom" label="生效时间"><Input /></Form.Item>
            <Form.Item name="validUntil" label="失效时间"><Input /></Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  )
}
