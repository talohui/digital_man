import { useEffect, useMemo, type ReactNode } from 'react'
import { useChatStore } from '../../store/useChatStore'
import { useGuideSessionStore } from '../useGuideSessionStore'
import { GUIDE_RUNTIME_SCENE_ID } from './guideRuntimeScene'
import { guideStatusToRobotState } from './XiaolingRuntimeAdapter'
import { XiaolingRuntimeContext } from './useXiaolingRuntime'

export function XiaolingRuntimeProvider({ children }: { children: ReactNode }) {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)
  const interruptReply = useChatStore((state) => state.interruptReply)
  const connectionState = useChatStore((state) => state.wsStatus)
  const fayRuntimeSession = useChatStore((state) => state.sessions[GUIDE_RUNTIME_SCENE_ID])
  const guideStatus = useGuideSessionStore((state) => state.status)

  useEffect(() => {
    initializeConnection()
    const handlePageHide = () => {
      void interruptReply(GUIDE_RUNTIME_SCENE_ID, { notifyBackend: true, keepalive: true })
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      void interruptReply(GUIDE_RUNTIME_SCENE_ID, { notifyBackend: true, keepalive: true })
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection, interruptReply])

  const robotState = fayRuntimeSession?.robotState ?? guideStatusToRobotState(guideStatus)
  const mouthOpen = fayRuntimeSession?.mouthOpen ?? 0
  const mouthForm = fayRuntimeSession?.mouthForm ?? 0

  const value = useMemo(() => ({
    robotState,
    mouthOpen,
    mouthForm,
    connectionState,
    sceneId: GUIDE_RUNTIME_SCENE_ID
  }), [connectionState, mouthForm, mouthOpen, robotState])

  return <XiaolingRuntimeContext.Provider value={value}>{children}</XiaolingRuntimeContext.Provider>
}
