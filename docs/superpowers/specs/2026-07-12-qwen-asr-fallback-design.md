# 手机语音输入百炼 ASR 降级设计

## 背景与目标

导览页已实现“按住说话、松手发送”，局域网/手机访问会将录音上传至 Fay 的 `/api/asr-transcribe`。当前后端仅调用阿里云 NLS，但项目未配置 NLS AccessKey 和 AppKey，因此稳定失败。

目标是不增加新密钥、不改前端交互和接口，复用已配置的百炼 API Key 完成中文短音频识别。

## 方案

`transcribe_uploaded_file` 保持单一入口：

1. 若 `ali_nls_key_id` / `ali_nls_key_secret` / `ali_nls_app_key` 齐全，保持现有 NLS 路径。
2. 否则若 `gpt_api_key` 和 `gpt_base_url` 存在，将上传音频编码为 Data URL，调用 OpenAI 兼容的 `/chat/completions`，模型使用 `qwen3-asr-flash`。
3. 两组凭据都不存在时，返回明确的语音服务配置错误。

Qwen-ASR 请求指定中文 `language=zh` 并开启 ITN，便于导览中的时间、金额和数字景点识别。保留现有前端音频格式，不再强制经 ffmpeg 转 PCM，以减少一次本地转码延迟。

## 错误处理

- 百炼返回非 2xx 时，只记录状态码和有限响应摘要，不记录 API Key 或完整音频。
- 返回结构缺少文本时，向前端返回“未识别到有效文本”。
- 保持已有前端错误提示和打字降级能力。

## 验证

- 单元测试锁定：NLS 凭据缺失时选择 Qwen-ASR，请求不泄露密钥，正确解析识别文本，错误响应可读。
- 运行后端测试和前端回归测试。
- 重启 Fay，使用实际短音频调用 `/api/asr-transcribe`，再在导览页人工进行一次“按住说话、松手发送”验证。

## 范围边界

本次不实现实时 WebSocket ASR、声纹、说话人分离或长录音转写；仅服务于当前按住式短语音问答。
