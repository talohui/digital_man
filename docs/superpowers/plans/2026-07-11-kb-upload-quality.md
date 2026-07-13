# B 端知识库上传质量闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让管理员上传资料后获得可解析、可检索、可回滚且有质量反馈的知识库入库结果。

**Architecture:** 将解析质检与 Flask 路由分离为纯函数；向量库提供文档级查询、删除接口；上传路由执行“质检 → 写入 → 检索烟测 → 替换旧版本”的事务式流程；前端展示服务端返回的质量报告。

**Tech Stack:** Python 3、Flask、python-docx、pypdf、ChromaDB、React、TypeScript、Ant Design。

---

### Task 1: 文档解析与质量报告

**Files:**
- Create: `lingshan-rag/kb_server/ingestion.py`
- Create: `lingshan-rag/kb_server/test_ingestion.py`
- Modify: `lingshan-rag/kb_server/app.py`

- [ ] 先写失败测试，覆盖文本清理、DOCX 表格、标题/表格统计和短文档拒绝。
- [ ] 运行 `python -m unittest kb_server/test_ingestion.py -v`，确认因 API 不存在失败。
- [ ] 实现 `parse_document`、`normalize_markdown`、`assess_document` 和 SHA-256 指纹。
- [ ] 重跑测试并确认通过。

### Task 2: 结构化句界切块

**Files:**
- Modify: `lingshan-rag/scripts/03_chunk_text.py`
- Modify: `lingshan-rag/kb_server/ingestion.py`
- Modify: `lingshan-rag/kb_server/test_ingestion.py`

- [ ] 先写失败测试，要求长段落优先在完整句号或段落边界切分并维持有限重叠。
- [ ] 运行测试确认旧按字符切分行为失败。
- [ ] 实现边界感知切分，保持现有函数签名兼容离线管线。
- [ ] 重跑 ingestion 与现有 RAG 测试。

### Task 3: 文档级原子写入与烟测

**Files:**
- Modify: `lingshan-rag/scripts/rag_utils.py`
- Modify: `lingshan-rag/kb_server/ingestion.py`
- Create: `lingshan-rag/kb_server/test_upload_pipeline.py`
- Modify: `lingshan-rag/kb_server/app.py`

- [ ] 先写失败测试，覆盖同内容跳过、同名替换、烟测失败回滚。
- [ ] 为 Chroma 增加按文档元数据查询和删除接口。
- [ ] 实现确定性探针生成和 Top5 `doc_id` 命中验证。
- [ ] 重构 `/kb/upload` 为事务式上传，并在成功响应中返回 `operation` 与 `quality`。
- [ ] 重跑服务测试与 35 条 RAG 回归。

### Task 4: B 端质量结果展示

**Files:**
- Modify: `demo/src/api/kb.ts`
- Modify: `demo/src/pages/AdminKnowledgePage.tsx`

- [ ] 扩展 `UploadResult` 类型，接收解析统计、主题、探针和烟测状态。
- [ ] 上传成功后用结果 Modal 展示“新增/替换/未变化”和“已验证可检索”。
- [ ] 保留现有统计、FAQ 和自动质检，不重构页面其他区域。
- [ ] 运行 `npm run build` 与 TypeScript 检查。

### Task 5: 端到端验证

**Files:**
- Modify: `lingshan-rag/README.md`

- [ ] 生成临时 Markdown 测试文档，通过 Flask test client 上传。
- [ ] 验证新文档探针能检索命中、重复上传不增量、替换失败保留旧版本。
- [ ] 运行 Python 单测、35 条回归、语法检查、前端构建和 `git diff --check`。
- [ ] 在 README 记录上传质量字段和管理员验收步骤。
