import type { CSSProperties } from 'react'

import '../../../styles/c-app/marketCategoryTabs.css'

type MarketCategoryItem = {
  id: string
  label: string
  icon: string
}

type MarketCategoryTabsProps = {
  items: MarketCategoryItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
  className?: string
}

function MarketCategoryTabs({
  items,
  value,
  onChange,
  ariaLabel = '消费分类',
  className = ''
}: MarketCategoryTabsProps) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === value))
  const rootStyle = {
    '--market-category-count': items.length,
    '--market-category-offset': `${activeIndex * 100}%`,
    '--market-category-gap-offset': `${activeIndex * 5}px`
  } as CSSProperties

  return (
    <div
      className={`market-category-tabs ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      style={rootStyle}
    >
      <span className="market-category-tabs__rail" aria-hidden="true" />
      <span className="market-category-tabs__cursor" aria-hidden="true"><i /><i /></span>
      <div className="market-category-tabs__items">
        {items.map((item, index) => {
          const active = item.id === value

          return (
            <button
              key={item.id}
              className={active ? 'is-active' : ''}
              type="button"
              aria-pressed={active}
              style={{ '--market-category-order': index } as CSSProperties}
              onClick={() => onChange(item.id)}
            >
              <span className="market-category-tabs__icon">
                <img src={item.icon} alt="" />
              </span>
              <strong>{item.label}</strong>
              <i className="market-category-tabs__mark" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MarketCategoryTabs
export type { MarketCategoryItem, MarketCategoryTabsProps }
