type ActionIdentity = {
  cardId?: string | null
  actionText: string
}

export function decisionActionKey(cardId: string | null | undefined, actionText: string): string {
  const scopedCard = cardId?.trim() || 'unscoped'
  return `${scopedCard}::${actionText.trim()}`
}

export function indexDecisionActions<T extends ActionIdentity>(actions: T[]): Record<string, T> {
  const indexed: Record<string, T> = {}
  for (const action of actions) {
    indexed[decisionActionKey(action.cardId, action.actionText)] = action
    // Older live decision payloads may omit cardId. Within one snapshot the action
    // text is unique, so retain an unscoped lookup only as a compatibility alias.
    indexed[decisionActionKey(undefined, action.actionText)] = action
  }
  return indexed
}

const TRANSITION_ACTION_LABELS: Record<string, string> = {
  ACCEPTED: '接受并分派',
  IN_PROGRESS: '开始执行',
  COMPLETED: '标记完成',
  DISMISSED: '驳回建议',
}

export function transitionActionLabel(status: string): string {
  return TRANSITION_ACTION_LABELS[status] ?? status
}
