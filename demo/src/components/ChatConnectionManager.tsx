import { useEffect } from 'react'

import { initPosthog } from '../lib/analytics'
import { useChatStore } from '../store/useChatStore'

function ChatConnectionManager() {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)

  useEffect(() => {
    initPosthog()
    initializeConnection()

    return () => {
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection])

  return null
}

export default ChatConnectionManager
