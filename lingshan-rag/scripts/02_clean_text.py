import re
from pathlib import Path


IN_MD = Path("data/markdown/lingshan_guide.md")
OUT_MD = Path("data/cleaned/lingshan_guide_cleaned.md")

REMOVE_PATTERNS = [
    r"^\s*目录\s*$",
    r"^\s*目\s*录\s*$",
    r"^\s*第\s*\d+\s*页\s*$",
    r"^\s*Page\s+\d+\s*$",
]


def is_noise_line(line: str) -> bool:
    line = line.strip()
    if not line:
        return True
    for pattern in REMOVE_PATTERNS:
        if re.match(pattern, line, flags=re.IGNORECASE):
            return True
    return False


def is_table_line(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith("|") and stripped.endswith("|")


def clean_markdown(text: str) -> str:
    lines = text.splitlines()
    cleaned = []
    last_line = None

    for line in lines:
        raw_line = line.strip()
        if is_table_line(raw_line):
            cleaned.append(raw_line)
            last_line = raw_line
            continue

        line = raw_line
        if is_noise_line(line):
            continue
        if line == last_line:
            continue
        line = re.sub(r"[ \t]+", " ", line)
        cleaned.append(line)
        last_line = line

    result_parts = []
    previous_was_table = False
    for line in cleaned:
        current_is_table = is_table_line(line)
        if not result_parts:
            result_parts.append(line)
        elif current_is_table or previous_was_table:
            result_parts.append("\n" + line)
        else:
            result_parts.append("\n\n" + line)
        previous_was_table = current_is_table

    result = "".join(result_parts)
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


if __name__ == "__main__":
    text = IN_MD.read_text(encoding="utf-8")
    cleaned = clean_markdown(text)
    OUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUT_MD.write_text(cleaned, encoding="utf-8")
    print(f"清洗完成：{OUT_MD}")
