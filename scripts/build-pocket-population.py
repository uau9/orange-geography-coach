"""Build the population pilot directly from DOCX OOXML, preserving block order.

The source is read-only. Generated JSON records source block/cell locations,
original answer markings, and every editorial correction separately.
"""
from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256
from copy import deepcopy
import json
import re
from lxml import etree as ET
from PIL import Image
from io import BytesIO

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "2025高中地理学习资料包 (知识点+教辅+试卷)/【口袋书】2024年高考地理一轮复习知识清单/专题11人口-【口袋书】2024年高考地理一轮复习知识清单.docx"
ASSETS = ROOT / "assets/recall/pocket-population"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
      "v": "urn:schemas-microsoft-com:vml"}
W = "{" + NS["w"] + "}"
REFERENCES = [
    {"id": "nbs-2025", "title": "国家统计局：2025年国民经济和社会发展统计公报", "url": "https://www.stats.gov.cn/sj/zxfb/202602/t20260228_1962662.html"},
    {"id": "nbs-sex", "title": "国家统计局：2025年全国1%人口抽样调查主要数据公报", "url": "https://www.stats.gov.cn/zwfwck/sjfb/202605/t20260522_1963788.html"},
    {"id": "nbs-resident", "title": "国家统计局：常住人口和流动人口如何区分", "url": "https://www.stats.gov.cn/zs/tjws/tjbz/202301/t20230101_1903796.html"},
    {"id": "nhc-birth-sex", "title": "国家卫生健康委：出生人口性别比及其正常范围", "url": "https://www.nhc.gov.cn/jtfzs/s3578/201502/ab0ea18da9c34d7789b5957464da51c3.shtml"},
]

# Replacements are explicit and retained in audit.corrections, never silent.
EDITS = {
    63: [("一个地区的最少的资源（影响生存的，如土地、淡水、能源等）的环境承载力就是该区的环境人口容量。", "在其他条件一定时，区域人口容量受最紧缺的限制性资源约束；这里的“最少”指相对于人口需求的短缺程度，不是不同资源实物数量的直接比较。", "明确资源短板的含义。", [])],
    65: [("一个地区的环境人口容量＞人口合理容量", "在相同区域和条件下，环境人口容量通常大于人口合理容量：前者强调承载上限，后者强调适宜规模与可持续生活。", "说明两个容量的比较前提。", [])],
    75: [("人口性别结构是指在一定时期内（通常为一年内），一个国家或地区的人口构成中，新出生的男性或女性各占总人口的比例。通常用“性别比”来衡量，即用100位女性对应的男性数来衡量，通常情况下男女比例为105∶100。", "人口性别结构是男性和女性在总人口中的构成。总人口性别比以女性为100，表示男性对女性的比例；出生人口性别比只针对一定时期的出生人口，通常正常范围为103—107。不能把出生人口性别比约105当作所有地区总人口性别比的固定标准。", "区分总人口与出生人口性别比。", ["nbs-sex", "nhc-birth-sex"])],
    80: [("1）人口迁移就是人的居住地在国际或本国范围内发生改变。", "1）人口迁移是人的居住地在国际或本国范围内发生长期或永久改变，通常伴随跨越一定行政区界线；旅游、短期出差和日常通勤不直接算人口迁移。", "补充时间与空间条件，避免将短期流动当作迁移。", [])],
    91: [("军人家属的从军", "军人家属随军", "修正文字错误。", [])],
    100: [("1、常住人口指经常居住在某一地区的人口，它包括常住该地而临时外出的人口，不包括临时寄住的人口。常住人口是国际上进行人口普查时常用的统计口径之一。目前世界上大多数国家都把居住半年以上作为判别常住人口的时间标准。", "1、我国人口统计中的常住人口按经常居住地统计，通常包括本地户口且居住本地或短期外出者、在本地经常居住并离开户口登记地半年及以上者，以及本地居住且户口待定者。具体以题目给定的地域、时点和统计口径为准。", "按国家统计局口径表述，避免将半年标准泛化到所有国家。", ["nbs-resident"])],
    102: [("3、常住人口＝户籍人口－户籍人口中外出半年以上的人口＋离开户籍地半年以上的外来人口＋户口待定人口。", "3、在地域、时点和分类口径一致且互不重复时，可简记：常住人口＝户籍人口－本地户籍外出半年及以上人口＋外地户籍迁入并离开户籍地半年及以上人口＋本地户口待定人口。特殊统计规定以题目材料为准。", "补充恒等式适用前提与半年及以上边界。", ["nbs-resident"])],
    104: [("我国人口问题比较特殊，既有发展中国家普遍存在的人口增长速度过快的问题，也有发达国家的人口老龄化问题，这是因为虽然我国的自然增长率较低，但是由于人口基数大，所以人口增长速度较快。除此之外，我国在人口上还存在着其他不合理问题。具体如下表所示：", "我国人口形势已发生变化，不能继续概括为“人口增长速度较快”。国家统计局公布的2025年人口自然增长率为−2.41‰。复习应关注低生育、人口老龄化、人口与资源环境的协调及人口空间分布差异；具体题目按材料年份分析。下表保留原资料列举的问题与对策，并对旧表述作了调整。", "更新已过时的人口增长判断，明确数据年份。", ["nbs-2025"])],
    105: [("调整计划生育政策，转变人口生育观念", "促进性别平等，转变重男轻女观念，依法治理非医学需要的胎儿性别鉴定和选择性别的人工终止妊娠", "人口素质较低", "人口素质提升需求", "纠正对策与性别比问题的对应关系，避免笼统评价。", [])],
    119: [("可直接读出该地区不同年龄段人口占总人口的比重(如图)。人口金字塔可以读取人口性别结构、人口年龄结构、人口增长模式。", "可从人口金字塔读取不同年龄组及男女构成，辨认年龄结构和性别结构。判断人口增长特征还应结合出生率、死亡率及迁移等信息，不能只凭形状直接确定增长模式。", "区分图上直接读取与需要推断的信息。", [])],
    123: [("年轻型和成年型人口金字塔图对应传统型（高低高模式或过渡模式）的人口增长模式，其中年轻型人口处于高增长阶段，成年型人口处于增长下降阶段；老年型人口金字塔图对应现代型（三低模式）的人口增长模式。", "年轻型通常底部较宽、少儿比重较大；成年型各年龄组相对均衡；老年型通常底部收窄、老年比重较大。它们反映年龄结构，人口增长趋势还受出生、死亡和迁移影响，不能把成年型直接等同于某一种人口增长模式。", "修正年龄结构类型与增长模式的一一对应。", [])],
    140: [("人口内在发展规律一再告诫我们，人口问题一旦出现，意味着解决人口问题的最佳时机已经过去。", "人口政策存在实施与见效的时间差，应结合年龄结构变化提前研判，不能把“问题一旦出现就已错过最佳时机”当作普遍规律。", "去除绝对化判断。", [])],
}
# Additional recall targets for unmarked prose; original markings take priority.
EXTRA_BLANKS = {
    45: ["出生率", "死亡率", "人口出生率-人口死亡率"],
    63: ["最紧缺的限制性资源"], 65: ["承载上限", "适宜规模"],
    75: ["女性为100", "103—107"], 80: ["长期或永久改变"],
    100: ["经常居住地", "半年及以上"], 101: ["户籍人口"],
    102: ["本地户籍外出半年及以上人口", "外地户籍迁入并离开户籍地半年及以上人口"],
    104: ["−2.41‰", "低生育", "人口老龄化"],
    112: ["经济因素"], 115: ["气候因素", "家庭因素"],
    119: ["年龄结构", "性别结构"], 123: ["底部较宽", "底部收窄"],
    127: ["原始型→传统型→现代型"], 130: ["出生率突然降低", "死亡率上升", "人口的大量外迁"],
    131: ["人口大量迁入"], 132: ["战争", "工厂建设"], 134: ["人口年龄结构"],
    140: ["实施与见效的时间差"], 141: ["鼓励生育"],
    142: ["教育投入", "人才红利", "人才和工作岗位的最优匹配"],
}
SECTION_RANGES = [
    (33, 61, "知识清单", "知识点一 人口分布和人口变化"),
    (61, 78, "知识清单", "知识点二 人口容量"),
    (78, 98, "知识清单", "知识点三 人口迁移"),
    (99, 103, "易错易混", "易错易混01 常住人口和户籍人口"),
    (103, 108, "易错易混", "易错易混02 我国的人口问题及对策"),
    (109, 116, "知能拓展", "考点01 影响人口迁移因素的分析方法"),
    (116, 133, "知能拓展", "考点02 人口模式图判读"),
    (133, 156, "知能拓展", "考点03 人口惯性与计生政策的变化"),
]
CAPTIONS = {4: "原文件第2页 · 人口专题思维导图", 7: "影响人口迁移的因素", 8: "城乡之间的推力与拉力", 11: "经济因素与人口迁移", 12: "人口金字塔的读图要素", 13: "三种人口年龄结构类型", 14: "人口金字塔的异常变化", 15: "人口惯性增长与惯性减少"}
TABLE_NOTES = {
    54: "这是原资料对不同发展阶段的概括，不是当下所有国家的统一特征。判断具体国家时，应读取材料年份、出生率和死亡率。",
    59: "本表用于比较原始型、传统型、现代型的指标组合；末行国家举例带有资料编写时期的背景，不能据国名直接判断当前增长模式。",
    72: "区分“年轻型/老年型”的结构状态与“年轻化/老龄化”的变化过程。单一年龄组比重变化不一定使其他年龄组比重同时反向变化。",
    88: "本表按原资料保留历史迁移背景与举例，不代表当前各省人口净流入、净流出的格局。具体判断须使用题目给定时段。",
}
# Image answer masks use original pixel coordinates; no original pixels changed.
MASKS = {
    8: [(560, 61, 230, 69, "城市的拉力"), (560, 165, 230, 69, "城市的推力"), (560, 269, 230, 69, "乡村的推力"), (560, 373, 230, 69, "乡村的拉力")],
    11: [(550, 425, 460, 95, "经济因素")],
    12: [(70, 20, 1260, 88, "左半部分代表男性，右半部分代表女性")],
    13: [(180, 187, 175, 72, "年轻型（增长型）"), (378, 187, 195, 72, "成年型（静止型）"), (583, 187, 196, 72, "老年型（缩减型）")],
    15: [(241, 128, 196, 66, "形成一个年龄结构较轻的人口群体"), (448, 126, 128, 75, "育龄人群比重大"), (446, 276, 124, 70, "人口结构老化")],
}

def text(el):
    return "".join(el.xpath(".//w:t/text()", namespaces=NS))


def marked(run):
    color = run.find("w:rPr/w:color", NS)
    underline = run.find("w:rPr/w:u", NS)
    return (color is not None and color.get(W + "val", "").upper() == "FF0000"
            and underline is not None and underline.get(W + "val") != "none")


class Builder:
    def __init__(self, archive):
        self.archive = archive
        root = ET.fromstring(archive.read("word/document.xml"))
        # Keep only the supported branch of AlternateContent (no doubled titles).
        for alternate in root.xpath(".//mc:AlternateContent", namespaces=NS):
            branch = alternate.find("mc:Choice", NS)
            if branch is None:
                branch = alternate.find("mc:Fallback", NS)
            parent = alternate.getparent()
            pos = parent.index(alternate)
            if branch is not None:
                for child in list(branch):
                    parent.insert(pos, deepcopy(child)); pos += 1
            parent.remove(alternate)
        self.body = list(root.find("w:body", NS))
        self.rels = {el.get("Id"): el.get("Target") for el in ET.fromstring(archive.read("word/_rels/document.xml.rels"))}
        self.corrections = []
        self.blank_count = 0
        self.images = {}

    def blank(self, value, origin):
        self.blank_count += 1
        return {"type": "blank", "id": f"population-blank-{self.blank_count:03d}", "answer": value, "origin": origin}

    def tokens(self, paragraph, index):
        parts = []
        for run in paragraph.findall("w:r", NS):
            value = text(run)
            if run.find("w:br", NS) is not None:
                value += "\n"
            if not value:
                continue
            kind = "marked" if marked(run) and value.strip() else "text"
            if parts and parts[-1]["type"] == kind:
                parts[-1]["text"] += value
            else:
                parts.append({"type": kind, "text": value})
        original = "".join(p["text"] for p in parts)
        for edit in EDITS.get(index, []):
            *pairs, reason, references = edit
            for old, new in zip(pairs[::2], pairs[1::2]):
                if old not in "".join(p["text"] for p in parts):
                    continue
                # Reconstruct tokens after an explicit editorial change.
                replacement = "".join(p["text"] for p in parts).replace(old, new)
                parts = [{"type": "text", "text": replacement}]
                self.corrections.append({"source_block": index, "original": old, "revised": new, "reason": reason, "references": references})
        output = []
        for part in parts:
            if part["type"] == "marked":
                output.append(self.blank(part["text"], "source-marking"))
            else:
                # Match longest explicit target first; no overlapping answers.
                targets = sorted(EXTRA_BLANKS.get(index, []), key=len, reverse=True)
                pattern = "|".join(re.escape(t) for t in targets)
                for piece in re.split(f"({pattern})", part["text"]) if pattern else [part["text"]]:
                    if piece:
                        output.append(self.blank(piece, "reviewed-addition") if piece in targets else {"type": "text", "text": piece})
        return output, original

    def paragraph(self, el, index):
        tokens, original = self.tokens(el, index)
        blocks = []
        if tokens:
            title = "".join(t.get("text", t.get("answer", "")) for t in tokens)
            kind = "heading" if len(title) < 43 and re.match(r"^[一二三四五六七八九十]+、|^\d+[、）]|^①正常|^②特殊|^影响人口|^人口迁移的影响|^推拉理论", title) else "paragraph"
            blocks.append({"type": kind, "tokens": tokens, "source_block": index, "source_text": original})
        for rid in el.xpath(".//a:blip/@r:embed|.//v:imagedata/@r:id", namespaces=NS):
            target = self.rels[rid]
            number = int(re.search(r"image(\d+)", target).group(1))
            if number not in CAPTIONS:
                continue
            payload = self.archive.read("word/" + target)
            image = Image.open(BytesIO(payload))
            path = f"assets/recall/pocket-population/image-{number:02d}.png"
            (ROOT / path).write_bytes(payload)
            self.images[path] = sha256(payload).hexdigest()
            width, height = image.size
            masks = [{"x": x / width, "y": y / height, "width": w / width, "height": h / height,
                      **self.blank(answer, "reviewed-image-mask")} for x, y, w, h, answer in MASKS.get(number, [])]
            blocks.append({"type": "figure", "image": path, "width": width, "height": height,
                           "caption": CAPTIONS[number],
                           "note": "图中的生育更替水平约2.1是概括性示例，具体水平受生育、死亡等条件影响。" if number == 15 else "",
                           "masks": masks, "source_block": index})
        return blocks

    def table(self, el, index):
        rows = []
        active = {}
        for row in el.findall("w:tr", NS):
            cells = []
            before = row.find("w:trPr/w:gridBefore", NS)
            column = int(before.get(W + "val")) if before is not None else 0
            next_active = {}
            for cell in row.findall("w:tc", NS):
                span = cell.find("w:tcPr/w:gridSpan", NS)
                colspan = int(span.get(W + "val")) if span is not None else 1
                merge = cell.find("w:tcPr/w:vMerge", NS)
                if merge is not None and merge.get(W + "val") != "restart":
                    if column not in active:
                        raise ValueError(f"Orphan vertical merge at {index}/{column}")
                    anchor = active[column]
                    anchor["rowspan"] += 1
                    next_active[column] = anchor
                else:
                    blocks = []
                    for child in cell:
                        if child.tag == W + "p":
                            blocks.extend(self.paragraph(child, index))
                    record = {"column": column, "colspan": colspan, "rowspan": 1, "blocks": blocks}
                    cells.append(record)
                    if merge is not None:
                        next_active[column] = record
                column += colspan
            active = next_active
            rows.append(cells)
        return {"type": "table", "rows": rows, "columns": len(el.findall("w:tblGrid/w:gridCol", NS)), "header_rows": 0 if index == 76 else 1, "source_block": index, "note": TABLE_NOTES.get(index, "")}

    def build(self):
        overview = self.paragraph(self.body[23], 23)
        assert len(overview) == 1 and overview[0]["type"] == "figure", "Source mind map changed"
        sections = []
        for number, (start, end, group, title) in enumerate(SECTION_RANGES, 1):
            blocks = []
            for index in range(start + 1, end):
                element = self.body[index]
                if element.tag == W + "p":
                    blocks.extend(self.paragraph(element, index))
                elif element.tag == W + "tbl":
                    blocks.append(self.table(element, index))
            sections.append({"id": f"pocket11-{number:02d}", "group": group, "title": title,
                             "source_blocks": [start, end - 1], "blocks": blocks})
        return {"schema_version": "1.0.0", "id": "pocket-population", "title": "专题11 人口", "status": "published",
                "source": {"file": str(SOURCE.relative_to(ROOT)), "sha256": sha256(SOURCE.read_bytes()).hexdigest(),
                           "edition": "2024年高考地理一轮复习知识清单", "included": ["思维导图", "知识清单", "易错易混", "知能拓展"], "excluded": ["高考考情速递", "好题训练营", "答案解析"]},
                "overview": overview[0],
                "sections": sections,
                "audit": {"reviewed_on": "2026-11-01", "references": REFERENCES, "corrections": self.corrections,
                          "blank_count": self.blank_count, "images_sha256": self.images,
                          "note": "人口样板已通过用户本地试用确认；历史分类按原顺序保留，现实人口判断须结合材料年份，查看答案不视为掌握。"}}


if __name__ == "__main__":
    ASSETS.mkdir(parents=True, exist_ok=True)
    with ZipFile(SOURCE) as archive:
        result = Builder(archive).build()
    target = ROOT / "data/pocket_population.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(result['sections'])} sections, {result['audit']['blank_count']} blanks, {len(result['audit']['images_sha256'])} images, {len(result['audit']['corrections'])} editorial corrections")
