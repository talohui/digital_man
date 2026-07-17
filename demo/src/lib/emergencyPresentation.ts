import type { EmergencyEvent } from '../api/emergencies'

export type PublicEmergencyEvent = EmergencyEvent

export function eventVersion(event: PublicEmergencyEvent): string {
  return `${event.id}:${event.updatedAt ?? event.validFrom}`
}

export function presentationFor(event: PublicEmergencyEvent): { mode: 'modal' | 'banner'; requiresAcknowledgement: boolean } {
  const critical = event.severity === 'CRITICAL'
  return { mode: critical ? 'modal' : 'banner', requiresAcknowledgement: critical }
}

export function shouldAnnounce(event: PublicEmergencyEvent, announcedVersions: ReadonlySet<string>): boolean {
  return !announcedVersions.has(eventVersion(event))
}
