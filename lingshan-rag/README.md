# lingshan-rag

灵山胜境首版 RAG 知识库项目。

## 目录结构

```text
lingshan-rag/
├── data/
│   ├── raw/
│   │   └── 灵山胜境：历史、文化、景点特色与个性化游览指南.docx
│   ├── markdown/
│   │   └── lingshan_guide.md
│   ├── cleaned/
│   │   └── lingshan_guide_cleaned.md
│   ├── chunks/
│   │   └── lingshan_chunks.jsonl
│   ├── faq/
│   │   └── faq_seed.jsonl
│   └── eval_questions.jsonl
├── chroma_db/
├── scripts/
│   ├── 01_docx_to_md.py
│   ├── 02_clean_text.py
│   ├── 03_chunk_text.py
│   ├── 04_build_chroma.py
│   ├── 05_query_rag.py
│   ├── 06_eval_rag.py
│   └── rag_utils.py
├── requirements.txt
└── README.md
```

## 安装依赖

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows 激活虚拟环境：

```powershell
.venv\Scripts\activate
```

## 执行顺序

1. `python scripts/01_docx_to_md.py`
2. `python scripts/02_clean_text.py`
3. `python scripts/03_chunk_text.py`
4. `python scripts/04_build_chroma.py`
5. `python scripts/05_query_rag.py`
6. `python scripts/06_eval_rag.py`

## 说明

- 当前首版只处理 `docx` 文档，不处理 `xlsx`。
- FAQ 走快路径，优先于向量检索。
- 向量检索和查询统一使用 `BAAI/bge-large-zh-v1.5`，避免 embedding 不一致。
- `04_build_chroma.py` 会在重建索引前删除同名 collection，便于重复执行。

### 短专名召回约定（重要）

- 单段落里堆叠多个景点（如旧版「## 其他特色景点」把佛手广场/百子戏弥勒/曼飞龙塔/灵山精舍挤在一起）会导致：
  1. 切出的 chunk 没有 `spot_name`，向量召回时被「拈花广场」等结构化数据块挤掉；
  2. rerank 里 `mixed_spot_penalty` 进一步扣分，短专名（佛手广场尺寸等）几乎检索不到。
- **约定：每个景点单独用 `### 景点名` 子小节**，让 `03_chunk_text.py` 自动带上 `spot_name` / `section_path` metadata，向量召回 + rerank 字面加分才能命中。
- 该拆分已同步到 **源头** `data/markdown/lingshan_guide.md` 与 `data/cleaned/...`，重跑 `02_clean_text.py` 不会丢失。
- 新增景点时，需要把景点名同时加入 `03_chunk_text.py` 和 `scripts/rag_utils.py` 的 `SPOT_NAMES`（rag_utils 的 `LITERAL_MATCH_VOCAB` 会自动包含）。
- `data/faq/faq_seed.jsonl` 为高频精确问法补了佛手广场/天下第一掌/百子戏弥勒/曼飞龙塔/灵山精舍的 FAQ，作为兜底快路径；向量召回修好后非兜底问法也能命中。

### 改动数据后如何生效

修改 markdown / chunk 规则 / SPOT_NAMES 后，必须按顺序重跑并重启 Fay 的 MCP 子进程：

```bash
python scripts/03_chunk_text.py      # 重切 chunk
python scripts/04_build_chroma.py    # 重建向量库（同名 collection 会先删后建）
```

> Fay 通过 STDIO 拉起本服务的子进程会**缓存 FAQ 与 Chroma collection 句柄**，
> 仅靠 Fay 后台的「重启」按钮不一定真正重启子进程。最可靠是整体重启 Fay
> （`python main.py start`），让 `autostart` 重新 spawn 一个干净子进程。

## Fay / MCP 集成

当前仓库已经补充了本地 `STDIO` MCP 服务入口，可直接接入 Fay。

### 1. 安装依赖

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 本地启动 MCP 服务

```bash
source .venv/bin/activate
python mcp_server/server.py
```

这个服务会暴露两个 MCP 工具：

- `lingshan_rag_status`：查看知识库路径、collection 名称、LLM 配置状态
- `query_lingshan_rag`：查询灵山知识库

### 3. 在 Fay 中添加 MCP

本仓库实际路径在 `/Users/MR/Desktop/软件杯/lingshan-rag`。Fay 的 `faymcp/data/mcp_servers.json`
里已注册（`id=7`，`autostart=true`），并在 `mcp_prestart_tools.json` 里把
`query_lingshan_rag` 配成 prestart 工具（`{{question}}` 自动注入用户问题），
因此数字人主对话流（fay_core → nlp_cognitive_stream）每轮会先查知识库再回答。

注册项关键字段：

- 命令：`python`
- 参数：`/Users/MR/Desktop/软件杯/lingshan-rag/mcp_server/server.py`
- 工作目录：`/Users/MR/Desktop/软件杯/lingshan-rag`
- env：`LINGSHAN_LLM_API_KEY` / `LINGSHAN_LLM_BASE_URL` / `LINGSHAN_LLM_MODEL`（百炼）

> 路径用绝对路径。Fay 跑在 git worktree 里时，`../../lingshan-rag/...` 这类相对路径会解析失败。

### 4. Fay 环境变量 JSON（当前使用阿里百炼 Qwen）

```json
{
  "LINGSHAN_LLM_API_KEY": "你的百炼key",
  "LINGSHAN_LLM_BASE_URL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "LINGSHAN_LLM_MODEL": "qwen-turbo"
}
```

如果暂时只想使用本地检索回答，可以不填这些变量，系统会自动回退到本地答案生成。

### 5. 关于截图中的 `YUESHEN_*` 变量

截图里的 `YUESHEN_*` 命名不适用于当前仓库。这个项目实际识别的是以下环境变量：

- `LINGSHAN_LLM_API_KEY`
- `LINGSHAN_LLM_BASE_URL`
- `LINGSHAN_LLM_MODEL`
- 兼容 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_API_BASE`、`OPENAI_MODEL`、`OPENAI_CHAT_MODEL`

### 6. 后续更新知识库

当前 MCP 层只负责查询，不负责自动导入新文档。新增资料后，继续按原流程手动重建索引：

1. `python scripts/01_docx_to_md.py`
2. `python scripts/02_clean_text.py`
3. `python scripts/03_chunk_text.py`
4. `python scripts/04_build_chroma.py`
