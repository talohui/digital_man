import json
from pathlib import Path

import chromadb
from tqdm import tqdm

from rag_utils import COLLECTION_NAME, CHROMA_DIR, EMBED_MODEL_NAME, get_embedding_function


CHUNKS_FILES = [
    Path("data/chunks/lingshan_chunks.jsonl"),
    Path("data/chunks/lingshan_table_chunks.jsonl"),
]


def load_chunks(path: Path):
    items = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                items.append(json.loads(line))
    return items


def main() -> None:
    chunks = []
    for path in CHUNKS_FILES:
        if path.exists():
            loaded = load_chunks(path)
            chunks.extend(loaded)
            print(f"加载 {path}：{len(loaded)} 条")
        else:
            print(f"跳过不存在的文件：{path}")
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    existing = {
        item if isinstance(item, str) else item.name
        for item in client.list_collections()
    }
    if COLLECTION_NAME in existing:
        client.delete_collection(COLLECTION_NAME)

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=get_embedding_function(),
        metadata={
            "description": "灵山胜境首版RAG知识库",
            "embedding_model": EMBED_MODEL_NAME,
        },
    )

    ids = []
    documents = []
    metadatas = []

    for item in chunks:
        ids.append(item["id"])
        documents.append(item["text"])
        metadatas.append(
            {
                "doc_name": item["doc_name"],
                "section_path": item.get("section_path", ""),
                "spot_name": item.get("spot_name", ""),
                "topic": item.get("topic", ""),
                "tags": ",".join(item.get("tags", [])),
                "source_type": item.get("source_type", "narrative"),
                "spot_id": item.get("spot_id", ""),
                "scenic_area": item.get("scenic_area", ""),
            }
        )

    batch_size = 64
    for i in tqdm(range(0, len(ids), batch_size)):
        collection.add(
            ids=ids[i : i + batch_size],
            documents=documents[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
        )

    print("Chroma 入库完成")
    print(f"collection: {COLLECTION_NAME}")
    print(f"embedding model: {EMBED_MODEL_NAME}")
    print(f"chunks: {len(ids)}")


if __name__ == "__main__":
    main()
