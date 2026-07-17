import { DeleteOutlined, DownloadOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Skeleton, Switch, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { deleteVisitorData, exportVisitorData, fetchPrivacySummary, updateVisitorConsent, type VisitorPrivacySummary } from '../api/privacy'
import { applyAnalyticsConsent } from '../lib/analytics'
import { buildCleanupPlan } from '../lib/privacyCleanup'
import { clearCachedConsent, writeCachedConsent } from '../lib/privacyConsent'
import { useGuideStore } from '../store/useGuideStore'

const countLabels: Record<string, string> = {
  analyticsEvents: '互动与问答记录',
  profile: '游客画像',
  behaviorRecords: '到访与消费足迹',
  consent: '授权设置'
}

function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function VisitorPrivacyCenter() {
  const ensureUserId = useGuideStore((state) => state.ensureUserId)
  const refreshRecommendations = useGuideStore((state) => state.refreshRecommendations)
  const userId = useMemo(() => ensureUserId(), [ensureUserId])
  const [summary, setSummary] = useState<VisitorPrivacySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    fetchPrivacySummary(userId)
      .then((value) => {
        if (!active) return
        setSummary(value)
        writeCachedConsent(userId, value.consent)
        applyAnalyticsConsent(value.consent.analyticsEnabled)
      })
      .catch(() => { if (active) message.warning('个人数据服务暂时不可用') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  const saveConsent = async (patch: Partial<{ personalizationEnabled: boolean; analyticsEnabled: boolean }>) => {
    if (!summary) return
    const next = { ...summary.consent, ...patch }
    setSaving(true)
    try {
      const consent = await updateVisitorConsent(userId, next)
      setSummary((current) => current ? { ...current, consent } : current)
      writeCachedConsent(userId, consent)
      applyAnalyticsConsent(consent.analyticsEnabled)
      if ('personalizationEnabled' in patch) void refreshRecommendations()
      message.success('授权设置已生效')
    } catch { message.error('授权设置保存失败') }
    finally { setSaving(false) }
  }

  const exportData = async () => {
    try {
      const data = await exportVisitorData(userId)
      downloadJson(data, `灵山游客足迹-${new Date().toISOString().slice(0, 10)}.json`)
      message.success('个人足迹已导出')
    } catch { message.error('导出失败') }
  }

  const removeData = () => Modal.confirm({
    title: '删除历史记录？',
    content: '将删除服务端画像、足迹、互动记录及当前设备的本地记录，然后创建新的匿名身份。此操作不可恢复。',
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk: async () => {
      setDeleting(true)
      try {
        const result = await deleteVisitorData(userId)
        const plan = buildCleanupPlan(result)
        if (!plan.rotateGuestIdentity) throw new Error('服务端未完成全部删除')
        plan.remove.forEach((key) => localStorage.removeItem(key))
        const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key))
        keys.filter((key) => plan.removePrefixes.some((prefix) => key.startsWith(prefix))).forEach((key) => localStorage.removeItem(key))
        clearCachedConsent()
        applyAnalyticsConsent(false)
        message.success('历史记录已删除，正在创建新的匿名身份')
        window.setTimeout(() => window.location.reload(), 700)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '删除失败')
        setDeleting(false)
      }
    }
  })

  return (
    <section className="mobile-panel mobile-privacy-center">
      <div className="mobile-panel__head">
        <div><span className="mobile-section-kicker">PRIVACY CONTROL</span><h3>个人数据管理</h3></div>
        <SafetyCertificateOutlined />
      </div>
      <p className="mobile-muted">你可以查看系统保存的数据，随时关闭个性化或撤回行为分析授权。</p>
      {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : summary ? (
        <>
          <div className="mobile-privacy-center__counts">
            {Object.entries(summary.savedDataCounts).map(([key, count]) => <div key={key}><strong>{count}</strong><span>{countLabels[key] ?? key}</span></div>)}
          </div>
          <div className="mobile-privacy-center__setting">
            <div><strong>个性化推荐</strong><span>关闭后，路线不再使用你的标签、画像和历史偏好</span></div>
            <Switch loading={saving} checked={summary.consent.personalizationEnabled} onChange={(checked) => void saveConsent({ personalizationEnabled: checked })} />
          </div>
          <div className="mobile-privacy-center__setting">
            <div><strong>行为分析授权</strong><span>关闭后，立即停止 PostHog 与本地统计服务的新行为采集</span></div>
            <Switch loading={saving} checked={summary.consent.analyticsEnabled} onChange={(checked) => void saveConsent({ analyticsEnabled: checked })} />
          </div>
          <Alert showIcon icon={<LockOutlined />} type="success" message="匿名身份" description={`当前标识：${userId.slice(0, 14)}…，仅用于连接本次导览数据。`} />
          <div className="mobile-privacy-center__actions">
            <Button icon={<DownloadOutlined />} onClick={() => void exportData()}>导出个人足迹</Button>
            <Button danger icon={<DeleteOutlined />} loading={deleting} onClick={removeData}>删除历史记录</Button>
          </div>
        </>
      ) : <Alert showIcon type="warning" message="暂时无法读取个人数据" />}
    </section>
  )
}
