import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RobotState } from '../../lib/live2dManager'
import { useChatStore } from '../../store/useChatStore'
import { useGuideSessionStore } from '../useGuideSessionStore'
import { GUIDE_RUNTIME_SCENE_ID } from './guideRuntimeScene'
import { guideStatusToRobotState } from './XiaolingRuntimeAdapter'
import { XiaolingRuntimeContext } from './useXiaolingRuntime'

export function XiaolingRuntimeProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)
  const connectionState = useChatStore((state) => state.wsStatus)
  const guideStatus = useGuideSessionStore((state) => state.status)
  const activeConversationKey = useGuideSessionStore((state) => state.activeConversationKey)
  const activeMessages = useGuideSessionStore((state) => state.messagesByConversation[state.activeConversationKey])
  const lastMessage = activeMessages?.[activeMessages.length - 1]
  const lastAssistantId = lastMessage?.role === 'assistant' ? lastMessage.id : undefined
  const previousAssistantIdRef = useRef(lastAssistantId)
  const speakingTimerRef = useRef<number | null>(null)
  const [answerSpeaking, setAnswerSpeaking] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(0)

  useEffect(() => {
    if (!enabled) return
    initializeConnection()
    return () => disconnectConnection()
  }, [disconnectConnection, enabled, initializeConnection])

  useEffect(() => {
    if (previousAssistantIdRef.current === lastAssistantId) return
    previousAssistantIdRef.current = lastAssistantId
    if (!lastAssistantId) return
    setAnswerSpeaking(true)
    if (speakingTimerRef.current !== null) window.clearTimeout(speakingTimerRef.current)
    speakingTimerRef.current = window.setTimeout(() => {
      speakingTimerRef.current = null
      setAnswerSpeaking(false)
    }, 1400)
  }, [activeConversationKey, lastAssistantId])

  const robotState: RobotState = answerSpeaking ? 'speaking' : guideStatusToRobotState(guideStatus)

  useEffect(() => {
    if (robotState !== 'speaking') {
      setMouthOpen(0)
      return
    }
    let open = false
    const timer = window.setInterval(() => {
      open = !open
      setMouthOpen(open ? 0.42 : 0.08)
    }, 130)
    return () => {
      window.clearInterval(timer)
      setMouthOpen(0)
    }
  }, [robotState])

  useEffect(() => () => {
    if (speakingTimerRef.current !== null) window.clearTimeout(speakingTimerRef.current)
  }, [])

  const value = useMemo(() => ({
    robotState,
    mouthOpen,
    connectionState,
    sceneId: GUIDE_RUNTIME_SCENE_ID
  }), [connectionState, mouthOpen, robotState])

  return <XiaolingRuntimeContext.Provider value={value}>{children}</XiaolingRuntimeContext.Provider>
}
