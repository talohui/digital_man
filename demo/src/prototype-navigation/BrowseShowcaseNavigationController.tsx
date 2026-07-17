import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { goToPoiFromBrowse } from '../lib/mapGuideNavigation'
import type { Map3DGuideMapRuntime, ScenicMapPresentation } from '../pages/Map3DGuidePage'
import { NavigationPrototypeCard } from './NavigationPrototypeCard'
import { NavigationPrototypeMapLayer } from './NavigationPrototypeMapLayer'
import { NavigationPrototypeUserMarkerLayer } from './NavigationPrototypeUserMarkerLayer'
import { isNavigationDebugEnabled } from './navigationDebug'
import { createNavigationBetaViewModel } from './navigationBetaViewModel'
import {
  consumeShowcaseNavigationHandoff,
  saveConfirmedShowcaseArrival,
  type ShowcaseNavigationHandoff
} from './showcaseNavigation'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import { useSimulatedNavigationFallback } from './useSimulatedNavigationFallback'
import '../styles/map/mapRouteMobile.css'
import '../styles/map/mapBrowseNavigation.css'

export function BrowseShowcaseNavigationController({
  presentation,
  mapRuntime
}: {
  presentation: ScenicMapPresentation
  mapRuntime: Map3DGuideMapRuntime | null
}) {
  const navigate = useNavigate()
  const [handoff] = useState<ShowcaseNavigationHandoff | undefined>(() => consumeShowcaseNavigationHandoff())
  const startAttemptedRef = useRef(false)
  const snapshot = useNavigationPrototypeStore()
  const prepareTarget = useNavigationPrototypeStore((state) => state.prepareTarget)
  const requestPreparedNavigation = useNavigationPrototypeStore((state) => state.requestPreparedNavigation)
  const dismissPreparedNavigation = useNavigationPrototypeStore((state) => state.dismissPreparedNavigation)
  const pauseNavigation = useNavigationPrototypeStore((state) => state.pauseNavigation)
  const resumeNavigation = useNavigationPrototypeStore((state) => state.resumeNavigation)
  const resumeReplayNavigation = useNavigationPrototypeStore((state) => state.resumeReplayNavigation)
  const cancelNavigation = useNavigationPrototypeStore((state) => state.cancelNavigation)
  const rerouteNavigation = useNavigationPrototypeStore((state) => state.reroute)
  const continueCurrentRoute = useNavigationPrototypeStore((state) => state.continueCurrentRoute)
  const continueAfterArrivalDetection = useNavigationPrototypeStore((state) => state.continueAfterArrivalDetection)
  const activeShowcaseTarget = snapshot.session?.replayPurpose === 'showcase'
    && snapshot.session.target.mode === 'free-poi'
    ? snapshot.session.target
    : undefined
  const target = handoff?.target ?? activeShowcaseTarget
  const simulatedNavigation = useSimulatedNavigationFallback({
    target,
    simulationOrigin: handoff?.origin.position,
    purpose: 'showcase',
    originLabel: handoff?.origin.name
  })

  useEffect(() => {
    if (!handoff || startAttemptedRef.current) return
    startAttemptedRef.current = true
    simulatedNavigation.start()
  }, [handoff, simulatedNavigation])

  const closeNavigation = useCallback(() => {
    cancelNavigation()
  }, [cancelNavigation])

  const openTargetDetail = useCallback(() => {
    const arrivedTarget = useNavigationPrototypeStore.getState().session?.target
    if (!arrivedTarget || arrivedTarget.mode !== 'free-poi') return
    saveConfirmedShowcaseArrival(arrivedTarget)
    cancelNavigation()
    goToPoiFromBrowse(navigate, arrivedTarget.poiId, presentation, { replace: true })
  }, [cancelNavigation, navigate, presentation])

  const viewModel = useMemo(() => createNavigationBetaViewModel({
    ...snapshot,
    debugEnabled: isNavigationDebugEnabled(),
    simulatedNavigationAvailable: false
  }, {
    enterPermissionIntro: () => target && prepareTarget(target),
    requestPermissionAndStart: requestPreparedNavigation,
    dismissPermissionIntro: dismissPreparedNavigation,
    retryLocation: resumeNavigation,
    retryPlanning: requestPreparedNavigation,
    pause: pauseNavigation,
    resume: snapshot.locationSource === 'replay-gcj02' ? resumeReplayNavigation : resumeNavigation,
    cancel: closeNavigation,
    reroute: () => void rerouteNavigation(),
    continueCurrentRoute,
    confirmArrival: openTargetDetail,
    continueAfterArrivalDetection,
    continueRestoredSession: snapshot.locationSource === 'replay-gcj02' ? resumeReplayNavigation : resumeNavigation,
    discardRestoredSession: closeNavigation,
    startSimulatedNavigation: () => { /* Formal showcase starts only from an explicit C-side action. */ }
  }), [
    closeNavigation,
    continueAfterArrivalDetection,
    continueCurrentRoute,
    dismissPreparedNavigation,
    openTargetDetail,
    pauseNavigation,
    prepareTarget,
    requestPreparedNavigation,
    rerouteNavigation,
    resumeNavigation,
    resumeReplayNavigation,
    snapshot,
    target
  ])

  if (!target || !viewModel.visible) return null

  return (
    <>
      <NavigationPrototypeMapLayer runtime={mapRuntime} />
      <NavigationPrototypeUserMarkerLayer runtime={mapRuntime} />
      <div className="map-browse-navigation-sheet">
        <NavigationPrototypeCard viewModel={viewModel} />
      </div>
    </>
  )
}
