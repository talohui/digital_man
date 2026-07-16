# C 端个人中心正式迁移说明

## 1. 当前状态

- 正式路由：`/me`
- 原型路由 `/me-v2` 已移除，不再按开发环境注册。
- `src/mobile/MobileProfilePage.tsx` 是稳定的正式页面入口，当前复用已确认的 `MobileProfilePageV2` 实现。
- 旧个人中心内容已被正式替换；票务和订单 store 契约未改动。

## 2. 路由与页面转换

| 场景 | 目标 | 说明 |
| --- | --- | --- |
| 底部导航“我的” | `/me` | `CAppBottomNav` 的正式个人中心入口 |
| 个人中心→购票 | `/ticket` | 继续使用现有正式购票流程 |
| 个人中心→消费 | `/consume` | 继续使用现有票务拦截、订单和模拟收银台 |
| 个人中心→继续行程 | `/map-3d-guide-c/route/:routeId` | 通过 `getMapResumeUrl` 保留行程阶段与站点 |
| 今日留笺→小灵 | `/guide?returnTo=%2Fme` | 退出小灵全屏页后返回正式个人中心 |

`App.tsx` 在移动端路由表中将 `/me` 放在 `MobileShell` 通配路由之前。个人中心自行承载顶部、`430px` 内容容器和底部导航，不再嵌套旧移动壳层，因此不会出现重复顶栏或重复导航。`/me` 同时被列入正式独立 C 端页，不叠加全局悬浮小灵。

## 3. 数据边界

页面只读取或调用既有状态和跳转：

- `useTicketStore.ticketProfile`：已购票务。
- `useTicketStore.orders / purchases`：消费订单和金额汇总。
- `useGuideStore.visitedStops / listenedStops`：到访与讲解记录。
- `useGuideStore.selectedTags / guidePreferences / userProfile`：偏好与心谱状态。
- `useGuideStore.activeRouteId`：当前行程与继续游览入口。

个人中心不直接创建票务、订单或支付记录，不修改 `useTicketStore` 的核心契约。

## 4. 组件结构

- `MarketCategoryTabs`：在票务、游历、订单、偏好之间切换，每次只渲染当前内容。
- `ProfileCompanionNote`：小灵今日留笺与对话入口。
- `ProfilePreferenceCard`：行旅心谱、核心偏好印签和分组偏好记录。
- `CAppBottomNav`：正式 C 端五栏导航，在 `/me` 下激活“我的”。

## 5. 本地字体

个人中心不依赖在线字体，页面作用域显式映射以下本地字体：

| 用途 | CSS 字体名 | 本地文件 |
| --- | --- | --- |
| 标题、印章、票帖 | `LingshanSerif` | `public/fonts/lingshan/noto-serif-sc-700.woff2` 和 `noto-serif-sc-800.woff2` |
| 正文、按钮、数据标签 | `LingshanSans` | `public/fonts/lingshan/noto-sans-sc-500.woff2` 和 `noto-sans-sc-700.woff2` |

`src/styles/c-app/cAppTypography.css` 统一声明 `@font-face`。`mobileProfileV2.css` 在 `.profile-v2-preview` 内将 `--font-lingshan-display`、`--font-lingshan-body` 和 `--font-lingshan-ui` 收口到上述本地字体，表单和按钮同样使用 `LingshanSans`。

个人中心的信息字号统一为三档：眉题与标签 `10px`、说明文字 `11px`、正文与按钮 `12px`。页面主标题、组件标题、金额和关键数字继续使用更大的强调字号，不纳入基础信息字号收口。

## 6. 验收要点

- 直接访问 `/me` 在移动端和桌面预览中都显示同一份 `430px` 个人中心。
- 正式构建中 `/me` 可用，`/me-v2` 不再注册。
- 底部导航、购票、消费、地图续游和小灵返回链路指向正式路由。
- 页面不叠加旧壳层顶栏、第二份底部导航或全局悬浮小灵。
- 本地字体文件缺失时视为构建资产问题，不应通过引入在线字体解决。
