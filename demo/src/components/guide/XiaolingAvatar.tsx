import { useXiaolingPortrait } from './xiaolingPortrait'

export type XiaolingAvatarSize = 'tab' | 'small' | 'floating'

export function XiaolingAvatar({
  size = 'small',
  className = ''
}: {
  size?: XiaolingAvatarSize
  className?: string
}) {
  const portrait = useXiaolingPortrait()
  const classes = `xiaoling-avatar xiaoling-avatar--${size}${className ? ` ${className}` : ''}`
  const portraitUrl = portrait.url || '/icons/lingshan-guide-avatar-real.png'

  return (
    <span className={`${classes}${portrait.ready ? ' is-ready' : ''}`} aria-hidden="true" data-xiaoling-portrait-ready={portrait.ready ? 'true' : 'false'}>
      <img src={portraitUrl} alt="" />
    </span>
  )
}
