import '../../../styles/c-app/profilePreferenceCard.css'

type ProfilePreferenceEntry = {
  key: string
  label: string
  value: string
}

type ProfilePreferenceCardProps = {
  tags: string[]
  entries: ProfilePreferenceEntry[]
  profileVersion?: number
}

function ProfilePreferenceCard({ tags, entries, profileVersion }: ProfilePreferenceCardProps) {
  const displayTags = tags.length > 0 ? tags : ['祈福静心']

  return (
    <article className="profile-preference-card" aria-labelledby="profile-preference-title">
      <span className="profile-preference-card__binding" aria-hidden="true"><i /><i /></span>
      <header className="profile-preference-card__head">
        <div><small>行旅心谱</small><h2 id="profile-preference-title">我的偏好</h2></div>
        <span className="profile-preference-card__seal" aria-hidden="true"><b>心</b><b>谱</b></span>
      </header>

      <section className="profile-preference-card__focus" aria-label="核心偏好">
        <span><small>此行更偏爱</small><i aria-hidden="true" /></span>
        <div>
          {displayTags.map((tag, index) => (
            <strong key={tag}><i>{String(index + 1).padStart(2, '0')}</i>{tag}</strong>
          ))}
        </div>
      </section>

      <dl className="profile-preference-card__ledger">
        {entries.map((entry, index) => (
          <div key={entry.key}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <dt>{entry.label}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="profile-preference-card__foot">
        <span><i aria-hidden="true" />根据你的选择与游历持续调整</span>
        <b>{profileVersion ? `心谱 V${profileVersion}` : '感知中'}</b>
      </footer>
    </article>
  )
}

export default ProfilePreferenceCard
export type { ProfilePreferenceCardProps, ProfilePreferenceEntry }
