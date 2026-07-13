# 腾讯天气驱动路线建议设计

## 目标

将灵山胜境的腾讯实时天气接入游客端首页、路线推荐和 B 端运营总览。天气只作为路线排序条件，不覆盖闭园、道路封闭和医疗等安全类应急约束。

## 现状与边界

- 游客端已通过 `analytics-server` 的 `POST /api/guide/recommendations` 获取路线，并在服务端依次应用个性化评分、应急事件和近 5 分钟客流约束。
- B 端已使用 `analytics-server`（5002），适合作为天气代理；浏览器不直接访问腾讯 WebService。
- 腾讯地图 JavaScript Key 已在前端以 `VITE_TMAP_WEB_KEY` 使用，但天气 Key 必须通过服务端环境变量读取，即使物理 Key 相同也不能从前端变量复用。
- 不修改 RAG、Fay、Gorse 或现有应急硬约束。

## 架构

```text
腾讯位置服务 WebService
          |
analytics-server TencentWeatherService
          |  10 分钟内存缓存、超时、状态码转换
          +--> GET /api/public/weather
          |
GuideRecommendationService
  个性化评分 -> 应急/客流约束 -> 天气重排序 -> 路线原因
          |
游客端首页 / 路线规划页 / B 端运营总览
```

## 配置

`analytics-server` 从部署环境读取以下变量：

- `TENCENT_WEATHER_KEY`：已开启腾讯 WebService API 的 Key。
- `LINGSHAN_WEATHER_LATITUDE`：景区中心纬度，默认 `31.4268`。
- `LINGSHAN_WEATHER_LONGITUDE`：景区中心经度，默认 `120.1008`。

后端按 `location=纬度,经度` 请求腾讯天气。缺少 Key 时返回可识别的“天气服务未配置”状态，不泄露变量内容。

## 天气 API

新增公开只读接口 `GET /api/public/weather`，返回：

```json
{
  "weather": "多云",
  "temperature": 30,
  "humidity": 72,
  "windDirection": "东南风",
  "windPower": "2-3级",
  "airPressure": 1001,
  "updateTime": "2026-07-14 10:00",
  "district": "滨湖区",
  "source": "tencent",
  "cached": false
}
```

成功响应在服务端缓存 10 分钟。腾讯接口、网络或格式异常时，若存在仍在缓存期内的数据则返回缓存；否则返回 502 和不含敏感字段的错误信息。

## 路线规则

路线目录为三条路线增加轻量、可审计的环境属性：遮荫、室内停留、暴晒与步行负荷。天气规则在安全和客流约束之后重排可用路线：

- 晴热（晴/少云/多云且温度不少于 28℃）：提高遮荫和室内停留占比高的路线，降低高暴晒路线；原因明确为“晴热避晒”。
- 降雨、雷暴或降雪：提高室内停留占比高的路线；原因明确为“降水避雨”。
- 高湿（湿度不少于 85%）或强风（风力文本中等级不少于 6）：提高轻步行路线；原因明确为“体感舒适”。

若天气不可用或未匹配规则，保持原有排序并不生成天气调整原因。天气不会从路线中移除景点，也不会替代应急事件的封锁结果。

## 前端呈现

### 游客端

- `MobileHomePage` 在首页头部下方显示实时天气卡，内容包括天气、温度、湿度、风力和更新时间。
- 有天气路由建议时，天气卡显示一句可解释建议，并提供“查看适合路线”入口至 `/plan`。
- `MobileRoutePlanPage` 继续复用现有 `routeAdjustmentReasons`，将天气原因和客流、应急原因并列展示。
- 加载失败不阻塞首页和路线推荐，显示“天气暂不可用”。

### B 端

- `AdminDashboard` 在运营总览的实时区域显示天气、数据来源、更新时间和当前天气策略。
- 仅显示状态与建议，不显示腾讯 Key、原始请求地址或完整上游报错。

## 测试与验收

- 天气响应正确读取 `result.realtime[0].infos`；经纬度顺序为纬度在前。
- 上游 `status != 0`、超时、格式缺失和未配置 Key 均不会使前端持续 loading。
- 缓存命中不重复调用上游；缓存过期后才刷新。
- 晴热、降雨和高湿/强风分别改变可用路线排序并附带可解释原因。
- 无天气或无匹配规则时，现有个性化、客流和应急排序不变。
- 游客端和 B 端使用同一个本项目天气 API，前端源码与网络请求不含 `TENCENT_WEATHER_KEY`。
