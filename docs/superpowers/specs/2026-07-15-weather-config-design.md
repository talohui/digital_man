# 腾讯天气配置持久化设计

## 目标

让 B 端“AI 服务配置”页面管理腾讯天气 WebService Key。Key 不进入浏览器存储、前端构建产物或 `application.properties`；analytics 服务加密持久化后立即用于游客端天气、天气路线建议和运营报表。

## 已确认约束

- 管理员身份继续使用 Fay 的二次验证会话。
- 默认只返回脱敏 Key；编辑框留空表示保留已保存的值。
- 数据库中的 Key 使用 AES-GCM 加密；密钥材料仅来自 `ANALYTICS_CONFIG_MASTER_KEY` 环境变量。
- 保存成功会清空天气缓存，无须重启服务。
- 环境变量 `TENCENT_WEATHER_KEY` 保留为首次部署或未保存页面配置时的兼容回退。

## 架构

`AdminServiceConfigPage` 取得 Fay 会话令牌后，调用 analytics 的天气设置接口。接口通过已有 `AdminSessionVerifier` 验证令牌，再由 `WeatherServiceSettingsService` 验证输入、AES-GCM 加密并写入 H2。`TencentWeatherService` 每次读取有效 Key 时优先读取已加密的页面配置，缺失时回退环境变量。管理员保存后控制器清空该服务的十分钟天气缓存。

## 安全与失败处理

- GET 不返回完整 Key，只返回是否已配置、来源与掩码。
- PUT 不记录 Key；空 Key 不覆盖当前值。
- 未设置 `ANALYTICS_CONFIG_MASTER_KEY` 时，写入返回明确但不泄密的 409 错误。
- 解密失败时天气服务返回不可用，不回显或记录密文、明文或请求 URL。

## 验收

1. 使用有效 Fay 管理员会话保存 Key 后，GET 仅返回掩码且数据库字段不是明文。
2. 已保存设置优先于 `TENCENT_WEATHER_KEY`；留空更新不会删除原值。
3. 保存会使下一次天气请求跳过旧缓存并读取新配置。
4. 未授权、无主密钥与无效 Key 都有安全错误响应。
