import { goToRouteActive, goToRouteArrived } from '../lib/mapGuideNavigation'
import type { NavigateFunction } from 'react-router-dom'
import type { ScenicMapPresentation } from '../types/mapGuide'
import type { PrototypeNavigationSession } from './types'

export function commitPrototypeArrivalToRouteStage(input: {
  session?: PrototypeNavigationSession
  currentRouteId: string
  currentStage: 'joining' | 'active'
  expectedTargetStopIndex: number
  expectedTargetPoiId: string
  navigate: NavigateFunction
  presentation: ScenicMapPresentation
  markCommitted: (sessionId: string) => boolean
}): { committed: boolean; reason: string } {
  const { session } = input
  if (!session) return { committed: false, reason: '导航会话已失效' }
  if (session.committed) return { committed: false, reason: '该导航会话已提交' }
  if (session.target.mode === 'free-poi') return { committed: false, reason: '自由导航不推进路线' }
  if (session.target.routeId !== input.currentRouteId || session.originStage !== input.currentStage) {
    return { committed: false, reason: '路线状态已变化，请重新导航' }
  }
  if (session.target.targetStopIndex === undefined || session.target.targetStopIndex !== input.expectedTargetStopIndex) {
    return { committed: false, reason: '导航目标已变化' }
  }
  if (session.target.poiId !== input.expectedTargetPoiId) return { committed: false, reason: '导航景点已变化' }
  if (!input.markCommitted(session.id)) return { committed: false, reason: '导航会话已失效' }
  if (input.currentStage === 'joining') {
    goToRouteActive(input.navigate, input.currentRouteId, session.target.targetStopIndex, input.presentation)
    return { committed: true, reason: '已确认加入路线' }
  }
  goToRouteArrived(input.navigate, input.currentRouteId, session.target.targetStopIndex, input.presentation)
  return { committed: true, reason: '已确认到达下一站' }
}
