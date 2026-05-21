import type { UserProfileSnapshot } from '../data/guideData'

type Props = {
  profile: UserProfileSnapshot | null
}

const PERSONA_EMOJI: Record<string, string> = {
  culture_pilgrim: '🪷',
  serenity_seeker: '🍃',
  family_explorer: '🧒'
}

const ATOM_ORDER = ['culture', 'ritual', 'family', 'photo', 'walk_light', 'deep_guide'] as const
const ATOM_NICE: Record<string, string> = {
  culture: '文化',
  ritual: '礼佛',
  family: '亲子',
  photo: '摄影',
  walk_light: '漫步',
  deep_guide: '深度'
}

function ProfileBadge({ profile }: Props) {
  const empty = !profile || !profile.primaryPersona || profile.profileVersion === 0
  const score = profile?.primaryScore ?? 0
  const personaLabel = profile?.primaryPersonaLabel ?? ''
  const emoji = profile?.primaryPersona ? PERSONA_EMOJI[profile.primaryPersona] ?? '🪷' : '◯'

  if (empty) {
    return (
      <div className="profile-badge profile-badge--empty">
        <div className="profile-badge__avatar profile-badge__avatar--empty">◯</div>
        <div className="profile-badge__body">
          <p className="profile-badge__eyebrow">个性画像</p>
          <p className="profile-badge__title">正在感知你的兴趣…</p>
          <p className="profile-badge__hint">勾选标签或开始对话,即可生成你的专属画像</p>
        </div>
      </div>
    )
  }

  const vec = profile.interestVector ?? {}
  const maxVal = Math.max(0.001, ...ATOM_ORDER.map((k) => vec[k] ?? 0))

  return (
    <div className="profile-badge">
      <div className="profile-badge__avatar">
        <span>{emoji}</span>
      </div>

      <div className="profile-badge__body">
        <p className="profile-badge__eyebrow">个性画像 · v{profile.profileVersion}</p>
        <p className="profile-badge__title">
          你当前更接近 <strong>{personaLabel}</strong>
          <span className="profile-badge__score">{Math.round(score * 100)}%</span>
        </p>
        <div className="profile-badge__chips">
          {(profile.secondaryPreferences ?? []).map((p) => (
            <span key={p} className="profile-badge__chip">{p}</span>
          ))}
        </div>
      </div>

      <div className="profile-badge__radar" aria-hidden>
        {ATOM_ORDER.map((atom) => {
          const v = vec[atom] ?? 0
          const h = Math.max(8, Math.round((v / maxVal) * 100))
          return (
            <div key={atom} className="profile-badge__bar-col" title={`${ATOM_NICE[atom]} ${(v * 100).toFixed(0)}%`}>
              <div className="profile-badge__bar" style={{ height: `${h}%` }} />
              <span>{ATOM_NICE[atom]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProfileBadge
