import {
  createContext,
  useContext,
  useEffect,
  type Dispatch,
  type SetStateAction
} from 'react'

export type AdminOpsActions = {
  refreshedAt?: string
  refreshing?: boolean
  onRefresh?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
}

export const AdminOpsPageActionsContext = createContext<
  Dispatch<SetStateAction<AdminOpsActions>> | null
>(null)

export function useAdminOpsPageActions(actions: AdminOpsActions) {
  const setActions = useContext(AdminOpsPageActionsContext)

  useEffect(() => {
    if (!setActions) return
    setActions(actions)
    return () => setActions({})
  }, [setActions, actions.onExport, actions.onRefresh, actions.refreshedAt, actions.refreshing])
}
