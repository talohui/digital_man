import json
import os
from pathlib import Path
import re
from typing import Optional
from urllib import error, request

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHROMA_DIR = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "lingshan_guide_v2"
EMBED_MODEL_NAME = "BAAI/bge-large-zh-v1.5"
FAQ_PATH = PROJECT_ROOT / "data" / "faq" / "faq_seed.jsonl"
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
SERVICE_HINTS = ["餐饮", "住宿", "门票", "交通", "停车", "开放", "开放时间", "素斋"]
INTENT_PATTERNS = {
    "路线推荐": ["路线", "怎么逛", "安排", "半日游", "亲子", "行程", "怎么游玩"],
    "景点特色": ["特色", "看点", "值得看", "里面能看什么"],
    "服务信息": [
        "门票", "开放", "停车", "吃饭", "吃", "住宿", "交通",
        "餐饮", "素斋", "自助", "多少钱", "价格", "几点",
        "最佳", "什么时候", "时间",
    ],
    "讲解知识": ["寓意", "文化意义", "讲解"],
}
# 命中这些景点别名也视为有效信号（文档里真实存在但不在主 SPOT_NAMES 列表的景点/区域）
EXTRA_PLACE_HINTS = [
    "佛手广场", "胜境广场", "佛前广场", "杏坛广场", "梵宫广场",
    "菩提大道", "灵山精舍", "曼飞龙塔", "灵山大照壁",
    "抱佛脚", "三圣殿",
]
FAQ_SYNONYM_GROUPS = [
    (["怎么安排路线", "怎么逛", "怎么游玩"], "路线"),
    (["必看景点", "核心景点", "有什么好玩的"], "景点"),
]
FAQ_KEYWORDS = ["亲子", "路线", "景点", "梵宫", "灵山大佛", "九龙灌浴", "五印坛城", "文化", "门票", "灵山胜境"]
FEATURE_DETAIL_KEYWORDS = [
    "艺术",
    "建筑",
    "科技",
    "卢浮宫",
    "穹顶",
    "华藏世界",
    "东阳木雕",
    "敦煌壁画",
    "琉璃",
    "全息投影",
    "水雾",
    "沉浸式",
]
REALTIME_HINTS = [
    "今天", "今日", "现在", "目前", "实时", "最近", "近期", "一周", "本周",
    "临时", "排队", "人多", "停演", "开放吗",
]
NEARBY_EXTERNAL_HINTS = [
    "附近", "周边", "火锅店", "餐厅", "民宿", "酒店", "评分最高", "充电桩",
    "机场", "高铁站", "火车站", "打车", "出租车", "网约车", "停车费",
]
UNSUPPORTED_POLICY_HINTS = [
    "宠物", "导盲犬", "志愿者讲解",
]
SUPPORT_HINTS = set(SPOT_NAMES) | set(EXTRA_PLACE_HINTS) | {
    "灵山",
    "景区",
    "景点",
    "佛教",
    "路线",
    "门票",
    "交通",
    "开放",
    "住宿",
    "餐饮",
    "讲解",
    "文化",
    "亲子",
    "摄影",
    "半日游",
    # 服务/实用类触发词
    "素斋", "自助", "价格", "多少钱", "几点",
    "最佳", "时间", "什么时候", "建议", "贴士",
    "穿着", "穿", "衣服", "停车",
    "半价", "免票", "联票", "成人票", "优惠", "军人", "学生", "儿童", "老人",
    # 文化/术语触发词
    "五方五佛", "手印", "台阶", "寓意", "象征", "艺术", "建筑",
    # 动作/问法
    "建造", "工艺", "规模",
}
LOCAL_FALLBACK_ANSWER = "这个问题暂时超出了当前灵山胜境知识库范围，我还不能确定回答。"
LLM_TIMEOUT_SECONDS = 60

_EMBEDDING_FUNCTION = None
_CLIENT = None
_COLLECTION = None
_FAQ_CACHE = None


def get_embedding_function():
    global _EMBEDDING_FUNCTION
    if _EMBEDDING_FUNCTION is None:
        _EMBEDDING_FUNCTION = SentenceTransformerEmbeddingFunction(model_name=EMBED_MODEL_NAME)
    return _EMBEDDING_FUNCTION


def get_client():
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return _CLIENT


def get_collection():
    global _COLLECTION
    if _COLLECTION is None:
        _COLLECTION = get_client().get_collection(
            name=COLLECTION_NAME,
            embedding_function=get_embedding_function(),
        )
    return _COLLECTION


def load_faq():
    global _FAQ_CACHE
    if _FAQ_CACHE is not None:
        return _FAQ_CACHE

    if not FAQ_PATH.exists():
        _FAQ_CACHE = []
        return _FAQ_CACHE

    faqs = []
    with FAQ_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                faqs.append(json.loads(line))
    _FAQ_CACHE = faqs
    return _FAQ_CACHE


def normalize_text(text: str) -> str:
    text = text.strip().replace("？", "").replace("?", "").replace(" ", "")
    text = re.sub(r"\s+", "", text)
    return text


def normalize_faq_text(text: str) -> str:
    normalized = normalize_text(text)
    for patterns, replacement in FAQ_SYNONYM_GROUPS:
        for pattern in patterns:
            normalized = normalized.replace(normalize_text(pattern), replacement)
    return normalized


def extract_query_spot_name(query: str) -> str:
    for spot_name in SPOT_NAMES:
        if spot_name in query:
            return spot_name
    return ""


def detect_query_intent(query: str) -> str:
    for intent, patterns in INTENT_PATTERNS.items():
        if any(pattern in query for pattern in patterns):
            return intent
    return ""


def extract_faq_keywords(text: str) -> set[str]:
    return {keyword for keyword in FAQ_KEYWORDS if keyword in text}


def faq_match(query: str, faqs):
    normalized_query = normalize_faq_text(query)
    query_keywords = extract_faq_keywords(normalized_query)
    for faq in faqs:
        normalized_question = normalize_faq_text(faq["question"])
        if normalized_query == normalized_question:
            return faq
        if normalized_question and normalized_question in normalized_query:
            return faq
        if normalized_query and normalized_query in normalized_question:
            return faq
        overlap = query_keywords & extract_faq_keywords(normalized_question)
        # 阈值从 2 提到 3：避免 {亲子,路线} 这种宽泛重叠把真实 chunk 挡在门外，
        # 留给 retrieval 去回答更完整的版本。真正精确的 FAQ 命中走上面的完整/子串匹配。
        if len(overlap) >= 3:
            return faq
    return None


def is_heading_only_text(text: str) -> bool:
    body = [line.strip() for line in text.splitlines() if line.strip()]
    return len(body) == 1 and body[0].startswith("#")


def has_supported_signal(query: str) -> bool:
    if extract_query_spot_name(query):
        return True
    if detect_query_intent(query):
        return True
    return any(hint in query for hint in SUPPORT_HINTS)


def contains_any(text: str, patterns: list[str]) -> bool:
    return any(pattern in text for pattern in patterns)


def is_explicit_oos_query(query: str) -> bool:
    # 1) 实时状态类：知识库没有当天状态、天气、排队、临时停演等动态信息
    if contains_any(query, REALTIME_HINTS):
        return True

    # 2) 景区周边/外部信息：周边餐饮、交通价格、充电桩等不在当前知识范围
    if contains_any(query, NEARBY_EXTERNAL_HINTS):
        return True

    # 3) 票务/预约类的更细运营规则：当前知识库只有演出时间，没有次日预约/购买规则
    if ("演出票" in query or "预约" in query) and ("第二天" in query or "次日" in query):
        return True

    # 4) 入园政策/志愿者等运营信息目前未收录
    if contains_any(query, UNSUPPORTED_POLICY_HINTS):
        return True

    return False


def dedupe_preserve_order(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def split_sentences(text: str) -> list[str]:
    cleaned = re.sub(r"#{1,6}\s*", "", text)
    # First break on line boundaries and double-space bullet separators, so a
    # route paragraph like "菩提大道：... 灵山大佛：... 九龙灌浴：..." doesn't
    # survive as one giant "sentence".
    coarse_parts = re.split(r"(?:\r?\n)+|\s{2,}", cleaned)
    # Also break before inline structural labels that mark a new item.
    LABEL_RE = re.compile(r"(?<!^)(?=(?:路线规划|讲解重点|特色体验|适合人群|推荐理由)：)")
    expanded = []
    for part in coarse_parts:
        expanded.extend(LABEL_RE.split(part))
    sentences = []
    for part in expanded:
        # Now split each piece on Chinese sentence terminators.
        for sub in re.split(r"[。！？；]", part):
            sentence = re.sub(r"\s+", " ", sub).strip(" ：:;，, -—→")
            if len(sentence) >= 8:
                sentences.append(sentence)
    return sentences


def extract_query_keywords(query: str) -> set[str]:
    keywords = set()
    query_spot_name = extract_query_spot_name(query)
    query_intent = detect_query_intent(query)
    if query_spot_name:
        keywords.add(query_spot_name)
    if query_intent == "景点特色":
        keywords.update(FEATURE_DETAIL_KEYWORDS)
    elif query_intent == "服务信息":
        keywords.update(SERVICE_HINTS)
    elif query_intent == "讲解知识":
        keywords.update(["文化", "寓意", "讲解", "象征", "故事"])
    elif query_intent == "路线推荐":
        keywords.update(["路线规划", "路线", "亲子", "游览", "行程"])
    for hint in SUPPORT_HINTS:
        if hint in query:
            keywords.add(hint)
    return keywords


def collect_reference_paths(hits: list[dict], limit: int = 3) -> list[str]:
    paths = []
    for hit in hits:
        metadata = hit["metadata"] or {}
        section_path = metadata.get("section_path", "")
        if section_path:
            paths.append(section_path)
    return dedupe_preserve_order(paths)[:limit]


def extract_route_plan(text: str) -> str:
    match = re.search(r"路线规划：(.+?)(讲解重点：|特色体验：|$)", text, flags=re.S)
    if not match:
        return ""
    route = re.sub(r"\s+", " ", match.group(1)).strip(" ：:")
    return route


def score_sentence(sentence: str, query: str, query_keywords: set[str], query_spot_name: str, query_intent: str) -> float:
    score = 0.0
    if query_spot_name and query_spot_name in sentence:
        score += 3.0
    for keyword in query_keywords:
        if keyword and keyword in sentence:
            score += 1.0
    if query_intent == "景点特色" and any(keyword in sentence for keyword in FEATURE_DETAIL_KEYWORDS):
        score += 2.0
    if query_intent == "服务信息" and any(keyword in sentence for keyword in SERVICE_HINTS):
        score += 1.5
    if query_intent == "路线推荐" and any(keyword in sentence for keyword in ["路线规划", "亲子", "游览", "互动", "表演"]):
        score += 1.5
    if query_intent == "讲解知识" and any(keyword in sentence for keyword in ["寓意", "文化", "象征", "讲解", "故事"]):
        score += 1.5
    if len(sentence) > 80:
        score -= 0.2
    return score


def extract_best_sentences(query: str, hits: list[dict], max_sentences: int = 3) -> list[str]:
    query_spot_name = extract_query_spot_name(query)
    query_intent = detect_query_intent(query)
    query_keywords = extract_query_keywords(query)
    scored = []

    for hit in hits[:3]:
        for sentence in split_sentences(hit["text"]):
            score = score_sentence(sentence, query, query_keywords, query_spot_name, query_intent)
            if score > 0:
                scored.append((score, sentence))

    scored.sort(key=lambda item: item[0], reverse=True)
    sentences = []
    seen = set()
    for _, sentence in scored:
        normalized = normalize_text(sentence)
        if normalized in seen:
            continue
        seen.add(normalized)
        sentences.append(sentence)
        if len(sentences) >= max_sentences:
            break

    # 没有高分句子时（query 关键词都不在 text 正文里），退化为 top hit 的前 N 句。
    # 这保证在三级小节 chunk（比如"五印坛城 > 建筑风格"）里 section 包含景点名但
    # 正文里不再重复景点名时，依然能把正文前几句返回出来。
    if not sentences and hits:
        for sentence in split_sentences(hits[0]["text"])[:max_sentences]:
            normalized = normalize_text(sentence)
            if normalized in seen:
                continue
            seen.add(normalized)
            sentences.append(sentence)
    return sentences


def build_feature_answer(query: str, hits: list[dict]) -> str:
    query_spot_name = extract_query_spot_name(query)
    joined_text = "\n".join(hit["text"] for hit in hits[:3])
    points = []

    # 只有在 query 是宽泛"梵宫特色"时才走模板；如果 query 里带具体子词（吉祥颂、
    # 素斋、圣坛、穹顶等），让它走正常句子提取，否则硬点模板会把子问题答案抹掉。
    specific_subtopic = any(kw in query for kw in ["吉祥颂", "圣坛", "穹顶", "素斋", "木雕", "壁画", "琉璃", "华藏"])
    if query_spot_name == "梵宫" and not specific_subtopic:
        if any(keyword in joined_text for keyword in ["卢浮宫", "菩提伽耶塔", "石窟艺术"]):
            points.append("整体被称为“佛教艺术的卢浮宫”，融合了菩提伽耶塔风格与中国石窟艺术")
        if any(keyword in joined_text for keyword in ["穹顶天象图", "华藏世界", "东阳木雕", "敦煌壁画", "琉璃"]):
            points.append("内部可重点看穹顶天象图、《华藏世界》、东阳木雕等艺术内容")
        if any(keyword in joined_text for keyword in ["现代科技", "光学", "声学", "力学", "全息投影", "水雾", "沉浸式"]):
            points.append("同时结合光学、声学等现代科技，整体体验更沉浸")
        if any(keyword in joined_text for keyword in ["圣坛", "吉祥颂"]):
            points.append("如果想看现场体验，还可以关注梵宫圣坛相关演出")

    if points:
        return f"{query_spot_name}的主要特色是" + "；".join(points[:3]) + "。"

    sentences = extract_best_sentences(query, hits, max_sentences=3)
    if not sentences:
        return LOCAL_FALLBACK_ANSWER

    prefix = f"{query_spot_name}的主要特色是" if query_spot_name else "相关内容主要包括"
    return prefix + "；".join(sentences[:3]) + "。"


def build_route_answer(query: str, hits: list[dict]) -> str:
    route = extract_route_plan(hits[0]["text"]) if hits else ""
    extras = extract_best_sentences(query, hits, max_sentences=2)

    if "亲子" in query:
        prefix = "亲子游可以这样安排："
    elif extract_query_spot_name(query):
        prefix = f"{extract_query_spot_name(query)}相关路线可以这样安排："
    else:
        prefix = "可以这样安排游览路线："

    parts = []
    if route:
        parts.append(prefix + route + "。")
    elif extras:
        parts.append(prefix + extras[0] + "。")

    remaining = []
    for extra in extras:
        if route and extra in route:
            continue
        remaining.append(extra)
    if remaining:
        parts.append("这条路线的亮点是" + "；".join(remaining[:2]) + "。")

    if not parts:
        return LOCAL_FALLBACK_ANSWER
    return "".join(parts)


def build_service_answer(query: str, hits: list[dict]) -> str:
    # 优先把 topic=服务信息 的 chunk 排到前面，避免文化/路线 chunk 抢答服务问题
    prioritized = sorted(
        hits[:5],
        key=lambda h: 0 if (h["metadata"] or {}).get("topic", "") == "服务信息" else 1,
    )
    sentences = extract_best_sentences(query, prioritized, max_sentences=4)
    if not sentences:
        return LOCAL_FALLBACK_ANSWER
    return "根据当前知识库，相关信息是：" + "；".join(sentences[:4]) + "。"


CULTURE_SENTENCE_KEYWORDS = [
    "寓意", "象征", "文化", "佛教", "讲解", "含义", "故事",
    "五方五佛", "手印", "台阶", "传承", "缘起", "渊源",
]
ROUTE_SENTENCE_MARKERS = ["路线规划", "入园", "出口", "→", "小时", "行程", "全景游", "深度游"]


def filter_culture_sentences(hits: list[dict], query_spot_name: str) -> list[dict]:
    """Prefer chunks that are actually about culture, not routes that mention a spot."""
    filtered = []
    for hit in hits:
        metadata = hit["metadata"] or {}
        topic = metadata.get("topic", "")
        text = hit["text"]
        if topic == "路线推荐":
            continue
        if "路线规划：" in text or "爱好者路线" in (metadata.get("section_path", "") or ""):
            continue
        filtered.append(hit)
    return filtered or hits


def build_culture_answer(query: str, hits: list[dict]) -> str:
    query_spot_name = extract_query_spot_name(query)
    culture_hits = filter_culture_sentences(hits, query_spot_name)

    scored = []
    for hit in culture_hits[:3]:
        for sentence in split_sentences(hit["text"]):
            if any(marker in sentence for marker in ROUTE_SENTENCE_MARKERS):
                continue
            score = 0.0
            if query_spot_name and query_spot_name in sentence:
                score += 2.0
            score += sum(1.0 for kw in CULTURE_SENTENCE_KEYWORDS if kw in sentence)
            if 15 <= len(sentence) <= 90:
                score += 0.5
            elif len(sentence) > 120:
                score -= 1.0
            if score > 0:
                scored.append((score, sentence))

    scored.sort(key=lambda item: item[0], reverse=True)
    sentences = []
    seen = set()
    for _, sentence in scored:
        normalized = normalize_text(sentence)
        if normalized in seen:
            continue
        seen.add(normalized)
        sentences.append(sentence)
        if len(sentences) >= 3:
            break

    if not sentences:
        return LOCAL_FALLBACK_ANSWER

    if query_spot_name:
        prefix = f"{query_spot_name}的文化意义主要体现在："
    else:
        prefix = "这部分的文化讲解重点是："
    body = "；".join(sentences)
    if not body.endswith("。"):
        body += "。"
    return prefix + body


def should_refuse_answer(query: str, hits: list[dict]) -> bool:
    if is_explicit_oos_query(query):
        return True
    if not hits:
        return True
    if not has_supported_signal(query):
        return True

    top_hit = hits[0]
    top_score = float(top_hit.get("score", 0.0))
    query_spot_name = extract_query_spot_name(query)
    query_intent = detect_query_intent(query)
    haystack = "\n".join(
        ((hit["metadata"] or {}).get("section_path", "") + "\n" + hit["text"])
        for hit in hits[:3]
    )

    # 短查询/单词向量距离天然偏远，只要正文命中关键词或有明确服务/景点信号就不 refuse
    if top_score < -0.85:
        return True

    if query_spot_name and query_spot_name not in haystack:
        return True

    # 服务信息意图：top3 任意 chunk topic=服务信息，或者命中服务信息关键词在正文里，都放行
    if query_intent == "服务信息":
        service_topic_hit = any((hit["metadata"] or {}).get("topic", "") == "服务信息" for hit in hits[:3])
        service_keyword_in_hits = any(hint in haystack for hint in SERVICE_HINTS)
        if not (service_topic_hit or service_keyword_in_hits):
            return True

    # 别名景点（佛手广场等）：只要在 top3 正文里提到就放行
    for place in EXTRA_PLACE_HINTS:
        if place in query and place not in haystack:
            return True

    return False


def build_local_answer(query: str, hits: list[dict]) -> str:
    if should_refuse_answer(query, hits):
        return LOCAL_FALLBACK_ANSWER

    query_intent = detect_query_intent(query)
    if query_intent == "路线推荐":
        answer = build_route_answer(query, hits)
    elif query_intent == "服务信息":
        answer = build_service_answer(query, hits)
    elif query_intent == "讲解知识":
        answer = build_culture_answer(query, hits)
    else:
        answer = build_feature_answer(query, hits)

    references = collect_reference_paths(hits, limit=3)
    if references and "参考：" not in answer:
        answer = answer.rstrip() + f"\n参考：{'；'.join(references)}"
    return answer


def get_llm_config() -> Optional[dict]:
    api_key = os.getenv("LINGSHAN_LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    model = (
        os.getenv("LINGSHAN_LLM_MODEL")
        or os.getenv("OPENAI_MODEL")
        or os.getenv("OPENAI_CHAT_MODEL")
    )
    base_url = (
        os.getenv("LINGSHAN_LLM_BASE_URL")
        or os.getenv("OPENAI_BASE_URL")
        or os.getenv("OPENAI_API_BASE")
        or "https://api.openai.com/v1"
    )

    if not api_key or not model:
        return None

    return {
        "api_key": api_key,
        "model": model,
        "base_url": base_url.rstrip("/"),
    }


def llm_is_configured() -> bool:
    return get_llm_config() is not None


def get_runtime_status() -> dict:
    return {
        "project_root": str(PROJECT_ROOT),
        "chroma_dir": str(CHROMA_DIR),
        "chroma_exists": CHROMA_DIR.exists(),
        "faq_path": str(FAQ_PATH),
        "faq_exists": FAQ_PATH.exists(),
        "collection_name": COLLECTION_NAME,
        "embed_model_name": EMBED_MODEL_NAME,
        "llm_configured": llm_is_configured(),
    }


def ensure_reference_suffix(answer: str, references: list[str]) -> str:
    if not references:
        return answer.strip()
    if "参考：" in answer:
        return answer.strip()
    return answer.strip() + f"\n参考：{'；'.join(references)}"


def generate_answer(prompt: str) -> tuple[Optional[str], Optional[str]]:
    config = get_llm_config()
    if config is None:
        return None, "llm_not_configured"

    payload = {
        "model": config["model"],
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0.2,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config['api_key']}",
    }
    req = request.Request(
        url=f"{config['base_url']}/chat/completions",
        data=data,
        headers=headers,
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=LLM_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        return None, f"http_{exc.code}: {body}"
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)

    content = (
        result.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        return None, "empty_llm_response"
    return content, None


LITERAL_MATCH_VOCAB = (
    set(SPOT_NAMES)
    | set(EXTRA_PLACE_HINTS)
    | set(SERVICE_HINTS)
    | {
        "半价票", "免票", "联票", "成人票", "观光车", "网购", "优惠",
        "军人", "学生", "儿童", "老人", "门票", "开放时间",
        "吉祥颂", "圣坛", "穹顶", "素斋", "木雕", "壁画", "琉璃",
        "菩提大道", "转经廊", "银杏", "古井", "江南第一钟", "抱佛脚",
        "天下第一掌", "佛手广场", "五方五佛", "手印",
        "建造工艺", "建筑规模", "建筑风格",
    }
)


def extract_literal_tokens(query: str) -> list[str]:
    """从 query 里抽出已知词表里存在的字面子串，用于 BM25-lite 字面加分。"""
    hits = [token for token in LITERAL_MATCH_VOCAB if token and token in query]
    hits.sort(key=len, reverse=True)
    # 被更长 token 包含的短 token 丢掉，避免"门票"和"半价票"重复加分
    kept = []
    for token in hits:
        if not any(token != longer and token in longer for longer in kept):
            kept.append(token)
    return kept


def rerank_hits(query: str, hits: list[dict]) -> list[dict]:
    query_spot_name = extract_query_spot_name(query)
    query_intent = detect_query_intent(query)
    literal_tokens = extract_literal_tokens(query)

    reranked = []
    for hit in hits:
        metadata = hit["metadata"] or {}
        section_path = metadata.get("section_path", "")
        metadata_spot_name = metadata.get("spot_name", "")
        topic = metadata.get("topic", "")
        text = hit["text"]
        feature_haystack = f"{section_path}\n{text}"

        score = -float(hit["distance"])
        match_reasons = ["vector_distance"]

        if query_spot_name and metadata_spot_name == query_spot_name:
            score += 0.25
            match_reasons.append("spot_name_exact")
        if query_spot_name and query_spot_name in section_path:
            score += 0.15
            match_reasons.append("spot_name_in_section")
        if query_spot_name and query_spot_name in text:
            score += 0.06
            match_reasons.append("spot_name_in_text")
        if query_intent == "路线推荐" and topic == "路线推荐":
            score += 0.18
            match_reasons.append("route_topic_match")
        if query_intent == "景点特色" and topic == "景点特色":
            score += 0.15
            match_reasons.append("feature_topic_match")
        if query_intent == "服务信息" and topic == "服务信息":
            score += 0.15
            match_reasons.append("service_topic_match")
        if query_intent == "讲解知识" and topic in {"讲解知识", "历史文化"}:
            score += 0.22
            match_reasons.append("culture_topic_match")
        if query_intent != "路线推荐" and topic == "路线推荐":
            score -= 0.32
            match_reasons.append("route_topic_penalty")
        if query_intent != "路线推荐" and text.lstrip().startswith("## ") and "路线" in text[:40]:
            score -= 0.15
            match_reasons.append("route_heading_penalty")
        if query_intent != "路线推荐" and "路线规划：" in text:
            score -= 0.20
            match_reasons.append("route_plan_body_penalty")
        if is_heading_only_text(text):
            score -= 0.40
            match_reasons.append("heading_only_penalty")
        if any(hint in section_path for hint in SERVICE_HINTS) and query_intent != "服务信息":
            score -= 0.18
            match_reasons.append("service_section_penalty")
        if query_spot_name and metadata_spot_name and metadata_spot_name != query_spot_name:
            score -= 0.12
            match_reasons.append("spot_mismatch_penalty")

        if query_intent == "景点特色":
            if query_spot_name == "梵宫" and any(keyword in feature_haystack for keyword in FEATURE_DETAIL_KEYWORDS):
                score += 0.22
                match_reasons.append("feature_detail_boost")
            if topic == "历史文化":
                score -= 0.05
                match_reasons.append("feature_prefers_detail")
            if "交流平台" in section_path:
                score -= 0.08
                match_reasons.append("platform_background_penalty")
            if "其他特色景点" in section_path:
                score -= 0.18
                match_reasons.append("mixed_spot_penalty")

        if query_intent == "路线推荐" and "路线规划：" in text:
            score += 0.10
            match_reasons.append("route_plan_boost")

        # 字面 token 加分：query 里已知词表命中 hit 的 section 或 text。
        # 针对 bge-large 对"佛手广场""半价票""网购联票"这类短专名/表格词
        # 语义泛化的副作用，让真正字面出现的 chunk 被 rerank 拉回来。
        if literal_tokens:
            section_hits = sum(1 for token in literal_tokens if token in section_path)
            text_hits = sum(1 for token in literal_tokens if token in text)
            literal_boost = 0.30 * section_hits + 0.18 * text_hits
            if literal_boost > 0:
                score += min(literal_boost, 0.60)
                match_reasons.append(f"literal_match(sec={section_hits},text={text_hits})")

        reranked.append(
            {
                **hit,
                "score": score,
                "match_reasons": match_reasons,
            }
        )

    reranked.sort(key=lambda item: item["score"], reverse=True)
    return reranked


def search_chroma(query: str, top_k: int = 5):
    collection = get_collection()
    initial_k = max(top_k, 20)
    result = collection.query(
        query_texts=[query],
        n_results=initial_k,
    )
    hits = []
    for i in range(len(result["ids"][0])):
        hits.append(
            {
                "id": result["ids"][0][i],
                "text": result["documents"][0][i],
                "metadata": result["metadatas"][0][i],
                "distance": result["distances"][0][i],
            }
        )
    reranked_hits = rerank_hits(query, hits)
    return reranked_hits[:top_k]


def build_answer_prompt(query: str, hits: list[dict]) -> str:
    context_parts = []
    for idx, hit in enumerate(hits, start=1):
        meta = hit["metadata"]
        context_parts.append(
            f"【资料{idx}】\n"
            f"来源文档：{meta.get('doc_name', '')}\n"
            f"章节路径：{meta.get('section_path', '')}\n"
            f"景点：{meta.get('spot_name', '')}\n"
            f"主题：{meta.get('topic', '')}\n"
            f"正文：{hit['text']}"
        )

    context = "\n\n".join(context_parts)
    return f"""
你是灵山胜境景区的智能导览数字人助手。
请严格根据下面的知识库资料回答用户问题。
要求：
1. 如果资料中没有答案，请说“这个问题暂时超出了当前灵山胜境知识库范围，我还不能确定回答。”
2. 不要编造不存在的景点、路线、历史事件或服务信息。
3. 回答要适合游客理解，尽量简洁自然。
4. 优先直接回答用户问题，不要复述检索过程。
5. 最后给出引用来源，格式为“参考：章节路径1；章节路径2”。
用户问题：
{query}
知识库资料：
{context}
请生成回答：
""".strip()


def answer_question(query: str, top_k: int = 5, use_llm: bool = True) -> dict:
    faqs = load_faq()
    faq = faq_match(query, faqs)
    if faq:
        return {
            "query": query,
            "answer": faq["answer"],
            "faq": faq,
            "hits": [],
            "used_llm": False,
            "llm_error": None,
            "prompt": None,
            "references": [],
        }

    hits = search_chroma(query, top_k=top_k)
    prompt = build_answer_prompt(query, hits[:3])
    references = collect_reference_paths(hits[:3], limit=3)

    if should_refuse_answer(query, hits[:3]):
        return {
            "query": query,
            "answer": LOCAL_FALLBACK_ANSWER,
            "faq": None,
            "hits": hits,
            "used_llm": False,
            "llm_error": None,
            "prompt": prompt,
            "references": [],
        }

    llm_answer = None
    llm_error = None
    if use_llm and llm_is_configured():
        llm_answer, llm_error = generate_answer(prompt)

    if llm_answer:
        answer = ensure_reference_suffix(llm_answer, references)
        used_llm = True
    else:
        answer = build_local_answer(query, hits[:3])
        used_llm = False

    return {
        "query": query,
        "answer": answer,
        "faq": None,
        "hits": hits,
        "used_llm": used_llm,
        "llm_error": llm_error,
        "prompt": prompt,
        "references": references,
    }
