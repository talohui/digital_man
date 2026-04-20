import json
import re
from pathlib import Path


IN_MD = Path("data/cleaned/lingshan_guide_cleaned.md")
OUT_JSONL = Path("data/chunks/lingshan_chunks.jsonl")
DOC_NAME = "灵山胜境：历史、文化、景点特色与个性化游览指南.docx"
CHUNK_SIZE_CHARS = 900
OVERLAP_CHARS = 120

SPOT_NAMES = [
    "灵山大佛",
    "九龙灌浴",
    "梵宫",
    "五印坛城",
    "祥符禅寺",
    "天下第一掌",
    "百子戏弥勒",
    "阿育王柱",
    "降魔浮雕",
    "佛足坛",
    "灵山胜境",
]

SERVICE_HINTS = [
    "餐饮",
    "住宿",
    "门票",
    "交通",
    "停车",
    "开放时间",
    "开放",
    "素斋",
]

TOPIC_KEYWORDS = {
    "历史文化": ["历史", "文化", "佛教", "传说", "缘起", "背景"],
    "景点特色": ["景点", "特色", "建筑", "景观", "看点", "亮点"],
    "路线推荐": ["路线", "游览", "推荐", "亲子", "摄影", "打卡", "行程"],
    "服务信息": ["开放", "门票", "交通", "停车", "时间", "餐饮", "服务"],
    "讲解知识": ["讲解", "寓意", "象征", "故事", "含义"],
}


def is_service_chunk(section_path: str, text: str) -> bool:
    preview = text[:120]
    haystack = f"{section_path}\n{preview}"
    return any(hint in haystack for hint in SERVICE_HINTS)


def detect_spot_name(section_path: str, text: str) -> str:
    if is_service_chunk(section_path, text):
        return ""

    titles = [part.strip() for part in section_path.split(" > ") if part.strip()]
    # 从最深层向上回溯每一级标题（"灵山大佛：世界最高... > 基本数据" 这种三级结构
    # 里，真正带景点名的是中间层，不是末级小节标题）。忽略最外层的汇总标题，
    # 避免 "核心景点特色详解：佛教艺术的殿堂" 污染到具体景点。
    for title in reversed(titles[1:] if len(titles) > 1 else titles):
        for name in SPOT_NAMES:
            if name in title:
                return name

    # 多景点路线节：不要从正文里回退猜 spot_name，否则路线 chunk 会把第一个
    # 出现的景点据为己有，在非路线问题上造成假匹配。
    path_text = section_path.replace(" > ", " ")
    is_route_like = any(kw in path_text for kw in ["路线", "游览", "行程"])
    if is_route_like:
        return ""

    preview = text[:120]
    for name in SPOT_NAMES:
        if name in preview:
            return name
    return ""


def detect_topic(section_path: str, text: str) -> str:
    path_text = section_path.replace(" > ", " ")
    # 「实用游览贴士」整节都是服务/实用信息，优先级最高，先于"路线"关键词判断
    if "实用游览贴士" in path_text or "最佳游览时间" in path_text or "其他实用建议" in path_text:
        return "服务信息"
    if any(keyword in path_text for keyword in ["门票", "交通", "餐饮", "住宿", "停车", "开放时间", "开放"]):
        return "服务信息"
    if "讲解重点" in path_text or any(keyword in path_text for keyword in ["寓意", "象征"]):
        return "讲解知识"
    if any(keyword in path_text for keyword in ["路线", "游览", "行程"]):
        return "路线推荐"
    if any(keyword in path_text for keyword in ["特色", "景点", "殿堂", "梵宫", "大佛", "坛城"]):
        return "景点特色"
    if any(keyword in path_text for keyword in ["历史", "文化", "缘起"]):
        return "历史文化"

    scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[topic] = score
    if not scores:
        return "综合介绍"
    best_topic = max(scores, key=scores.get)
    if best_topic == "历史文化" and any(keyword in text for keyword in ["路线", "游览", "行程", "亲子"]):
        return "路线推荐"
    return best_topic


def detect_tags(section_path: str, text: str, spot_name: str, topic: str) -> list[str]:
    tags = []
    for keywords in TOPIC_KEYWORDS.values():
        for kw in keywords:
            if kw in text:
                tags.append(kw)
    for part in section_path.split(" > "):
        part = part.strip()
        if part and len(part) <= 16:
            tags.append(part)
    if spot_name:
        tags.append(spot_name)
    if topic != "综合介绍":
        tags.append(topic)
    return list(dict.fromkeys(tags))


def is_heading_only_text(text: str) -> bool:
    body = [line.strip() for line in text.splitlines() if line.strip()]
    return len(body) == 1 and body[0].startswith("#")


def is_root_title_chunk(section_path: str, text: str) -> bool:
    body = [line.strip() for line in text.splitlines() if line.strip()]
    return not section_path and len(body) == 1


def parse_sections(markdown_text: str) -> list[dict]:
    lines = markdown_text.splitlines()
    sections = []
    current_path = []
    buffer = []

    def flush() -> None:
        if buffer:
            content = "\n".join(buffer).strip()
            if content:
                sections.append(
                    {
                        "section_path": " > ".join(current_path),
                        "text": content,
                    }
                )

    for line in lines:
        stripped = line.strip()
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading_match:
            flush()
            buffer.clear()
            level = len(heading_match.group(1))
            title = heading_match.group(2).strip()
            current_path[:] = current_path[: level - 1]
            current_path.append(title)
            buffer.append(stripped)
        else:
            buffer.append(stripped)

    flush()
    return sections


def split_text_with_overlap(text: str, chunk_size: int = 900, overlap: int = 120) -> list[str]:
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_len:
            break
        start = end - overlap
    return chunks


def main() -> None:
    markdown_text = IN_MD.read_text(encoding="utf-8")
    sections = parse_sections(markdown_text)
    all_chunks = []
    chunk_id = 0
    heading_only_skipped = 0

    for section in sections:
        section_path = section["section_path"]
        section_text = section["text"]
        pieces = split_text_with_overlap(
            section_text,
            chunk_size=CHUNK_SIZE_CHARS,
            overlap=OVERLAP_CHARS,
        )
        for piece in pieces:
            if is_heading_only_text(piece) or is_root_title_chunk(section_path, piece):
                heading_only_skipped += 1
                continue

            spot_name = detect_spot_name(section_path, piece)
            topic = detect_topic(section_path, piece)
            item = {
                "id": f"lingshan_{chunk_id:04d}",
                "doc_name": DOC_NAME,
                "section_path": section_path,
                "spot_name": spot_name,
                "topic": topic,
                "tags": detect_tags(section_path, piece, spot_name, topic),
                "text": piece,
            }
            all_chunks.append(item)
            chunk_id += 1

    OUT_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with OUT_JSONL.open("w", encoding="utf-8") as handle:
        for item in all_chunks:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"切块完成：{OUT_JSONL}")
    print(f"切片数量：{len(all_chunks)}")
    print(f"heading_only_skipped: {heading_only_skipped}")


if __name__ == "__main__":
    main()
