import { Descriptions, Space, Tag } from 'antd'
import { formatEvidenceScalar, translateEvidenceField } from '../../lib/decisionEvidenceLabels'

const SENSITIVE_FIELD = /(user|session|phone|mobile|openid|token|key|secret|password)/i

function safeEntries(value: Record<string, unknown>) {
  return Object.entries(value).filter(([key]) => !SENSITIVE_FIELD.test(key))
}

export default function DecisionEvidenceValue({ fieldKey, value }: { fieldKey: string; value: unknown }) {
  if (Array.isArray(value)) {
    if (!value.length) return <span>暂无数据</span>
    if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
      return (
        <Space size={[4, 4]} wrap>
          {value.map((item, index) => <Tag key={`${String(item)}-${index}`}>{formatEvidenceScalar(fieldKey, item as string | number | boolean | null)}</Tag>)}
        </Space>
      )
    }
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {value.map((item, index) => (
          <div key={index} style={{ padding: 8, borderRadius: 8, background: 'rgba(232,240,226,.55)' }}>
            <DecisionEvidenceValue fieldKey={`${fieldKey}-${index + 1}`} value={item} />
          </div>
        ))}
      </Space>
    )
  }

  if (value && typeof value === 'object') {
    return (
      <Descriptions bordered size="small" column={1}>
        {safeEntries(value as Record<string, unknown>).map(([key, nested]) => (
          <Descriptions.Item key={key} label={translateEvidenceField(key)}>
            <DecisionEvidenceValue fieldKey={key} value={nested} />
          </Descriptions.Item>
        ))}
      </Descriptions>
    )
  }

  return <span>{formatEvidenceScalar(fieldKey, value as string | number | boolean | null | undefined)}</span>
}
