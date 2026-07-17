import { CheckOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons'

import {
  GUIDE_PREFERENCE_GROUPS,
  GUIDE_TAGS,
  type GuidePreferenceContext,
  type GuidePreferenceKey
} from '../../../data/guideData'
import type { RoutePlanStep } from '../../../lib/routePlanState'

const TAG_ICONS: Record<string, string> = {
  亲子游: '/icons/tag-family.png',
  文化探秘: '/icons/tag-culture.png',
  祈福静心: '/icons/tag-pray.png',
  轻松漫步: '/icons/tag-walk.png',
  拍照打卡: '/icons/tag-photo.png'
}

type RoutePreferenceStepsProps = {
  activeStep: RoutePlanStep
  selectedTags: string[]
  guidePreferences: GuidePreferenceContext
  routeProfileLabels: string[]
  advancedOpen: boolean
  isLoading: boolean
  lastError: string
  onGoToStep: (step: RoutePlanStep) => void
  onTagToggle: (tag: string) => void
  onPreferenceSelect: (key: GuidePreferenceKey, value: string) => void
  onToggleAdvanced: () => void
}

function RoutePreferenceSteps({
  activeStep,
  selectedTags,
  guidePreferences,
  routeProfileLabels,
  advancedOpen,
  isLoading,
  lastError,
  onGoToStep,
  onTagToggle,
  onPreferenceSelect,
  onToggleAdvanced
}: RoutePreferenceStepsProps) {
  const corePreferenceGroups = GUIDE_PREFERENCE_GROUPS.slice(0, 3)
  const advancedPreferenceGroups = GUIDE_PREFERENCE_GROUPS.slice(3)

  return (
    <section className="plan-v2-preference-scroll" aria-label="路线规划步骤">
      <article id="plan-v2-step-1" className={`plan-v2-step ${activeStep === 1 ? 'is-active' : ''} ${selectedTags.length ? 'is-complete' : ''}`}>
        <button id="plan-v2-step-1-trigger" className="plan-v2-step__head" type="button" onClick={() => onGoToStep(1)} aria-expanded={activeStep === 1} aria-controls="plan-v2-step-1-panel">
          <i aria-hidden="true">壹</i>
          <span><small>第一步</small><strong>择心愿</strong></span>
          <em>{selectedTags.length ? selectedTags.join('、') : '选择一项或多项期待'}</em>
          <b>{selectedTags.length ? <CheckOutlined /> : '待择'}</b>
        </button>
        {activeStep === 1 ? (
          <div id="plan-v2-step-1-panel" className="plan-v2-step__body" role="region" aria-labelledby="plan-v2-step-1-trigger">
            <p className="plan-v2-step__hint">点选今天最想体验的内容，可多选；再次点击即可取消。</p>
            <div className="plan-v2-tag-list">
              {GUIDE_TAGS.map((tag) => (
                <button key={tag} type="button" className={selectedTags.includes(tag) ? 'is-selected' : ''} onClick={() => onTagToggle(tag)} aria-pressed={selectedTags.includes(tag)}>
                  <i><img src={TAG_ICONS[tag]} alt="" /></i>
                  <span><strong>{tag}</strong><small>{selectedTags.includes(tag) ? '已记入行卷' : '点选心愿'}</small></span>
                  {selectedTags.includes(tag) ? <CheckOutlined /> : null}
                </button>
              ))}
            </div>
            <button className="plan-v2-step__next" type="button" disabled={!selectedTags.length} onClick={() => onGoToStep(2)}>
              <span><small>{selectedTags.length ? `已择 ${selectedTags.length} 项心愿` : '请至少选择一项'}</small><strong>下一步 · 定节奏</strong></span><RightOutlined />
            </button>
          </div>
        ) : null}
      </article>

      <article id="plan-v2-step-2" className={`plan-v2-step ${activeStep === 2 ? 'is-active' : ''} ${routeProfileLabels.length === corePreferenceGroups.length ? 'is-complete' : ''}`}>
        <button id="plan-v2-step-2-trigger" className="plan-v2-step__head" type="button" onClick={() => onGoToStep(2)} aria-expanded={activeStep === 2} aria-controls="plan-v2-step-2-panel">
          <i aria-hidden="true">贰</i>
          <span><small>第二步</small><strong>定节奏</strong></span>
          <em>{routeProfileLabels.length ? routeProfileLabels.join('、') : '安排时长、到达与同行'}</em>
          <b>{routeProfileLabels.length === corePreferenceGroups.length ? <CheckOutlined /> : '待定'}</b>
        </button>
        {activeStep === 2 ? (
          <div id="plan-v2-step-2-panel" className="plan-v2-step__body" role="region" aria-labelledby="plan-v2-step-2-trigger">
            <p className="plan-v2-step__hint">每组选择一项，小灵会按新的节奏即时重新排卷。</p>
            <div className="plan-v2-preference-groups">
              {corePreferenceGroups.map((group) => (
                <div className="plan-v2-preference-row" key={group.key}>
                  <span id={`plan-v2-preference-${group.key}`}>{group.label}</span>
                  <div role="group" aria-labelledby={`plan-v2-preference-${group.key}`}>
                    {group.options.map((option) => (
                      <button key={option.value} type="button" className={guidePreferences[group.key] === option.value ? 'is-selected' : ''} onClick={() => onPreferenceSelect(group.key, option.value)} aria-pressed={guidePreferences[group.key] === option.value}>{option.label}</button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="plan-v2-advanced-toggle" aria-expanded={advancedOpen} aria-controls="plan-v2-advanced-groups" onClick={onToggleAdvanced}>
                <span><strong>步行与演出</strong><small>进阶安排 · 已为你保留当前选择</small></span>
                <b>{advancedOpen ? '收起' : '展开'} <i aria-hidden="true">⌄</i></b>
              </button>
              <div id="plan-v2-advanced-groups" className="plan-v2-advanced-groups" hidden={!advancedOpen}>
                {advancedPreferenceGroups.map((group) => (
                  <div className="plan-v2-preference-row" key={group.key}>
                    <span id={`plan-v2-preference-${group.key}`}>{group.label}</span>
                    <div role="group" aria-labelledby={`plan-v2-preference-${group.key}`}>{group.options.map((option) => <button key={option.value} type="button" className={guidePreferences[group.key] === option.value ? 'is-selected' : ''} onClick={() => onPreferenceSelect(group.key, option.value)} aria-pressed={guidePreferences[group.key] === option.value}>{option.label}</button>)}</div>
                  </div>
                ))}
              </div>
            </div>
            {lastError ? <p className="plan-v2-fallback">云端推荐暂歇，小灵已按景区规则重新排好路线。</p> : null}
            <button className="plan-v2-step__next" type="button" disabled={isLoading} onClick={() => onGoToStep(3)}>
              <span><small>{isLoading ? '小灵正在按新节奏排卷' : routeProfileLabels.join(' · ')}</small><strong>{isLoading ? '稍候片刻' : '下一步 · 看推荐路线'}</strong></span>{isLoading ? <LoadingOutlined spin /> : <RightOutlined />}
            </button>
          </div>
        ) : null}
      </article>
    </section>
  )
}

export default RoutePreferenceSteps
export type { RoutePreferenceStepsProps }
