"""Build exactly one reviewed DOCX topic; never touches other topic outputs."""
from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256
from io import BytesIO
from collections import Counter
import importlib.util
import json
import re
import sys
from lxml import etree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("population_builder", ROOT / "scripts/build-pocket-population.py")
population = importlib.util.module_from_spec(spec)
spec.loader.exec_module(population)
NS = {**population.NS, "m": "http://schemas.openxmlformats.org/officeDocument/2006/math"}
W, M = population.W, "{" + NS["m"] + "}"


def math_node(element):
    """Convert the source equation tree, retaining fractions and exponents."""
    kind = ET.QName(element).localname
    if kind in {"rPr", "ctrlPr"} or kind.endswith("Pr"):
        return None
    if kind == "r":
        return {"tag": "mtext", "text": "".join(element.xpath(".//m:t/text()", namespaces=NS))}
    if kind == "f":
        return {"tag": "mfrac", "children": [math_node(element.find("m:num", NS)), math_node(element.find("m:den", NS))]}
    if kind == "sSup":
        return {"tag": "msup", "children": [math_node(element.find("m:e", NS)), math_node(element.find("m:sup", NS))]}
    if kind == "sSub":
        return {"tag": "msub", "children": [math_node(element.find("m:e", NS)), math_node(element.find("m:sub", NS))]}
    children = [node for child in element if (node := math_node(child)) is not None]
    if kind == "d":
        prop = element.find("m:dPr", NS)
        begin = prop.find("m:begChr", NS) if prop is not None else None
        end = prop.find("m:endChr", NS) if prop is not None else None
        children = [{"tag": "mo", "text": begin.get(M + "val", "(") if begin is not None else "("}, *children,
                    {"tag": "mo", "text": end.get(M + "val", ")") if end is not None else ")"}]
    return {"tag": "mrow", "children": children}


def math_plain(node):
    if "text" in node:
        return node["text"]
    children = node.get("children", [])
    if node["tag"] == "mfrac":
        return f"({math_plain(children[0])})/({math_plain(children[1])})"
    if node["tag"] == "msup":
        power = math_plain(children[1])
        return math_plain(children[0]) + ("²" if power == "2" else f"^({power})")
    if node["tag"] == "msub":
        return math_plain(children[0]) + f"_({math_plain(children[1])})"
    return "".join(math_plain(child) for child in children)


class BookBuilder(population.Builder):
    def __init__(self, archive, source, number, config):
        super().__init__(archive)
        self.source, self.number, self.config = source, number, config
        self.context_row = None
        self.counter = Counter()
        self.applied_edits = set()
        self.assets = ROOT / f"assets/recall/pocket-{number}"
        self.assets.mkdir(parents=True, exist_ok=True)
        self.section_title = "专题总览"
        self.current_block = 0

    def blank(self, value, origin, expression=None):
        self.blank_count += 1
        self.counter[origin] += 1
        result = {"type": "blank", "id": f"pocket{self.number}-blank-{self.blank_count:04d}", "answer": value, "origin": origin}
        if expression:
            result["answer_math"] = expression
        return result

    def tokens(self, paragraph, index):
        parts = []
        for child in paragraph:
            kind = ET.QName(child).localname
            if child.tag in {M + "oMath", M + "oMathPara"}:
                node = math_node(child)
                red = "FF0000" in child.xpath(".//w:color/@w:val", namespaces=NS)
                self.counter["equations"] += 1
                parts.append({"type": "math-marked" if red else "math", "text": math_plain(node), "expression": node})
                continue
            if kind not in {"r", "hyperlink", "smartTag", "sdt"}:
                continue
            value = "".join(child.xpath(".//w:t/text()", namespaces=NS))
            if child.find("w:br", NS) is not None:
                value += "\n"
            if not value:
                continue
            marked = population.marked(child)
            part_kind = "marked" if marked and value.strip() else "text"
            if parts and parts[-1]["type"] == part_kind:
                parts[-1]["text"] += value
            else:
                parts.append({"type": part_kind, "text": value})
        original = "".join(part["text"] for part in parts)
        targets = []
        for edit_number, edit in enumerate(self.config.get("edits", [])):
            if edit["block"] != index or ("row" in edit and edit["row"] != self.context_row):
                continue
            full_text = "".join(p["text"] for p in parts)
            if edit["old"] not in full_text:
                continue
            if any(edit["old"] in part["text"] for part in parts):
                for part in parts:
                    part["text"] = part["text"].replace(edit["old"], edit["new"])
            else:
                if any(part["type"].startswith("math") for part in parts):
                    raise ValueError(f"Editorial replacement crosses equation at {index}")
                parts = [{"type": "text", "text": full_text.replace(edit["old"], edit["new"])}]
            self.applied_edits.add(edit_number)
            targets += edit.get("blanks", [])
            self.corrections.append({"source_block": index, "source_row": self.context_row, "original": edit["old"], "revised": edit["new"], "reason": edit["reason"], "references": edit.get("references", [])})
        output = []
        for part in parts:
            if part["type"] in {"marked", "math-marked"}:
                output.append(self.blank(part["text"], "source-marking", part.get("expression")))
            elif part["type"] == "math":
                output.append({"type": "math", "expression": part["expression"], "text": part["text"]})
            else:
                pattern = "|".join(re.escape(t) for t in sorted(set(targets), key=len, reverse=True))
                for piece in re.split(f"({pattern})", part["text"]) if pattern else [part["text"]]:
                    if piece:
                        output.append(self.blank(piece, "reviewed-addition") if piece in targets else {"type": "text", "text": piece})
        return output, original

    def paragraph(self, element, index):
        tokens, original = self.tokens(element, index)
        blocks = []
        if tokens:
            self.counter["paragraphs"] += 1
            rendered = "".join(t.get("text", t.get("answer", "")) for t in tokens)
            kind = "heading" if len(rendered) < 43 and re.match(r"^[一二三四五六七八九十]+[、.]|^\d+[、）)]", rendered) else "paragraph"
            blocks.append({"type": kind, "tokens": tokens, "source_block": index, "source_row": self.context_row, "source_text": original})
        seen = set()
        for rid in element.xpath(".//a:blip/@r:embed|.//v:imagedata/@r:id", namespaces=NS):
            target = self.rels[rid]
            number = int(re.search(r"image(\d+)", target).group(1))
            if number in self.config["skip_images"] or target in seen:
                continue
            seen.add(target)
            payload = self.archive.read("word/" + target)
            image = Image.open(BytesIO(payload))
            suffix = Path(target).suffix.lower()
            if suffix in {".jpeg", ".jpg", ".png", ".gif"}:
                filename = f"image-{number:03d}{suffix}"
                browser_bytes = payload
            else:
                stream = BytesIO()
                image.convert("RGBA").save(stream, format="PNG")
                filename, browser_bytes = f"image-{number:03d}.png", stream.getvalue()
            (self.assets / filename).write_bytes(browser_bytes)
            path = str((self.assets / filename).relative_to(ROOT))
            self.images[path] = sha256(browser_bytes).hexdigest()
            is_overview = index in self.config["overview_blocks"]
            blocks.append({"type": "figure", "source_block": index, "image": path,
                           "width": image.width, "height": image.height, "masks": [],
                           "caption": f"{self.section_title} · 原图{number}",
                           "disclosure": not is_overview,
                           "source_image_sha256": sha256(payload).hexdigest()})
        return blocks

    def table(self, element, index):
        self.counter["tables"] += 1
        rows, active = [], {}
        columns = len(element.findall("w:tblGrid/w:gridCol", NS))
        for row_number, row in enumerate(element.findall("w:tr", NS)):
            self.context_row = row_number
            cells, next_active = [], {}
            before = row.find("w:trPr/w:gridBefore", NS)
            column = int(before.get(W + "val")) if before is not None else 0
            if column:
                cells.append({"column": 0, "colspan": column, "rowspan": 1, "blocks": []})
            for cell in row.findall("w:tc", NS):
                span = cell.find("w:tcPr/w:gridSpan", NS)
                colspan = int(span.get(W + "val")) if span is not None else 1
                merge = cell.find("w:tcPr/w:vMerge", NS)
                if merge is not None and merge.get(W + "val") != "restart":
                    if column not in active:
                        raise ValueError(f"Orphan table merge at {index}/{row_number}/{column}")
                    record = active[column]
                    record["rowspan"] += 1
                    next_active[column] = record
                else:
                    blocks = []
                    for child in cell:
                        if child.tag == W + "p":
                            blocks.extend(self.paragraph(child, index))
                        elif child.tag == W + "tbl":
                            blocks.append(self.table(child, index))
                    record = {"column": column, "colspan": colspan, "rowspan": 1, "blocks": blocks}
                    cells.append(record)
                    if merge is not None:
                        next_active[column] = record
                column += colspan
            if column < columns:
                cells.append({"column": column, "colspan": columns - column, "rowspan": 1, "blocks": []})
            active = next_active
            rows.append(cells)
        self.context_row = None
        return {"type": "table", "source_block": index, "columns": columns, "rows": rows, "header_rows": 1,
                "note": self.config.get("table_notes", {}).get(str(index), "")}

    def build(self):
        overviews = []
        for index in self.config["overview_blocks"]:
            overviews.extend(self.paragraph(self.body[index], index))
        assert overviews and all(b["type"] == "figure" for b in overviews)
        sections = []
        for number, (start, end, group, title) in enumerate(self.config["ranges"], 1):
            self.section_title = title
            blocks = []
            for index in range(start + 1, end):
                element = self.body[index]
                if element.tag == W + "p":
                    blocks.extend(self.paragraph(element, index))
                elif element.tag == W + "tbl":
                    blocks.append(self.table(element, index))
            sections.append({"id": f"pocket{self.number}-{number:02d}", "group": group, "title": title,
                             "source_blocks": [start, end - 1], "blocks": blocks})
        missing = set(range(len(self.config.get("edits", [])))) - self.applied_edits
        if missing:
            raise ValueError(f"Unapplied editorial corrections: {missing}")
        return {"schema_version": "1.1.0", "id": f"pocket-{self.config['slug']}", "topic_id": f"pocket{self.number}",
                "title": self.config["title"], "status": "published",
                "source": {"file": str(self.source.relative_to(ROOT)), "sha256": sha256(self.source.read_bytes()).hexdigest(),
                           "included": ["思维导图", "知识清单", "易错易混", "知能拓展"], "excluded": ["考情速递", "训练营", "答案解析"]},
                "overview": overviews[0], "additional_overviews": overviews[1:], "sections": sections,
                "audit": {"reviewed_on": "2026-11-02", "blank_count": self.blank_count, "images_sha256": self.images,
                          "counters": dict(self.counter), "corrections": self.corrections, "references": self.config.get("references", []),
                          "note": "按原顺序提取，保留标记答案与原图。含标注的原图默认折叠，先回忆再展开核对；重点修订有原文记录，具体条件以题目材料为准。"}}


if __name__ == "__main__":
    number = sys.argv[1].zfill(2)
    configs = json.loads((ROOT / "scripts/pocket-book-profiles.json").read_text())
    config = configs[number]
    source = next((ROOT / "2025高中地理学习资料包 (知识点+教辅+试卷)/【口袋书】2024年高考地理一轮复习知识清单").glob(f"专题{number}*.docx"))
    with ZipFile(source) as archive:
        data = BookBuilder(archive, source, number, config).build()
    target = ROOT / f"data/pocket/{number}-{config['slug']}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"topic": data["title"], "sections": len(data["sections"]), "blanks": data["audit"]["blank_count"], "images": len(data["audit"]["images_sha256"]), **data["audit"]["counters"]}, ensure_ascii=False))
