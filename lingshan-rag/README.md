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

Fay 配置推荐填写为：

- MCP 名称：`lingshan_rag`
- 类型：`STDIO（本地）`
- 命令：`/Users/MR/Desktop/rag知识库/lingshan-rag/.venv/bin/python`
- 参数：`/Users/MR/Desktop/rag知识库/lingshan-rag/mcp_server/server.py`
- 工作目录：`/Users/MR/Desktop/rag知识库/lingshan-rag`

### 4. Fay 环境变量 JSON

如果要启用“检索 + 大模型”回答，可在 Fay 的环境变量里填写：

```json
{
  "LINGSHAN_LLM_API_KEY": "你的key",
  "LINGSHAN_LLM_BASE_URL": "https://api.openai.com/v1",
  "LINGSHAN_LLM_MODEL": "gpt-4o-mini"
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
