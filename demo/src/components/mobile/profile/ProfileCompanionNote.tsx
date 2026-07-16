import { RightOutlined } from '@ant-design/icons'
import '../../../styles/c-app/profileCompanionNote.css'

type ProfileCompanionNoteProps = {
  latestSpotName?: string
  onOpen: () => void
}

function ProfileCompanionNote({ latestSpotName, onOpen }: ProfileCompanionNoteProps) {
  const title = latestSpotName
    ? `我还记得，你刚走到${latestSpotName}`
    : '等你启程，我一路陪伴'
  const message = latestSpotName
    ? '想继续听故事、找下一个景点，或是放慢脚步，都可以告诉我。'
    : '我会根据你的偏好、行程与当下位置，给出恰好的建议。'

  return (
    <section className="profile-companion-note" aria-labelledby="profile-companion-note-title">
      <span className="profile-companion-note__binding" aria-hidden="true"><i /><i /><i /></span>
      <header className="profile-companion-note__head">
        <span><small>小灵陪伴</small><strong>今日留笺</strong></span>
        <i aria-hidden="true">灵</i>
      </header>

      <div className="profile-companion-note__body">
        <span className="profile-companion-note__quote" aria-hidden="true">“</span>
        <h2 id="profile-companion-note-title">{title}</h2>
        <p>{message}</p>
      </div>

      <footer className="profile-companion-note__footer">
        <span>留笺会随你的行程更新</span>
        <button type="button" onClick={onOpen}>和小灵说说话 <RightOutlined /></button>
      </footer>
    </section>
  )
}

export default ProfileCompanionNote
export type { ProfileCompanionNoteProps }
