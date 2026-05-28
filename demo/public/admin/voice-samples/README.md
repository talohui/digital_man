# 音色试听样例

将以下文件放入本目录（短句「我是XX，欢迎来到灵山胜境」即可），**扩展名 `.wav` 或 `.mp3` 均可**（优先尝试 `.wav`）：

- `zhimiao_emo.wav` 或 `zhimiao_emo.mp3`
- `zhimi_emo.wav` 或 `zhimi_emo.mp3`
- `zhiyan_emo.wav` 或 `zhiyan_emo.mp3`
- `zhitian_emo.wav` 或 `zhitian_emo.mp3`

文件名必须与后台下拉中的 **voiceId** 完全一致（当前为知妙/知米/知燕/知甜四个 ID）。

若文件不存在，管理后台「试听」会提示缺失；**不等于**游客端 Fay TTS。线上音色：管理端保存 → 写入 Fay `config.json` 的 `attribute.voice` → **重启 Fay**。

若管理端下拉名称仍是旧列表（如「知小夏」），请 **重新编译并重启 analytics-server（:5002）** 后硬刷新管理页。
