import type { RobotState } from '../../lib/live2dManager'
import type { GuideSessionStatus } from '../GuideMessageSchema'

export function guideStatusToRobotState(status: GuideSessionStatus): RobotState {
  if (status === 'thinking') return 'thinking'
  if (status === 'listening') return 'listening'
  if (status === 'speaking') return 'speaking'
  return 'normal'
}
