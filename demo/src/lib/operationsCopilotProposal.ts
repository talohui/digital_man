export type OperationsCopilotProposalType =
  | 'EMERGENCY_DRAFT'
  | 'KB_CREATE'
  | 'KB_UPDATE'
  | 'KB_DEACTIVATE'

export type OperationsCopilotProposalStatus = 'DRAFT' | 'CONFIRMED' | 'DISCARDED' | 'FAILED' | 'RECONCILING'

export function isConfirmableProposal(proposal: { status: string; type?: OperationsCopilotProposalType }): boolean {
  return proposal.status === 'DRAFT'
    && proposal.type !== 'KB_UPDATE'
    && proposal.type !== 'KB_DEACTIVATE'
}
