import json
import re
from pathlib import Path
from typing import Optional


IN_MD = Path("data/markdown/灵山胜境 景点结构化数据集.md")
OUT_JSONL = Path("data/chunks/lingshan_table_chunks.jsonl")
DOC_NAME = "灵山胜境 景点结构化数据集.docx"

# 字段名 -> (topic, 额外tag)。用于给每个字段值生成 chunk 时打标签。
FIELD_TOPIC_MAP = {
    "景区名称": "综合介绍",
    "景点ID": "综合介绍",
    "景点名称": "综合介绍",
    "具体位置": "景点特色",
    "建筑/景观参数": "景点特色",
    "核心功能": "景点特色",
    "文化内涵": "讲解知识",
    "详细介绍": "景点特色",
    "游玩亮点": "路线推荐",
    "演艺/开放信息": "服务信息",
    "备注": "服务信息",
}

SCENIC_AREA_PREFIX = {
    "LS": "灵山胜境",
    "NH": "拈花湾禅意小镇",
}


def strip_bold(cell: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", cell).strip()


def parse_tables(md_text: str) -> list:
    """返回每行一条 dict：{field_name: value}。跳过表头和分隔行。"""
    rows = []
    current_headers = None

    for line in md_text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            current_headers = None
            continue

        cells = [strip_bold(c) for c in line.strip("|").split("|")]

        # 分隔行：全是 --- 之类
        if all(re.fullmatch(r"-{2,}|:?-{2,}:?", c.strip()) for c in cells if c.strip()):
            continue

        # 表头：包含"景点ID"或"景点名称"关键字段
        if "景点ID" in cells and "景点名称" in cells:
            current_headers = cells
            continue

        if current_headers is None:
            continue

        if len(cells) != len(current_headers):
            continue

        row = dict(zip(current_headers, cells))
        rows.append(row)

    return rows


def row_to_chunk(row: dict, idx: int) -> Optional[dict]:
    spot_id = row.get("景点ID", "").strip()
    spot_name = row.get("景点名称", "").strip()
    scenic_area = row.get("景区名称", "").strip()

    if not spot_id or not spot_name:
        return None

    prefix = spot_id.split("-")[0] if "-" in spot_id else ""
    if not scenic_area:
        scenic_area = SCENIC_AREA_PREFIX.get(prefix, "")

    # 拼接文本：按字段顺序输出，保留空字段（用"（空）"标记）。
    lines = []
    for field, value in row.items():
        value = value.strip()
        if value == "":
            lines.append(f"{field}：（空）")
        else:
            lines.append(f"{field}：{value}")
    text = "\n".join(lines)

    tags = [spot_name, scenic_area, spot_id]
    # 从非空字段拉几个关键词进 tags（粗略，便于关键字召回）
    for field in ("演艺/开放信息", "备注", "游玩亮点"):
        val = row.get(field, "")
        if "门票" in val or "票价" in val:
            tags.append("门票")
        if "开放时间" in val or "开放" in val:
            tags.append("开放时间")
        if "演出" in val or "演艺" in val:
            tags.append("演艺")
    tags = [t for t in dict.fromkeys(tags) if t]

    return {
        "id": f"lingshan_table_{spot_id}",
        "doc_name": DOC_NAME,
        "section_path": f"{scenic_area} > {spot_name}",
        "spot_name": spot_name,
        "spot_id": spot_id,
        "scenic_area": scenic_area,
        "topic": "景点特色",
        "source_type": "structured",
        "tags": tags,
        "text": text,
    }


def main() -> None:
    md_text = IN_MD.read_text(encoding="utf-8")
    rows = parse_tables(md_text)

    chunks = []
    for idx, row in enumerate(rows):
        item = row_to_chunk(row, idx)
        if item is not None:
            chunks.append(item)

    OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with OUT_JSONL.open("w", encoding="utf-8") as handle:
        for item in chunks:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"表格切块完成：{OUT_JSONL}")
    print(f"切片数量：{len(chunks)}")
    for item in chunks:
        print(f"  - {item['id']}  {item['scenic_area']} / {item['spot_name']}")


if __name__ == "__main__":
    main()
