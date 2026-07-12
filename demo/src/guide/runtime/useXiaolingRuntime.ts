import { createContext, useContext } from 'react'
import type { RobotState } from '../../lib/live2dManager'

export type XiaolingConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export type XiaolingRuntimeValue = {
  robotState: RobotState
  mouthOpen: number
  connectionState: XiaolingConnectionState
  sceneId: string
}

export const XiaolingRuntimeContext = createContext<XiaolingRuntimeValue | null>(null)

export function useXiaolingRuntime() {
  const runtime = useContext(XiaolingRuntimeContext)
  if (!runtime) throw new Error('useXiaolingRuntime must be used within XiaolingRuntimeProvider')
  return runtime
}
