# 地图模块展示版工程化记录

## 样式与组件边界

地图移动端样式不再继续堆进 `demo/src/styles/global.css`。地图模块样式放在 `demo/src/styles/map/` 下，当前已拆出：

- `mapTokens.css`：地图模块色彩、字体、阴影等 token。
- `mapBrowseMobile.css`：普通浏览页移动端 overlay。
- `mapRouteMobile.css`：路线游览页移动端 overlay。
- `mapPoiDetailMobile.css`：景点详情页移动端样式。
- `mapMobileControls.css`：移动端圆形返回、更多、关闭按钮。
- `mapToolRail.css`：移动端左右竖向工具条。

## 已抽通用组件

- `demo/src/components/map/MapMobileChromeButton.tsx`
  - 用于移动端返回、更多、关闭圆按钮。
  - 普通浏览页和路线游览页已复用。

- `demo/src/components/map/MapMobileToolRail.tsx`
  - 用于移动端地图工具条。
  - 普通浏览页和路线游览页已复用。
  - 通过 `items` 配置不同页面的 `定位 / 3D / 服务 / 退出 / 总览 / 当前 / 路线总览`。

## 复用原则

- 通用组件只负责结构、状态 class、基础视觉和可访问性标签。
- 页面负责传入不同 `items`、点击行为和页面级响应式位置。
- 后续新增地图工具按钮时，优先扩展 `MapMobileToolRail` 的 item 配置，不再复制新的工具条 DOM。
- route 页仍有部分历史 `.map-route-tour-rail` CSS 选择器作为待清理遗留样式，但真实 JSX 已切换到 `MapMobileToolRail`。

## 已支持的展示版交互

- 普通浏览页：进入路线、小灵抽屉、服务浮层、3D/定位本地反馈。
- 路线游览页：开始游览、总览/当前切换、3D 高亮、服务浮层、退出路线、景点详情、继续下一站、小灵抽屉。
- 景点详情页：小灵提示卡与悬浮头像打开同一个 poi mode 抽屉、3D 主舞台开关、图文介绍滚动、路线返回与继续下一站。

## 第一阶段交互修复

本轮重点修复移动端“按钮点不动 / 横向不能滑 / 路线不能切换”的展示版问题，不接真实后端能力。

- 新 overlay 根层保持不拦截地图，使用 `pointer-events: none`。
- 真正需要点击的元素单独恢复 `pointer-events: auto`，包括顶部按钮、工具条、路线卡、路线 tabs、站点 chips、小灵抽屉、服务浮层、输入框和关闭按钮。
- 小灵抽屉和服务浮层层级高于地图、底部卡片和工具条，避免被透明层或地图层吃掉点击。
- 横向滚动容器恢复触摸横滑能力，路线 tabs、站点 chips、服务分类和小灵问题 chips 使用 `overflow-x: auto`、`-webkit-overflow-scrolling: touch` 与 `touch-action: pan-x`。
- route preview 不再把路线内容硬编码为历史文化路线，UI 层通过 `lingshanScenicRoutes.ts` 的 helper 读取当前路线、站点和下一站。

## 地图交互层级修复

手机实测中，挂到地图体验组件同一 DOM 层级的普通浏览 overlay 无法收到任何 pointer/click 事件，而直接 portal 到 `document.body` 的诊断按钮可以正常跳转。由此确认问题不在 React Router 或 `useNavigate`，而是腾讯地图内部层、地图容器 stacking context 与正式 overlay 的低层级组合造成的事件命中失败。

- `BrowseMobileOverlay` 现在只把移动端 UI portal 到 `document.body`；地图本体仍由 `Map3DGuideExperience` 原样渲染。
- 路线页和普通浏览页使用相同的全屏地图叠层架构，因此 `RouteTourMobileOverlay` 同样 portal 到 `document.body`，避免 preview / active / arrived 控件被地图层吃掉点击。
- portal 根层使用 `pointer-events: none`，只在顶部按钮、工具条、底部卡片、横滑区域、抽屉和服务浮层上恢复 `pointer-events: auto`，因此地图空白区域仍可接收拖动。
- 路线 tabs、站点 chips、服务分类和小灵问题 chips 保持 `overflow-x: auto`、触摸惯性滚动和 `touch-action: pan-x`。
- 景点详情页不是全屏地图 canvas 叠层，检查后不需要整页 portal；其 Hero 装饰层和 toast 保持 `pointer-events: none`，正文按钮、路线底栏和小灵抽屉继续使用正常文档层级。
- 修复确认后已删除 Hard Link / Hard Assign / Hard Navigate、Tap Debug、全局 pointer capture 监听、重复 touch/pointer 导航事件和对应 debug CSS。

本次修复只改变 UI 挂载层级和事件命中规则，没有改变腾讯地图初始化、地图 presentation、路线 geometry、GLB runtime 或 Fay 通信。

## 路线数据接入

路线页共用同一个 `Map3DGuideExperience`，不同 URL 的 `routeId` 只切换 route overlay 与地图路线数据，不创建第二套地图引擎。

UI 层读取路线时优先使用：

- `resolveScenicRouteId(routeId)`
- `getScenicRouteConfig(routeId)`
- `getRouteStops(routeId)`
- `getRouteStopByIndex(routeId, stopIndex)`
- `getNextRouteStop(routeId, stopIndex)`
- `getRoutePoiId(routeId, stopIndex)`

当前展示版 route tabs 已接入五条路线：

- `historical_culture`：历史文化路线
- `prayer_meditation`：祈福静心路线
- `highlights_checkin`：精华打卡路线
- `natural_scenery`：自然风光路线
- `family`：亲子路线

`URL stop` 继续按 1-based 展示与传参，页面内部 `stopIndex` 继续按 0-based 读取数据。不要在 JSX 中临时改这个约定。

## 已验证的展示流程

展示版目标流程：

1. 打开 `/map-3d-guide-c`。
2. 点击“进入路线”进入 `/map-3d-guide-c/route/historical_culture`。
3. 在 preview 态横向滑动路线 tabs 和站点 chips。
4. 切换路线 tab 后，卡片路线名、站点 chips 和“开始游览”目标同步变化。
5. 点击“开始游览”进入当前路线 active 态。
6. active 态点击“景点详情”进入 `/map-3d-guide-c/poi/:poiId?from=route&routeId=:routeId&stop=:stop`。
7. 景点详情页点击小灵打开 poi mode 抽屉，关闭后可返回路线。
8. 路线 arrived 态点击“继续下一站”进入下一站 active 态；没有下一站时显示路线完成提示。

## 当前限制

- 在 `ink2d` 展示模式下，真实地图 POI 的点击仍受现有地图/POI 渲染链路影响，本轮没有改地图底层；普通浏览页主卡和 overlay 交互已可用。
- 路线地图几何、路线高亮、腾讯控件和 2D 地图底层仍由地图底层任务处理。

## 地图运行时收口

- 2D 与 3D 继续复用同一个腾讯地图实例；切换只保存并恢复 `CameraState`，不会销毁地图、路线或 POI 图层。
- 2D 返回会强制恢复 `pitch: 0`、`rotation: 0`，同时保留切换前的中心点和缩放级别；开发态可通过 `window.LINGSHAN_MAP_DEBUG.camera` 查看当前相机快照。
- 路线“总览”统一走当前 `routeId` 的 geometry / stop bounds，不能再回退到九龙灌浴的默认景点相机。
- 云朵转场淡出阶段不再接收 pointer event，避免路线 preview 在切换完成后无法拖动地图。
- `core` 使用项目维护的自定义 POI；`all` 仅显示腾讯原生 POI，不再创建透明自定义热区或把腾讯原生名称映射到项目详情。原生 POI 点击仅提示“该景点详情正在完善”。
- 五明桥、五智门、降魔浮雕、阿育王柱、佛教文化博览馆、无尽意斋为 `candidate` 坐标，只能通过 `?debugPoiCalibration=true` 的开发校准面板查询、拖动和导出 JSON；候选点不会进入游客端 core/all、路线或导航。

## 仍是占位的能力

- 真实 Fay / 小灵通信。
- 真实语音识别。
- 真实导航 / 算路。
- 真实服务点数据。
- 真实路线重新规划。
- 真实 3D 模型交互控制。
- 真实定位回到当前位置。

## 下一批可抽组件

- 小灵圆形头像入口。
- 小灵问答抽屉。
- 游园服务占位浮层。
- 推荐路线卡片中的路线封面 / 标签 / 元信息组合。
