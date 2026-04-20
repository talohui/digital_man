from pathlib import Path
import re

from docx import Document


RAW_DOCX = Path("data/raw/灵山胜境：历史、文化、景点特色与个性化游览指南.docx")
OUT_MD = Path("data/markdown/lingshan_guide.md")


def infer_heading_prefix(text: str) -> str:
    if re.match(r"^[一二三四五六七八九十]+、", text):
        return "#"
    if re.match(r"^（[一二三四五六七八九十]+）", text):
        return "##"
    if re.match(r"^\d+[\.、]", text):
        return "###"
    return ""


def paragraph_to_markdown(paragraph) -> str:
    text = paragraph.text.strip()
    if not text:
        return ""

    style_name = paragraph.style.name if paragraph.style else ""

    if "Heading 1" in style_name or "标题 1" in style_name:
        return f"# {text}"
    if "Heading 2" in style_name or "标题 2" in style_name:
        return f"## {text}"
    if "Heading 3" in style_name or "标题 3" in style_name:
        return f"### {text}"

    inferred = infer_heading_prefix(text)
    if inferred:
        return f"{inferred} {text}"

    return text


def docx_to_markdown(docx_path: Path, out_path: Path) -> None:
    doc = Document(docx_path)
    lines = []

    for para in doc.paragraphs:
        md = paragraph_to_markdown(para)
        if md:
            lines.append(md)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    docx_to_markdown(RAW_DOCX, OUT_MD)
    print(f"转换完成：{OUT_MD}")
