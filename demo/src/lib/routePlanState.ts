import type { PlanV2PlanningMode } from './planV2Interactions'

export type RoutePlanStep = 1 | 2 | 3
export type RouteSelectionSource = 'manual' | 'smart' | null
export type SmartRefreshPhase = 'idle' | 'awaiting-loading' | 'loading'

export type RoutePlanState = {
  planningMode: PlanV2PlanningMode
  selectionSource: RouteSelectionSource
  activeStep: RoutePlanStep
  selectedRouteId: string
  hasChosenRoute: boolean
  selectedStopId: string
  selectionMessage: string
  advancedOpen: boolean
  showAllRoutes: boolean
  drawerOpen: boolean
  draft: string
  lastRequest: string
  reply: string
  smartRefreshPhase: SmartRefreshPhase
}

export type RoutePlanAction =
  | { type: 'SET_MODE'; mode: PlanV2PlanningMode }
  | { type: 'GO_TO_STEP'; step: RoutePlanStep }
  | { type: 'PREFERENCES_CHANGED' }
  | { type: 'RECONCILE_ROUTES'; routeId: string }
  | { type: 'CHOOSE_ROUTE'; routeId: string; source: Exclude<RouteSelectionSource, null>; message: string }
  | { type: 'SUGGEST_ROUTE'; routeId: string; message: string }
  | { type: 'REOPEN_CHOOSER'; message: string }
  | { type: 'TOGGLE_ADVANCED' }
  | { type: 'TOGGLE_ALL_ROUTES' }
  | { type: 'OPEN_ASSISTANT' }
  | { type: 'CLOSE_ASSISTANT' }
  | { type: 'SET_DRAFT'; draft: string }
  | { type: 'SUBMIT_REQUEST'; request: string; reply: string; awaitRecommendations: boolean }
  | { type: 'RECOMMENDATIONS_LOADING' }
  | { type: 'SELECT_STOP'; stopId: string }
  | { type: 'START_FAILED'; message: string }

export function createRoutePlanState(input: {
  selectedRouteId: string
  activeStep?: RoutePlanStep
  hasChosenRoute?: boolean
  selectedStopId?: string
}): RoutePlanState {
  return {
    planningMode: 'smart',
    selectionSource: null,
    activeStep: input.activeStep ?? 1,
    selectedRouteId: input.selectedRouteId,
    hasChosenRoute: Boolean(input.hasChosenRoute),
    selectedStopId: input.selectedStopId ?? '',
    selectionMessage: '',
    advancedOpen: false,
    showAllRoutes: false,
    drawerOpen: false,
    draft: '',
    lastRequest: '',
    reply: '',
    smartRefreshPhase: 'idle'
  }
}

export function routePlanReducer(state: RoutePlanState, action: RoutePlanAction): RoutePlanState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, planningMode: action.mode }
    case 'GO_TO_STEP':
      return { ...state, activeStep: action.step }
    case 'PREFERENCES_CHANGED':
      return { ...state, hasChosenRoute: false, selectionSource: null }
    case 'RECONCILE_ROUTES':
      return {
        ...state,
        selectedRouteId: action.routeId,
        hasChosenRoute: false,
        selectedStopId: '',
        selectionSource: null
      }
    case 'CHOOSE_ROUTE':
      return {
        ...state,
        selectedRouteId: action.routeId,
        hasChosenRoute: true,
        activeStep: 3,
        selectedStopId: '',
        selectionMessage: action.message,
        selectionSource: action.source,
        planningMode: action.source,
        drawerOpen: false,
        smartRefreshPhase: 'idle'
      }
    case 'SUGGEST_ROUTE':
      return {
        ...state,
        selectedRouteId: action.routeId,
        hasChosenRoute: false,
        selectedStopId: '',
        selectionMessage: action.message,
        selectionSource: null,
        smartRefreshPhase: 'idle'
      }
    case 'REOPEN_CHOOSER':
      return {
        ...state,
        hasChosenRoute: false,
        activeStep: 3,
        selectionMessage: action.message,
        selectionSource: null
      }
    case 'TOGGLE_ADVANCED':
      return { ...state, advancedOpen: !state.advancedOpen }
    case 'TOGGLE_ALL_ROUTES':
      return { ...state, showAllRoutes: !state.showAllRoutes }
    case 'OPEN_ASSISTANT':
      return { ...state, drawerOpen: true, planningMode: 'smart' }
    case 'CLOSE_ASSISTANT':
      return { ...state, drawerOpen: false }
    case 'SET_DRAFT':
      return { ...state, draft: action.draft }
    case 'SUBMIT_REQUEST':
      return {
        ...state,
        hasChosenRoute: false,
        draft: '',
        lastRequest: action.request,
        reply: action.reply,
        selectionSource: null,
        smartRefreshPhase: action.awaitRecommendations ? 'awaiting-loading' : 'idle'
      }
    case 'RECOMMENDATIONS_LOADING':
      return state.smartRefreshPhase === 'awaiting-loading'
        ? { ...state, smartRefreshPhase: 'loading' }
        : state
    case 'SELECT_STOP':
      return state.selectedStopId === action.stopId ? state : { ...state, selectedStopId: action.stopId }
    case 'START_FAILED':
      return { ...state, selectionMessage: action.message }
    default:
      return state
  }
}
