# C 端视觉组件规范

本文记录已经确认的 C 端新中式视觉组件，作为首页、消费页及后续移动端页面改造的实现基线。普通 C 端页面以 `430px` 为最大内容宽度；地图、沉浸式导航等特殊全屏页面不强制套用该宽度。

## 1. 组件清单

| 组件 | 状态 | 主要用途 | 文件 |
| --- | --- | --- | --- |
| `PlaqueTitle` | 正式首页已使用 | 山门模块的独立牌匾标题 | `src/components/mobile/home/PlaqueTitle.tsx` |
| `MountainGate` | 正式首页已使用 | 路线、服务入口、客流内容的山门容器 | `src/components/mobile/home/MountainGate.tsx` |
| `MarketTitle` | 设计已确认，当前用于本地消费页预览 | 消费页面的轻卷册栏目题签 | `src/components/mobile/consume/MarketTitle.tsx` |
| `EntrancePassScroll` | 设计已确认，当前用于本地入园票预览 | 可填充日期、人数、票种、核验码与条码的灵山入境票卷 | `src/components/mobile/ticket/EntrancePassScroll.tsx` |
| `MarketCategoryTabs` | 设计已确认，当前用于本地消费页预览 | 消费目录分类切换与当前章节提示 | `src/components/mobile/consume/MarketCategoryTabs.tsx` |
| `XiaolingRecommendationNote` | 设计已确认，当前用于本地消费页预览 | 小灵结合行程给出的单项消费推荐 | `src/components/mobile/consume/XiaolingRecommendationNote.tsx` |
| `MarketMoonWindow` | 设计已确认，当前用于本地消费页预览 | 餐饮、交通等生活服务商品图的月洞窗画框 | `src/components/mobile/consume/MarketMoonWindow.tsx` |
| `MarketBoguWindow` | 设计已确认，当前用于本地消费页预览 | 文创、演艺等陈列型商品图的方圆博古窗画框 | `src/components/mobile/consume/MarketBoguWindow.tsx` |
| `MarketProductLedger` | 设计已确认，当前用于本地消费页预览 | 商品目录、价格、选取数量与算盘珠交互 | `src/components/mobile/consume/MarketProductLedger.tsx` |
| `MarketCartDock` | 设计已确认，当前用于本地消费页预览 | 汇总已选件数与金额，并打开购物袋明细 | `src/components/mobile/consume/MarketCartDock.tsx` |
| `MarketCartSheet` | 设计已确认，当前用于本地消费页预览 | 以经折货筹册核对已选商品、数量与金额 | `src/components/mobile/consume/MarketCartSheet.tsx` |
| `ProfileCompanionNote` | 正式个人中心已使用 | 小灵今日留笺与正式对话返回链路 | `src/components/mobile/profile/ProfileCompanionNote.tsx` |
| `ProfilePreferenceCard` | 正式个人中心已使用 | 展示核心偏好、分组行程偏好和心谱状态 | `src/components/mobile/profile/ProfilePreferenceCard.tsx` |
| `XiaolingFloatingCompanion` | 正式地图普通浏览页已使用 | 地图底部的小灵随行提示、问小灵与路线入口 | `src/components/guide/XiaolingFloatingCompanion.tsx` |
| `XiaolingConversationSurface` | 设计已确认，正式地图抽屉与全屏会话均已使用 | 地图小灵抽屉与全屏会话的共用消息、荐笺和输入界面 | `src/components/guide/XiaolingConversationSurface.tsx` |
| `GuideRecommendationCard` | 设计已确认，正式地图抽屉与全屏会话均已使用 | 路线、景点、导航、进度及后续业务推荐的通用荐笺 | `src/components/guide/GuideRecommendationCard.tsx` |
| `MapServicePanel` | 正式地图普通浏览与路线页均已使用 | 洗手间、休息区、餐饮点和出口的共用游园服务面板 | `src/components/map/MapServicePanel.tsx` |

消费组件目录只导出已经确认的组件。此前用于方向探索的连续册页、博古架陈列和市集悬牌变体不属于组件 API，已经删除。

## 2. 共用视觉基线

- 深绿色：`#2D4A3E`
- 深文字绿：`#203B33`
- 米白色：`#F5F1E8`
- 暖金色：`#C9A86A`
- 浅青灰：`#DDE9E7`
- 普通 C 端页面最大宽度：`430px`
- 字体基线：`src/styles/c-app/cAppTypography.css`
- 页面应保留移动端安全区和固定底部导航所需的底部空间。

这些组件用于建立统一的东方建筑、卷册和宣纸语言，不应在同一页面重复叠加大量金边、阴影或仿古纹样。

整体视觉遵循“功能先于造型、隐喻形成关系、动效解释状态”的原则：标题负责建立章节，分类负责切换目录，内容容器负责承载信息；东方元素必须能解释组件职责，而不是独立装饰。强调状态优先使用位置、细线、浅色纸面和局部印记，避免大面积深色填充。

## 3. PlaqueTitle：牌匾标题

### 文件位置

- 组件：`src/components/mobile/home/PlaqueTitle.tsx`
- 样式：`src/styles/c-app/mobileHome.css`
- 正式用例：`src/mobile/MobileHomePage.tsx`

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `ReactNode` | 必填 | 牌匾正文 |
| `id` | `string` | 无 | 标题元素 ID，可供 `aria-labelledby` 使用 |
| `size` | `small \| medium \| large` | `medium` | 控制牌匾尺寸 |
| `level` | `2 \| 3` | `2` | 语义化标题层级 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
<PlaqueTitle title="景区服务" size="medium" />
```

### 设计与使用规则

- 统一使用深绿底、暖金描边和两侧挂耳。
- 牌匾独立于内容山门，用于建立清晰章节层级。
- 只承担标题语义，不应直接充当按钮。
- 页面内同级牌匾应保持相同尺寸；只在主次层级明确时改变 `size`。

## 4. MountainGate：山门内容容器

### 文件位置

- 组件：`src/components/mobile/home/MountainGate.tsx`
- 样式：`src/styles/c-app/mobileHome.css`
- 正式用例：`src/mobile/MobileHomePage.tsx`

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | 必填 | 山门内部任意内容 |
| `variant` | `route \| services \| crowd` | `services` | 处理各模块的高度和细节差异 |
| `delay` | `number` | `0` | 入场开门动画延迟，单位毫秒 |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | 无 | `route` 按钮的点击处理函数 |
| `ariaLabel` | `string` | 无 | `route` 按钮的无障碍名称 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
<section>
  <PlaqueTitle title="景区服务" />
  <MountainGate variant="services" delay={1445}>
    {/* 四个服务入口 */}
  </MountainGate>
</section>
```

### 设计与使用规则

- 统一包含屋檐、左右立柱、米白渐变底板和完整描边。
- 内容必须收束在两根立柱之间，不得越出底板边框。
- `route` 始终渲染为按钮，用于单一主要操作；`services` 用于均分入口，`crowd` 用于客流内容。
- 页面开场时可配合金色导引线，按导引线抵达顺序设置 `delay`，使山门依次开启。
- 动画必须尊重 `prefers-reduced-motion`，不可把动画完成作为内容可用的前提。

## 5. MarketTitle：轻卷册栏目题签

### 文件位置

- 组件：`src/components/mobile/consume/MarketTitle.tsx`
- 独立样式：`src/styles/c-app/marketTitle.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`
- 本地路由：`/consume-components`

目前该组件的视觉和展开动画已经确认，但尚未迁移进正式消费页。正式迁移时应直接复用组件，不要复制预览页中的结构或样式。

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | 必填 | 栏目主标题 |
| `eyebrow` | `string` | 无 | 主标题上方的小型栏目文字 |
| `description` | `string` | 无 | `welcome` 变体的正文 |
| `aside` | `ReactNode` | 无 | 右侧辅助内容，保持简短 |
| `action` | `ReactNode` | 无 | `welcome` 变体右下角的操作 |
| `id` | `string` | 无 | 标题元素 ID，可供 `aria-labelledby` 使用 |
| `level` | `1 \| 2 \| 3` | `2` | 语义化标题层级 |
| `variant` | `title \| welcome` | `title` | 标准题签或小灵迎宾长卷 |
| `animated` | `boolean` | `true` | 是否播放首次展开动画 |
| `animationDelay` | `number` | `0` | 展开动画延迟，单位毫秒 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
<MarketTitle
  eyebrow="灵山四集"
  title="景区消费"
  aside="按需选择"
  animationDelay={180}
/>
```

### 视觉结构与动画

- 左右卷头、卷尾使用深绿色，并以暖金线条表现竹简分节；中间使用米白宣纸底。
- `title` 用于普通栏目题签；`welcome` 在保留同一卷轴结构的前提下，可承载小灵首次对白与单一操作。
- `welcome` 的完整小灵数字人应位于卷轴上方的独立舞台层；组件不依赖头像或数字人资源。
- 卷轴由左向右展开，卷面和文字跟随卷尾逐步显现。
- 组件通过 `ResizeObserver` 计算真实展开距离，适应 `375px`、`390px`、`430px` 等宽度。
- 卷面使用裁切显现，不在动画过程中改变页面布局宽度。
- 前 `86%` 时间内卷面与卷尾同步到达终点；最后阶段仅卷尾进行轻微越位、回缩和归位，形成完全展开后的回弹感。
- `prefers-reduced-motion: reduce` 下直接显示完整内容。
- 如预览页面需要重复播放，可通过更换组件 `key` 重新挂载；这不是正式业务组件必须暴露的接口。

## 6. EntrancePassScroll：灵山入境票卷

购票流程统一采用三级移动端字号：眉题与标签 `10px`、说明与辅助信息 `11px`、正文与文字按钮 `12px`。页面主标题、票种名称、金额、数量和纯图形符号继续按视觉层级放大。该规则由 `src/styles/c-app/ticketV2.css` 中的 `--ticket-type-eyebrow`、`--ticket-type-caption` 与 `--ticket-type-body` 维护，并且只在 `.ticket-v2-preview` 内生效，避免改变消费页复用组件。

`EntrancePassScroll` 是上述字号规则的明确例外：它需要适配完整票面插画及动态核验信息，继续使用 `src/styles/c-app/entrancePassScroll.css` 中的独立票面比例，不被购票流程的三级字号覆盖。

### 文件位置

- 组件：`src/components/mobile/ticket/EntrancePassScroll.tsx`
- 独立样式：`src/styles/c-app/entrancePassScroll.css`
- 当前用例：`src/mobile/MobileTicketPageV2.tsx`
- 默认票面资源：`public/images/ticket-v2/lingshan-entrance-pass-scroll.png`

### 接口

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `visitDateLabel` | `string` | 格式化后的入园日期 |
| `partyCount` | `number` | 入园同行人数 |
| `totalLabel` | `string` | 已格式化的票款 |
| `ticketSummary` | `string` | 票种与数量摘要 |
| `verificationCode` | `string` | 由正式票务服务生成的核验码 |
| `barcodeWidths` | `number[]` | 条码线条宽度比例；原型可随机生成，正式版应由可信条码图片或编码器替换 |
| `backgroundSrc` | `string` | 可选票面背景，默认使用当前灵山入境票卷资源 |
| `animated` | `boolean` | 是否在挂载时播放左至右开卷、卷尾轻回弹与条码联落下；默认 `true` |
| `className` | `string` | 追加页面布局类名 |

### 设计与使用规则

- 票面主视觉是完整展开的入境票卷；动态信息只落在下方预留区域，不叠加第二个票名。
- 条形码作为票卷下方独立核验联，居中展示，不能伪装为可直接使用的真实闸机码。
- 开卷动效只使用 `clip-path`、`transform` 与 `opacity`；尊重 `prefers-reduced-motion`，减少动态偏好下直接展示完整票卷。
- 正式票务接入时，由服务端提供核验码、动态条码或二维码图片；前端不能自行生成可用于入园核验的凭证。
- 适用于已购票状态、我的行程票券与入园记录；购票选择阶段不使用，避免和“入园票笺目录”混淆。

```tsx
<EntrancePassScroll
  visitDateLabel="7月15日 周三"
  partyCount={2}
  totalLabel="¥420"
  ticketSummary="成人票 × 2"
  verificationCode="LS-20260715-02P"
  barcodeWidths={[1, 3, 2, 1, 2]}
/>
```

## 7. MarketCategoryTabs：移动卷签分类目录

消费页及其组件预览统一使用三级移动端字号：眉题与标签 `10px`、说明与辅助信息 `11px`、正文与文字按钮 `12px`。商品名称、栏目标题、价格、数量和纯图形符号继续按视觉层级放大。字号基线集中维护在 `src/styles/c-app/consumeTypography.css`，并只作用于 `.consume-v2-preview` 与 `.scroll-title-preview`，避免影响首页、购票页和个人中心对共享组件的使用。

### 文件位置

- 组件：`src/components/mobile/consume/MarketCategoryTabs.tsx`
- 独立样式：`src/styles/c-app/marketCategoryTabs.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`
- 本地路由：`/consume-components`

该组件视觉与切换交互已经确认，但尚未迁移进正式消费页。它用于切换当前商品目录，不负责页面跳转，也不承载商品内容。

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `MarketCategoryItem[]` | 必填 | 分类数组；每项包含 `id`、`label`、`icon` |
| `value` | `string` | 必填 | 当前选中的分类 ID |
| `onChange` | `(id: string) => void` | 必填 | 点击分类后的受控切换回调 |
| `ariaLabel` | `string` | `消费分类` | 分类按钮组的无障碍名称 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
const categories = [
  { id: 'food', label: '餐饮斋茶', icon: '/icons/cat-food.png' },
  { id: 'culture', label: '文创礼品', icon: '/icons/cat-culture.png' },
  { id: 'transport', label: '园内交通', icon: '/icons/cat-transport.png' },
  { id: 'show', label: '演艺秀场', icon: '/icons/cat-show.png' }
]

<MarketCategoryTabs
  items={categories}
  value={category}
  onChange={setCategory}
/>
```

### 视觉结构

- 以垂签书签建立“目录章节”语义，四项在同一册页中等分，而不是四张独立业务卡片。
- 上下卷册边界负责收束四个分类，颜色与 `MarketTitle` 的深绿、米白和暖金体系一致。
- 当前章节由一个淡青绿色卷签框标识，不使用大面积深绿色填充。
- 轻量选中态由浅青纸色、暖金细线、图标细环和右上角小方印共同构成。
- 当前垂签下移 `4px`，既表达书签被抽出，也维持四项整体稳定。

### 切换动效

- 组件是受控分类按钮组；点击后由 `value` 决定移动卷签的位置。
- 移动卷签框沿册页横向滑向目标章节，随后新章节书签轻落、略微回稳。
- 卷签移动距离根据分类数量、列宽和列间距计算，支持 `375px`、`390px`、`430px` 页面宽度。
- 当前图标金环、标题金线和小方印稍晚于卷签移动显现，形成“翻册—抵达—落签”的状态顺序。
- `prefers-reduced-motion: reduce` 下取消滑动、回弹和延迟，不影响分类切换。

### 使用边界

- 只用于同一页面内的目录筛选，不用作路由导航或四项服务入口。
- `items` 数量可以由组件计算，但移动端消费页当前规范为四项；增加数量前必须重新验证可读性和触控宽度。
- 外部需要缩窄组件时，应同时设置明确宽度与对称 margin，避免 `width: 100%` 与外边距叠加导致视觉偏移。
- 图标只辅助识别，分类名称才是主要信息；不可只显示图标。

## 8. XiaolingRecommendationNote：小灵灵山花笺

### 文件位置

- 组件：`src/components/mobile/consume/XiaolingRecommendationNote.tsx`
- 独立样式：`src/styles/c-app/xiaolingRecommendationNote.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`
- 本地路由：`/consume-components`

该组件用于呈现小灵基于位置、路线、时间、偏好和当前分类给出的单项消费推荐。它不是广告位，也不是普通商品卡片；正式消费页迁移时复用组件，并在页面适配层接入 Fay 与商品目录。

### 主要接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `recommendation` | `XiaolingRecommendationData` | 必填 | 商品目录校验后的可信推荐展示数据 |
| `reasonStatus` | `idle \| loading \| ready \| fallback` | `ready` | 推荐理由异步状态 |
| `onReasonActivate` | `() => void` | 无 | 点击理由后继续向小灵追问 |
| `action` | `ReactNode` | 必填 | 加入按钮或数量步进器 |
| `assistantVisual` | `ReactNode` | 默认头像 | 正式接入时传入 `XiaolingAvatar` |
| `assistantState` | `normal \| speaking \| listening \| thinking \| happy \| comfort` | `normal` | Fay 数字人状态映射 |
| `onAssistantActivate` | `() => void` | 无 | 点击小灵后唤起正式会话 |
| `assistantAriaLabel` | `string` | `打开小灵助手` | 数字人入口无障碍名称 |
| `avatar` | `string` | `/icons/lingshan-guide-avatar.png` | 没有展示槽时的静态回退图片 |
| `label` | `string` | `小灵沿途推荐` | 花笺笺首文字 |
| `quantityMotionSequence` | `number` | `0` | 每次成功改变推荐商品数量后递增，重复触发纸面回稳和数字轻弹 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
<XiaolingRecommendationNote
  recommendation={recommendation}
  reasonStatus={reasonStatus}
  assistantVisual={<XiaolingAvatar size="small" />}
  assistantState={robotState}
  onAssistantActivate={openXiaolingConversation}
  onReasonActivate={askWhyRecommended}
  action={<AddOrQuantityControl itemId={recommendation.itemId} />}
/>
```

### 推荐数据边界

Fay/LLM 层只返回稳定业务标识和理由：

```ts
type FayRecommendationSelection = {
  categoryId: string
  itemId: string
  reason: string
  requestId?: string
}
```

前端适配层必须使用 `categoryId`、`itemId` 查询商品目录，验证商品存在且可售，再生成 `XiaolingRecommendationData`。商品名称、描述、价格、库存与领取位置不能直接采用模型自由生成内容。

```text
位置、路线、时间、偏好、当前分类
              ↓
Fay 返回 categoryId、itemId、reason
              ↓
商品目录校验并补齐可信业务信息
              ↓
XiaolingRecommendationNote 负责呈现
```

### 数字人接入边界

- 荐笺内部不得再挂载 `Live2DStage`，否则会重复加载模型、画布和 GPU 资源。
- 正式 Fay/Live2D 由全局唯一的 `Live2DStage` 运行；荐笺通过 `XiaolingAvatar` 复用捕获的肖像。
- `assistantState` 只控制荐笺中的轻量状态反馈，不负责 WebSocket、口型或音频播放。
- `onAssistantActivate` 由页面适配层连接全局小灵会话；视觉组件不直接调用 Fay。

### 视觉与动效

- 小灵肖像采用团扇框，包含暖金扇柄、菱形结和克制的朱砂流苏。
- 花笺使用米白宣纸、双线笺框、淡竹节竖纹、书法笺首、莲纹和如意云纹。
- 朱砂色只用于“荐”字方印和团扇流苏，作为小面积传统印色，不替代主色体系。
- 小灵头像先轻探出现，花笺随后由左向右展开；动画层级低于页面卷轴题签。
- 加入、增加或减少推荐商品后，花笺纸面轻微横移回稳，数量数字同步轻弹；小灵头像保持稳定。
- `quantityMotionSequence` 由页面购物车逻辑在数量变更成功后递增，组件不自行修改业务数量。
- 推荐理由优先解释“为什么此刻推荐”，价格、可售状态、位置和加入操作保持直接可读。
- `prefers-reduced-motion: reduce` 下立即显示完整内容。

## 9. MarketMoonWindow 与 MarketBoguWindow：商品图片窗

### 文件位置

- 月洞窗：`src/components/mobile/consume/MarketMoonWindow.tsx`
- 方圆博古窗：`src/components/mobile/consume/MarketBoguWindow.tsx`
- 共用样式：`src/styles/c-app/marketProductImageFrame.css`
- 统一导出：`src/components/mobile/consume/index.ts`

两个组件只负责商品图的呈现方式，不读取分类、不处理价格和数量，也不根据商品名称判断窗型。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | 必填 | 商品图片路径 |
| `alt` | `string` | 空字符串 | 图片替代文字；装饰性缩略图保持为空 |
| `className` | `string` | 无 | 追加业务类名 |

```tsx
<MarketMoonWindow src={product.image} />
<MarketBoguWindow src={product.image} />
```

- 月洞窗以柔和拱圆轮廓表达生活服务，当前用于餐饮斋茶和园内交通。
- 方圆博古窗采用方形外格、圆形画心和深绿横档，当前用于文创礼品和演艺秀场。
- 两者都使用 `object-fit: contain`，允许以后接入比例不同的真实商品图。
- 货目册只约束窗的显示尺寸，不能覆盖窗组件自身的圆角、边框和构图规则。

## 10. MarketProductLedger：雅集货目册

### 文件位置

- 组件：`src/components/mobile/consume/MarketProductLedger.tsx`
- 独立样式：`src/styles/c-app/marketProductLedger.css`
- 图片窗样式：`src/styles/c-app/marketProductImageFrame.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `readonly MarketProductLedgerItem[]` | 必填 | 商品目录；每项包含标识、名称、描述、价格、图片和可选窗型 |
| `quantities` | `Record<string, number>` | 必填 | 由页面持有的商品数量映射 |
| `onQuantityChange` | `(itemId, nextQuantity) => void` | 必填 | 加入、减少或增加后的受控回调 |
| `onAddRequest` | `(itemId) => void` | 无 | 首次点击“添入”时的受控回调；有规格商品应由页面先打开详情选择，不应默认加入未知 SKU |
| `onItemActivate` | `(itemId) => void` | 无 | 点击商品信息区时打开详情；不传时信息区保持静态 |
| `ariaLabel` | `string` | `雅集商品货目` | 区域无障碍名称 |
| `className` | `string` | 无 | 追加业务类名 |

商品数据通过 `imageFrame?: 'moon' | 'bogu'` 声明图片窗型，未设置时回退为月洞窗。

```tsx
<MarketProductLedger
  items={products}
  quantities={cart}
  onQuantityChange={changeQuantity}
/>
```

### 视觉与交互

- 米白账簿纸面以细列线、上下深绿书脊和暖金分节建立“雅集货目”语义。
- 每行依次呈现货目序号、图片窗、商品信息和价格操作，移动端保持紧凑且可扫读。
- 未选中时使用双金杆上的深绿玉珠“添入”；选中后变为三珠算盘数量控制。
- 数量变化时当前货目轻微左右摆动，反馈操作已生效；朱砂“已选”印只作局部状态提示。
- 动效不改变布局，不作为状态成立的必要条件，并尊重 `prefers-reduced-motion`。
- 组件不保存购物车业务状态、不计算总价、不发起支付；这些职责属于页面或状态层。

## 11. MarketCartDock：彩绘竹筹购物袋入口

### 文件位置

- 组件：`src/components/mobile/consume/MarketCartDock.tsx`
- 独立样式：`src/styles/c-app/marketCartDock.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`

### 接口

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | 必填 | 当前购物袋商品总件数 |
| `totalLabel` | `string` | 必填 | 页面业务层格式化后的合计金额文案 |
| `onOpen` | `() => void` | 无 | 点击“核筹”区域后打开购物袋明细 |
| `className` | `string` | 无 | 追加页面布局类名 |

```tsx
<MarketCartDock
  count={cartCount}
  totalLabel={formatMoney(cartTotal)}
  onOpen={openCartSheet}
/>
```

### 视觉与交互

- 造型提取彩绘竹筹文物的结构语言：高低错落的彩绘签首、米黄筹面和深绿色布套，不直接复制文物图案。
- 左侧三枚竹筹只建立“核筹、汇总”的识别，不承载动态数量，避免数字遮挡装饰。
- “本次所选”右侧使用浅朱砂状态签突出件数；总金额使用较大的深绿数字和暖金短底线。
- “核筹”是次级横向小签，位于金额下方，点击整个入口均可执行 `onOpen`。
- 按下时三枚竹筹从布套中依次轻提并归位；`prefers-reduced-motion` 下取消位移动效。

### 状态与布局边界

- 组件是受控展示组件，不持有购物车、不解析商品价格，也不自行计算总价。
- 推荐花笺与货目册改变数量后，页面状态层统一重算 `count` 和 `totalLabel`，再传给该组件。
- 组件本身不使用 `position: fixed`；正式页面由布局层将其放在固定底部导航上方，并为正文预留入口和导航的总高度。
- `count` 为 `0` 时仍可显示入口，点击后可由页面提示用户先选择商品；是否禁用由业务层决定。

## 12. MarketCartSheet：经折货筹册

### 文件位置

- 组件：`src/components/mobile/consume/MarketCartSheet.tsx`
- 独立样式：`src/styles/c-app/marketCartSheet.css`
- 统一导出：`src/components/mobile/consume/index.ts`
- 本地预览：`src/mobile/MobileConsumeComponentsPreview.tsx`

### 数据接口

`MarketCartSheetItem` 只接收已经由页面或状态层确认的购物袋行项目：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 行项目稳定标识 |
| `name` | `string` | 商品名称 |
| `categoryLabel` | `string` | 消费分类或推荐来源文案 |
| `unitPriceLabel` | `string` | 已格式化的商品单价 |
| `subtotalLabel` | `string` | 已格式化的当前行小计 |
| `quantity` | `number` | 当前数量 |

组件属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 必填 | 是否显示核筹面板 |
| `items` | `readonly MarketCartSheetItem[]` | 必填 | 当前购物袋行项目 |
| `totalLabel` | `string` | 必填 | 页面业务层格式化后的总金额 |
| `onClose` | `() => void` | 必填 | 合卷、点击遮罩或按下 Esc 后关闭面板 |
| `onQuantityChange` | `(itemId, nextQuantity) => void` | 必填 | 将数量调整交给页面状态层 |
| `onConfirm` | `() => void` | 必填 | 确认当前所选；正式迁移时由页面衔接结算流程 |
| `confirmLabel` | `string` | `确认所选` | 确认操作文案 |
| `className` | `string` | 无 | 追加弹层主体布局类名 |

```tsx
<MarketCartSheet
  open={cartOpen}
  items={cartLines}
  totalLabel={formatMoney(cartTotal)}
  onClose={() => setCartOpen(false)}
  onQuantityChange={changeQuantity}
  onConfirm={handleCheckout}
/>
```

### 视觉与交互

- 组件以 B 方向的经折账册为信息主体：米白折面、中央页脊和细金线负责清晰核对，不重复货目册的大图和长描述。
- 商品行融合 C 方向的货筹语义：左侧使用彩绘竹筹签首，底部深绿描金轨道作为筹匣；名称、单价乘数量、行小计和加减操作保持优先可读。
- 打开时账册先从底部舒展，货筹随后以约 `54ms` 间隔错峰升起并回落；数量变化时当前货筹重新轻提，解释该行状态已更新。
- 清单是面板内唯一滚动区域，标题、筹匣轨道、总金额和确认操作保持固定；系统启用 `prefers-reduced-motion` 时直接呈现最终状态。
- 弹层打开后锁定正文滚动并将焦点移入，支持遮罩、合卷按钮和 Esc 关闭；关闭后焦点回到此前触发元素。

### 状态与业务边界

- 组件不查找商品、不计算单价、小计或总金额；所有价格文案必须由可信商品目录和页面状态层生成后传入。
- 数量减到 `0` 时是否删除行项目由页面决定；组件只调用 `onQuantityChange`，并等待新的 `items`。
- `onConfirm` 只表达“当前选择已核对”，组件不直接发起订单、支付或后端请求；正式消费页应在页面层衔接既有结算与 `PaymentSheet`。
- 弹层最大宽度为 `430px`，层级应高于 `MarketCartDock` 和固定底部导航；空购物袋仍显示完整空状态，但确认操作禁用。

## 13. 组合与边界

- 首页章节优先使用 `PlaqueTitle + MountainGate`，保持建筑式纵向叙事。
- 消费页以 `MarketTitle + MarketCategoryTabs + XiaolingRecommendationNote + MarketProductLedger + MarketCartDock + MarketCartSheet` 形成“卷首标题—册页分类—小灵此刻建议—货目章节—自主商品浏览—核筹汇总—展开核对”的完整链路。`MarketTitle` 在同页可以以不同标题层级复用于卷首和“雅集目录”章节，不另造近似题签；分类切换时，目录题签可根据新分类标识重新播放一次卷轴展开与卷尾回弹。
- 不要为了统一而把所有页面都改成山门；统一应体现在颜色、字体、描边和动效节奏，而不是单一造型重复。
- `MarketTitle` 不承担点击跳转；交互入口应放在它所标识的内容区域内。
- 组件样式应保留在独立组件样式或既有正式首页样式中，不要在业务页面复制近似实现。
- 新组件只有在视觉和交互确认后才加入目录导出，探索稿不作为公共 API 长期保留。

## 14. 验收清单

- 在 `375 × 812`、`390 × 844`、`430 × 932` 下无横向滚动。
- 标题、正文和交互元素没有越出立柱、卷轴或内容边框。
- 固定底部导航不遮挡页面最后一段有效内容。
- 动画延迟变化后，关联元素仍保持同步。
- 开启系统“减少动态效果”后，内容无需等待动画即可完整访问。
- 标题层级正确，页面中不因视觉组件而破坏 `h2`、`h3` 的语义顺序。
- 分类卷签框与当前 `value` 一致，快速连续切换时不会越出组件边界。
- Fay 推荐加载、失败或回退时，花笺结构稳定，商品价格与可售状态始终来自可信商品目录。
- 餐饮与交通使用月洞窗，文创与演艺使用方圆博古窗；方形博古窗不得被货目册响应式样式重新圆角化。
- 加入、减少和增加商品后，页面持有的数量与货目册显示一致。
- 推荐花笺和货目册任一数量变化后，竹筹入口的总件数与总金额必须同步更新。
- 固定使用时，竹筹入口不得遮挡底部导航，也不得让最后一项商品无法滚动到完整可见区域。
- 货筹册内调整数量后，行小计、总金额和竹筹入口必须由同一页面状态同步更新。
- 货筹册的标题、合卷、筹匣轨道、合计和确认操作不得随商品列表滚走；长清单只能在面板内部滚动。
- 打开货筹册后正文不能继续滚动，遮罩、合卷和 Esc 均可关闭，关闭后焦点应返回触发入口。
- 确认所选只调用页面传入的回调，不得在视觉组件中直接创建订单或发起支付。

## 15. 消费页雅集交互折页

`src/mobile/consume-v2/ConsumeV2Overlays.tsx` 和 `src/styles/c-app/mobileConsumeV2Overlays.css` 由正式 `/consume` 与本地 `/consume-v2` 共用，暂未加入 `src/components/mobile/consume/index.ts` 的公共导出。

- `ConsumeV2ProductDetailSheet`：商品详情、品类规格、数量和纳入货筹。
- `ConsumeV2CheckoutSheet`：游客、日期、领取提示、规格快照、礼签、支付方式与模拟结果。
- `ConsumeV2OrderSuccessDialog`：结算完成后一次性出现的确认弹窗；不得作为常驻页面模块。
- `ConsumeV2OrdersSheet`：当次原型会话内的雅集单、票务信息、累计消费、订单数、商品规格、分类消费结构和问小灵入口。

当前遵循以下业务约束：

- 未加入购物车的商品点击“添入”必须先打开详情选择规格，不能把未知 SKU 直接写入购物车。
- 已选商品可在货目册中继续增减，并沿用首次选择的规格；减至零后再次加入需要重新确认规格。
- 购物车、确认所选和我的雅集单必须展示同一份下单规格快照。
- 正式 `/consume` 在未购票时直接重定向到新的 `/ticket` 入境仪式；不再展示旧版购票拦截卡。已购票后读取 `useTicketStore` 的票务、订单与消费记录。
- 正式 `/consume` 结算继续使用现有 `PaymentSheet` 的模拟收银台；支付成功后通过 `placeOrder` 写入订单、品类消费与规格快照。
- 支付完成后清空购物车，通过 `ConsumeV2OrderSuccessDialog` 提供“继续逛雅集”和“查看订单”两个去向。
- `/consume-v2` 仍保留本地预览模式；正式接入真实服务后，以 `visitId` 关联票务、订单与消费汇总。

这些折页延续经折货筹册的纸面、暖金分隔和底部固定操作逻辑。当前正式页仍不调用真实库存、Fay 或支付接口，但已接入本地票务与订单状态；预留接口契约见 `src/mobile/consume-v2/consumeV2Contracts.ts`，B 端商品管理和数据接入说明见 `docs/consume-v2-backend-and-admin.md`。后续以真实接口替换本地 store 与模拟收银台即可。

## 16. 个人中心行旅档案组件

正式 `/me` 使用 `MarketCategoryTabs` 切换票务、游历、订单和偏好，不在同一长页面同时堆叠四类内容。`ProfileCompanionNote` 是始终可见的小灵留笺；`ProfilePreferenceCard` 只在“偏好”分类激活时渲染。

个人中心所有文字必须使用 `cAppTypography.css` 已声明的本地 `LingshanSerif` 和 `LingshanSans`，不得增加网络字体请求。路由和迁移细节见 `docs/mobile-profile-redesign-migration.md`。

## 17. 快速文件地图

```text
src/components/mobile/
├── home/
│   ├── PlaqueTitle.tsx
│   ├── MountainGate.tsx
│   └── index.ts
├── consume/
│   ├── MarketTitle.tsx
│   ├── MarketCategoryTabs.tsx
│   ├── XiaolingRecommendationNote.tsx
│   ├── MarketMoonWindow.tsx
│   ├── MarketBoguWindow.tsx
│   ├── MarketProductLedger.tsx
│   ├── MarketCartDock.tsx
│   ├── MarketCartSheet.tsx
│   └── index.ts
└── profile/
    ├── ProfileCompanionNote.tsx
    ├── ProfilePreferenceCard.tsx
    └── index.ts

src/styles/c-app/
├── cAppTypography.css
├── marketCategoryTabs.css
├── marketProductImageFrame.css
├── marketProductLedger.css
├── marketCartDock.css
├── marketCartSheet.css
├── mobileConsumeV2Overlays.css
├── mobileHome.css
├── marketTitle.css
├── mobileProfileV2.css
├── profileCompanionNote.css
├── profilePreferenceCard.css
└── xiaolingRecommendationNote.css
```

## 18. XiaolingFloatingCompanion：地图小灵随行笺

### 文件位置

- 真实组件：`src/components/guide/XiaolingFloatingCompanion.tsx`
- 正式样式：`src/styles/guide/guideAssistant.css`
- 正式挂载：`src/components/guide/GlobalXiaolingAssistant.tsx`
- 正式页面：`/map-3d-guide-c` 普通浏览模式

普通浏览模式使用 `mode="browse"`，展示小灵肖像、随行提示、“问小灵”和“路线”两个操作。路线、POI 模式继续使用头像入口，不套用随行笺卡片外观。

地图 C 端组件统一使用三级小字号：眉题与标签 `10px`，说明与辅助信息 `11px`，正文与文字按钮 `12px`。页面标题、卡片主标题、纯图形图标不受该约束。字号基线由 `src/styles/map/mapTokens.css` 中的 `--map-type-eyebrow`、`--map-type-caption` 和 `--map-type-body` 维护。

### 视觉规则

- 外框采用米白行旅笺、墨绿顶部压条、暖金细线和右上角方印，保持直角纸笺结构。
- 小灵肖像保留全局唯一 Live2D 肖像链路，外部使用墨绿与暖金双环，不在卡片内部重新挂载 `Live2DStage`。
- 提示文案保持原有内容和点击行为，使用标题字体并以暖金细线与操作区分隔。
- “问小灵”为米白纸面次操作；“路线”为墨绿主操作。两者保持等宽，箭头仅用于表达进入动作。
- 卡片位置、安全区、打开会话和打开路线的逻辑不因视觉改造而改变。

### 清理边界

独立审阅页面和其专用覆盖样式仅用于确认设计，确认迁移后必须删除。正式组件样式只维护在 `guideAssistant.css`，不得在地图 V2 页面复制一份同名规则。

## 19. XiaolingConversationSurface：地图抽屉与全屏小灵会话

正式 `/map-3d-guide-c` 抽屉与 `/guide` 全屏页复用 `XiaolingConversationSurface`。已经确认的顶部栏、状态签、游览签条、方角气泡和题签输入区维护在 `src/styles/guide/guideDrawer.css`；通用荐笺维护在 `src/styles/guide/guideCards.css`。设计确认后，独立的 `/map-v2/conversation` 审阅路由、页面和覆盖样式已删除。

### 视觉规则

- 顶部栏使用米白纸面、墨绿顶部压条、暖金细线和方角操作；返回、布局切换与地图入口保留原有行为。
- 左上角使用 `11px` 方角 Fay 运行状态签；连接、重连、倾听、思考和讲解共享同一位置，并通过文字与小方点共同表达状态。
- 快捷提问使用 `10px` 浅米色“游览签条”、暖金细边、墨绿短竖线和轻量错位阴影；三项保持单行，窄屏通过横向滑动访问，不换成两排。
- 小灵消息使用浅纸面、暖金描边和左侧加粗金线；用户消息使用墨绿方签。双方正文统一为 `12px` 的本地 `LingshanSans`。
- 路线、景点、导航和后续通用推荐均沿用“小灵荐笺”结构：宣纸内框、顶部墨绿短线、右上朱砂“荐”印、信息分隔、留注和短签操作。
- `GuideRecommendationCard` 通过 `kind`、标题、说明、事实项、标签、留注和操作承载不同业务，不再为路线、景点、导航分别复制卡片组件。
- 图片是可选增强信息：有图时使用 `88 × 66px` 方角小画框，无图时标题自动占满；首图失败可切换业务提供的回退图，回退图仍失败则折叠图片区域，不保留空白占位。
- 输入区使用直角题签书写栏；语音入口采用标准麦克风图形的墨绿方印，发送入口保持方角状态反馈。
- 全屏的“看小灵 / 看对话”布局切换、消息线程、推荐动作和返回上下文不因视觉同步而改变。

### 对接边界

抽屉与全屏样式同步不代表地图会话已经完成真实 Fay 桥接。倾听、思考、讲解、重连、流式消息和异常验收仍以 `docs/xiaoling-fay-runtime-integration.md` 为准。

## 20. RoutePreviewDeck：地图路线预览册

正式 `/map-3d-guide-c/route/:routeId` 在 `preview` 阶段使用 `Map3DRouteGuidePage.tsx` 内部的 `RoutePreviewDeck`。确认后的视觉只维护在 `src/styles/map/mapRouteMobile.css`；独立 `/map-v2/route-panel` 审阅路由、页面和专用覆盖样式已在迁移后删除。

### 视觉规则

- 路线卡采用米白纸面、墨绿顶部压条、暖金双层内框和轻量错位纸影，保持方角路线册形态。
- 路线图片使用约 `88 × 94px` 的方角小画框，保留正式媒体目录与图片失败回退逻辑。
- “路线预览”为小题签；路线名称、时长和景点数量形成清晰三级信息，路线属性使用暖金竖线分隔，不使用圆角胶囊。
- 站点列表保留横向滑动，使用朱砂数字节点、暖金连接线与上下纸面分隔形成连续行程轴。
- “开始游览”为墨绿方角主操作；滑动提示降级为留注，路线分页使用长短线指示。
- 路线内容、自由横滑、最大可见卡片选中、开始游览导航和收起状态均保持原行为。

## 21. RouteActiveCard：地图路线进行中笺

正式 `/map-3d-guide-c/route/:routeId` 在 `active` 阶段使用 `Map3DRouteGuidePage.tsx` 内部的 `RouteActiveCard`；收起后复用 `RouteCollapsedBar`。确认后的路线状态纸笺规则维护在 `src/styles/map/mapRouteStatusFolio.css`，独立审阅路由已在同步后删除。

### 视觉规则

- 展开态复用路线预览册的米白纸面、墨绿与暖金分段顶线、双层内框和方角错位纸影。
- “小灵领队中”作为卡片内部状态签，允许自动换行并完整显示，不使用单行省略。
- 下一站眉题、景点名、距离、步行时间和建议停留形成三级层级；时间信息保持单行并使用暖金细线收尾。
- “继续问小灵”使用墨绿方印，保留原入口行为；景点说明使用两行、左侧暖金线的轻量说明笺。
- 三个操作等宽排列；导航为墨绿方角主操作，详情与预览讲解为纸色描边次操作。
- 收起态保持 `RouteCollapsedBar` 的原有标题、距离、步行时间、展开和导航行为，视觉改为同源的 `64px` 紧凑纸本签条。
- `RouteArrivedCard` 直接复用同一纸本骨架、状态签、方印入口、等宽操作和折叠签条；仅使用朱砂方印区分“到达”语义。到达提示必须单行完整显示，景点介绍不得截断，卡片随正文自然增高。
- `RouteJoiningCard` 同样复用该纸本骨架与折叠签条；“导航到加入点”和“加入点详情”保持两列等宽铺满，不改变中途加入、原型导航或到达确认逻辑。
- `RouteCompletedCard` 使用同源纸本收尾卡，垂直居中显示，并保留单行“返回地图”操作；五星评价可选择、提交并锁定。真实服务端资格校验、幂等提交、异常状态与管理端统计以 `docs/route-rating-backend-integration.md` 为准。
- `NavigationPrototypeCard` 直接纳入同一 `mapRouteStatusFolio.css` 纸本骨架：定位授权、定位中、规划中和异常状态复用加入路线卡层级，导航中复用进行中笺，收起态复用紧凑签条，到达确认复用到达卡语义。定位权限、路线规划、暂停、偏航、重规划和到达状态机保持原实现。

### 行为边界

此次同步不改变路线阶段、下一站计算、POI 详情返回上下文、讲解入口、原型导航状态或地图核心。折叠仍由 `routeCardExpanded` 控制，展开态默认不变。

## 22. MapServicePanel：地图游园服务面板

正式普通浏览页与路线页的服务入口统一打开 `MapServicePanel`，路线预览、进行中、到达、加入和完成阶段不再维护旧版占位面板。

- 面板复用 C 端纸本抽屉外框与消费分类签条，保留洗手间、休息区、餐饮点和出口四类入口。
- 眉题与标签使用 `10px`，说明使用 `11px`，正文和操作使用 `12px`；服务名称维持展示标题层级。
- 分类内容集中维护在组件内，普通浏览页与路线页只持有当前分类和开关状态，避免样式与文案分叉。
- 洗手间、休息区和餐饮点在准确数据接入前统一显示“点位数据建设中”，不展示模拟数量、距离或开放状态，并禁用地图查看操作。
- 出口坐标已具备，保留“导航到出口”的页面适配回调；定位与导航接入时不修改共用面板的视觉结构。
