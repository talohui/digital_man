import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RobotState } from '../../lib/live2dManager'
import { useChatStore } from '../../store/useChatStore'
import { useGuideSessionStore } from '../useGuideSessionStore'
import { GUIDE_RUNTIME_SCENE_ID } from './guideRuntimeScene'
import { guideStatusToRobotState } from './XiaolingRuntimeAdapter'
import { XiaolingRuntimeContext } from './useXiaolingRuntime'

export function XiaolingRuntimeProvider({ children }: { children: ReactNode }) {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)
  const connectionState = useChatStore((state) => state.wsStatus)
  const guideStatus = useGuideSessionStore((state) => state.status)
  const activeMessages = useGuideSessionStore((state) => state.messagesByConversation[state.activeConversationKey])
  const lastMessage = activeMessages?.[activeMessages.length - 1]
  const lastAssistantId = lastMessage?.role === 'assistant' ? lastMessage.id : undefined
  const previousAssistantIdRef = useRef(lastAssistantId)
  const speakingTimerRef = useRef<number | null>(null)
  const [answerSpeaking, setAnswerSpeaking] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(0)
  const [mouthForm, setMouthForm] = useState(0)

  useEffect(() => {
    initializeConnection()
    return () => disconnectConnection()
  }, [disconnectConnection, initializeConnection])

  useEffect(() => {
    if (previousAssistantIdRef.current === lastAssistantId) return
    previousAssistantIdRef.current = lastAssistantId
    if (!lastAssistantId) return
    setAnswerSpeaking(true)
    if (speakingTimerRef.current !== null) window.clearTimeout(speakingTimerRef.current)
    speakingTimerRef.current = window.setTimeout(() => {
      speakingTimerRef.current = null
      setAnswerSpeaking(false)
    }, 1500)
  }, [lastAssistantId])

  const robotState: RobotState = answerSpeaking ? 'speaking' : guideStatusToRobotState(guideStatus)

  useEffect(() => {
    if (robotState !== 'speaking') {
      setMouthOpen(0)
      setMouthForm(0)
      return
    }
    let frame = 0
    const timer = window.setInterval(() => {
      frame += 1
      setMouthOpen(frame % 2 ? 0.46 : 0.1)
      setMouthForm(frame % 3 === 0 ? 0.14 : -0.04)
    }, 125)
    return () => {
      window.clearInterval(timer)
      setMouthOpen(0)
      setMouthForm(0)
    }
  }, [robotState])

  useEffect(() => () => {
    if (speakingTimerRef.current !== null) window.clearTimeout(speakingTimerRef.current)
  }, [])

  const value = useMemo(() => ({
    robotState,
    mouthOpen,
    mouthForm,
    connectionState,
    sceneId: GUIDE_RUNTIME_SCENE_ID
  }), [connectionState, mouthForm, mouthOpen, robotState])

  return <XiaolingRuntimeContext.Provider value={value}>{children}</XiaolingRuntimeContext.Provider>
}
