#!/usr/bin/env python3
"""Build the interactive recall-card catalog from the supplied answer PDF.

Run with the bundled Codex Python runtime, which provides pdfplumber. The script
keeps every source page as an image and records the PDF underline coordinates so
the browser can place accessible answer toggles over the original blanks.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "2025高中地理学习资料包 (知识点+教辅+试卷)" / "高中地理《基础知识挖空复习讲义》26版" / "高中地理基础知识挖空复习（含答案）.pdf"
IMAGE_DIR = ROOT / "assets" / "recall" / "geography-basics-26"
OUTPUT = ROOT / "data" / "recall_cards.json"
PDFTOPPM = Path("/Users/jun/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm")


LESSONS = [
    (1, 3, "第一章 地球的运动", "第一节 地球自转和公转（第一课时）"),
    (4, 5, "第一章 地球的运动", "第一节 地球自转和公转（第二课时）"),
    (6, 7, "第一章 地球的运动", "第一节 地球自转的地理意义（第一课时）"),
    (8, 10, "第一章 地球的运动", "第一节 地球自转的地理意义（第二课时）"),
    (11, 12, "第一章 地球的运动", "第一节 地球自转的地理意义（第三课时）"),
    (13, 14, "第一章 地球的运动", "第一节 地球公转的地理意义（第四课时）"),
    (15, 17, "第一章 地球的运动", "第一节 地球公转的地理意义（第五课时）"),
    (18, 19, "第一章 地球的运动", "第一节 地球公转的地理意义（第六课时）"),
    (20, 24, "第二章 地表形态的塑造", "第一节 塑造地表形态的力量（第一课时）"),
    (25, 28, "第二章 地表形态的塑造", "第二节 构造地貌的形成（第一课时）"),
    (29, 31, "第二章 地表形态的塑造", "第三节 河流地貌的发育（第一课时）"),
    (32, 35, "第三章 大气的运动", "第一节 常见的天气系统（第一课时）"),
    (36, 38, "第三章 大气的运动", "第一节 常见的天气系统（第二课时）"),
    (39, 40, "第三章 大气的运动", "第二节 气压带和风带（第一课时）"),
    (41, 42, "第三章 大气的运动", "第二节 气压带和风带（第二课时）"),
    (43, 46, "第三章 大气的运动", "第三节 气压带和风带对气候的影响（第一课时）"),
    (47, 48, "第三章 大气的运动", "第三节 气压带和风带对气候的影响（第二课时）"),
    (49, 51, "第三章 大气的运动", "第三节 气压带和风带对气候的影响（第三课时）"),
    (52, 53, "第四章 水的运动", "第一节 陆地水体及相互关系（第一课时）"),
    (54, 56, "第四章 水的运动", "第一节 陆地水体及相互关系（第二课时）"),
    (57, 60, "第四章 水的运动", "第二节 世界表层洋流的分布规律（第一课时）"),
    (61, 64, "第四章 水的运动", "第二节 世界表层洋流的分布规律（第二课时）"),
    (65, 67, "第四章 水的运动", "第三节 海-气相互作用（第一课时）"),
    (68, 70, "第五章 自然环境的整体性与差异性", "第一节 自然环境的整体性（第一课时）"),
    (71, 74, "第五章 自然环境的整体性与差异性", "第二节 自然环境的差异性（第一课时）"),
]


SUPPLEMENTS = {
    2: {
        "label": "原文整课答案缺失，已按挖空顺序补全",
        "items": [
            "赤道平面：地轴；黄道平面：黄道；黄赤交角：赤道平面与黄道平面的夹角，目前约23°26′。",
            "三角度：黄赤交角23°26′；地轴与黄道面66°34′；地轴与赤道面90°。",
            "数量关系：黄赤交角度数=回归线纬度；回归线与极圈的纬度度数互余。",
            "黄赤交角变大：热带、寒带扩大，温带缩小；变小则相反。",
            "春分日3月21日前后-赤道；夏至日6月22日前后-北回归线；秋分日9月23日前后-赤道；冬至日12月22日前后-南回归线。",
            "太阳直射点在南、北回归线之间往返移动，出现太阳直射点的回归运动。",
            "南、北回归线上每年各1次直射；两回归线之间每年2次（赤道也为2次）。",
            "引起昼夜长短和正午太阳高度的时空变化，进而形成四季更替和五带划分。",
        ],
    },
    20: {
        "label": "原答案遗漏“地下水补给”三空",
        "items": [
            "补给季节：全年。",
            "主要影响因素：河流水位与地下水位的相对高低。",
            "补给特点：水量较稳定，与河流互补。",
        ],
    },
    21: {
        "label": "原答案遗漏洋流概念三空",
        "items": ["洋流概念三空依次为：常年、稳定、一定方向。"],
    },
    24: {
        "label": "原答案遗漏“自然环境整体功能的作用”",
        "items": [
            "保证了人类的生存和发展。",
            "开发利用自然资源、协调社会经济发展与环境保护时，应充分考虑不同区域自然环境生产功能和稳定功能的差异。",
        ],
    },
}


CORRECTIONS = {
    1: ["原答案“地球得公转”为文字错误，应为“地球的公转”；公转部分答案编号与题面错位，应依次对应“太阳—椭圆—自西向东—365日6时9分10秒—回归年—1月初—7月初”。"],
    12: ["原答案遗漏‘锋面、锋线’两空，已按题面补全。"],
    14: ["原答案“极低高气压带”为错别字，应为“极地高气压带”；四个气压带的形成原因补为热力、动力、动力、热力。"],
    16: [
        "原答案“有低变高”应为“由低变高”。",
        "温带大陆性气候的特征原答案不完整，补为“冬冷夏热，气温年较差大，降水较少且集中于夏季”。",
        "冰原气候表格的‘太阳辐射’一空应为‘弱’，原答案中‘受极地高气压带控制’不是该空的答案。",
    ],
    21: ["第57页示意图上方20℃、下方18℃，属于南半球；洋流由18℃流向20℃，是寒流。三个相关空格分别为南、凸、寒。"],
    18: [
        "原答案称东非高原“形成热带沙漠气候”错误，应为“形成热带草原气候”，与讲义第73页的非地带性表述一致。",
        "原答案“40°N-60°N的大路西岸”应为“大陆西岸”；“山地对东西走向”应为“山脉多呈东西走向”。",
    ],
    23: ["厄尔尼诺/拉尼娜对我国台风、冬季冷暖和南北降水的影响是统计倾向，不是每次事件都必然出现的固定结果；作答时应结合题给年份和环流证据。"],
}


def answer_list(value: str) -> list[str]:
    """Keep the reviewed per-blank answers readable in source control."""
    return [item.strip() for item in value.split("|") if item.strip()]


# Answers are deliberately reviewed and stored in the same reading order as the
# question-page blanks.  They are not parsed on the client: a click can reveal
# only the selected blank, including blanks inside tables and diagrams.
ANSWER_SEQUENCES = {
    1: answer_list("""
        自转轴|北极星|自西向东|逆|顺|当地的纬度|恒星|23小时56分4秒|真正的自转|太阳|24小时|相等|15°/1小时|递减|一半|快|0|
        太阳|椭圆|自西向东|365日6时9分10秒|回归年|1月初|7月初
    """),
    2: answer_list("""
        地轴|黄道|赤道|23°26′|23°26′|66°34′|90°|回归线的纬度|互余|扩大|缩小|扩大|缩小|扩大|缩小|
        3月21日前后|赤道|6月22日前后|北回归线|9月23日前后|赤道|12月22日前后|南回归线|南北回归线|太阳直射点的回归运动|1次|2次|昼夜长短|正午太阳高度|四季|五带
    """),
    3: answer_list("""
        透明|自转|昼|夜|白昼|黑夜|黑夜|白昼|昼半球|夜半球|6时|18时|大圆|昼夜平分|垂直|赤道|15°/h|自东向西|日出点|日落点|0°|>0°|<0°|重合|昼夜平分|相切|极昼极夜
    """),
    4: answer_list("""
        经度|东早西晚|相同|15|1|1|4|已知地方时±（经度差×4分钟），东加西减|12时|24时或0时|12时|6时|18时|
        24|15°|本初子午线|中时区|零时区|东西十二区|经度÷15°|区号|中央经线|>7.5|1|<7.5|整数|中央经线|1小时|该时区数×15°|东西各7.5°|已知区时±时区差×1小时（东加西减）|起飞时A地时间±时差+行程时间
    """),
    5: answer_list("""
        180°经线|向东减一天|今天|昨天|0时经线|向东加一天|昨天|今天|极点|180°|0时|自转|0时|180°|向右偏|向左偏|无偏转|明显|地转偏向力|右岸|淤积|右岸|左岸
    """),
    6: answer_list("""
        昼弧|夜弧|太阳直射点的位置|昼长夜短|越长|极昼|太阳直射点的移动方向|渐长|渐短|越高|越大|
        昼长夜短|越长|极昼|最长|最短|极昼|昼夜平分|昼短夜长|越短|极夜|最短|最长|极夜|
        昼长=昼弧经度÷15°/h；夜长=夜弧经度÷15°/h|（12-日出时间）×2|（日落时间-12）×2|（24-日落时间）×2|日出时间×2|24-昼长|日落时间-日出时间|昼长相等，夜长也相等|赤道上终年昼夜等长|90°-太阳直射点纬度|越多|对称|夜长
    """),
    7: answer_list("""
        地平面|最大|12时|0°|90°|赤道|北回归线|南回归线|最大（90°）|南北|递减|相等|相等|近|大|
        北回归线|南半球|南回归线|北半球|赤道|南北两极点|90°-纬度差（绝对值）|所求地点|太阳直射点|最短|12时|南方|坐北朝南|北方|坐南朝北|短|长|互余|当地纬度|太阳直射点|L=h×cot H
    """),
    8: answer_list("正午太阳高度|最长|最大|最短|最小"),
    9: answer_list("""
        内力作用|外力作用|热能|迅速剧烈|断裂带|褶皱山脉|地势起伏变化|海陆变迁|温度|水|西北|
        西北干旱半干旱地区|风蚀柱|雅丹|南方|喀斯特|V形|U形/槽形|千沟万壑|高纬|高山|冰斗|U形谷|高纬|芬兰|北美五大湖|过程|正|减弱|阻挡|沉积|缓|陡|沉积|分选性|冲积扇|冲积平原|河漫滩平原|三角洲|
        河流流出山口，地势趋于平缓，流速减慢，搬运物质在山前堆积，形成冲积扇|河流下蚀减弱、侧蚀增强，凹岸侵蚀、凸岸堆积，形成河漫滩；多个废弃河漫滩连成河漫滩平原|河流到达入海口，地势低平，流速减慢，加上海水顶托，泥沙堆积形成三角洲|海滩|趋于平缓|侵入|喷出|层理|化石|喷出型岩浆岩|沉积岩|变质作用|冷却凝固
    """),
    10: answer_list("""
        变形|褶皱|断层|地壳运动|波状|拱起|山|张力|侵蚀|谷地|老|新|弯曲|谷|挤压|侵蚀|山岭|新|老|隧道|采石场|地下水|压力|断裂面|错断|谷地|断块山|泉水|断层线|断层|亚欧|印度洋|南极洲|稳定|活跃|太平洋板块|赤道|公路|铁路|山麓|山间盆地|河谷|平行|耕地|林地|坡地|断层|滑坡|泥石流
    """),
    11: answer_list("""
        侵蚀|堆积|向源头侵蚀|使河床加深|使河床展宽|下蚀|溯源|延长|V|减弱|加强|凹岸|凸岸|槽|山前|减慢|扇状|中下游|凸岸|堆积|废弃|三角洲|入海口|减慢|前方|海洋|生活|运输|农副产品|较小|较大|冲积平原向山坡过渡地带|河漫滩平原、三角洲平原|低|温和|肥沃|丰富|平坦|平坦|肥沃|丰富
    """),
    12: answer_list("""
        物理|长时间|物理|短时间|均匀|密度小、质量轻、温度高、气压低|密度大、质量重、温度低、气压高|交界面|锋面|锋面|地面|锋面|锋线|冷气团|暖气团|冷气团|暖气团|暖气团|
        锋后|大|小|短|夏季的暴雨|冬春|华北地区|冬半年|寒潮|寒|暖气团|冷气团|锋前|小|大|长|暖|阴雨|6月份江淮地区的梅雨—江淮准静止锋|华南准静止锋、天山准静止锋|冬半年昆明准静止锋：贵阳多阴雨冷湿，昆明温暖晴朗
    """),
    13: answer_list("""
        低于|低压槽|高于|高压脊|四周|中心|中心|四周|上升|下沉|阴雨|晴朗|西北|东南沿海|伏旱|低温晴朗|冷锋|暖锋|暖|冷|准静止|早|晚|长|丰富|长|长|南旱北涝|南涝北旱
    """),
    14: answer_list("""
        有规律|三圈环流|季风环流|太阳辐射|水热分布|单圈环流|三圈环流|赤道低气压带|上升|热|副热带高气压带|下沉|动|副极地低气压带|上升|动|极地高气压带|下沉|热|东北信风带|东北风|盛行西风带|西南风|极地东风带|东北风|气压带和风带的季节移动|太阳直射点|北|南|五个纬度
    """),
    15: answer_list("""
        海陆热力性质|副极地低气压|高压|亚洲|冰岛|阿留申|副热带高气压|低压|亚洲|亚速尔|夏威夷|西北|东北|东南|西南|气压带、风带的季节移动
    """),
    16: answer_list("""
        上升|湿润|赤道低气压带|热带雨林|高压|下沉|稀少|由高变低|较多|由低变高|充沛|较多|稀少|较少|北大西洋暖流增温增湿|山脉多呈东西走向，平原利于暖湿气流深入内陆|陆地轮廓破碎，利于暖湿气流深入内陆|
        南北纬10°|赤道低气压带|上升|高温多雨|南北纬10°—20°|赤道低气压带|信风带|干湿两季分明|北纬10°—25°大陆东岸|海陆热力性质|季节移动|旱雨两季分明|南北纬20°—30°大陆内部和西岸|副热带高气压带|信风带|高温少雨|
        25°—35°|海陆热力性质|低温少雨|高温多雨|30°—40°|副热带高气压带和西风带交替控制|温和多雨|高温少雨|温带海洋性气候|40°—60°|西风带|温和湿润|35°—55°|海陆热力性质|高温多雨|寒冷干燥|40°—60°|大陆气团|夏热|
        北纬50°—70°|极地|漫长寒冷|短促温暖|北半球|高|弱|极地气团|严寒|南北半球|高|弱|酷寒|山地|高原|海拔高|大|小
    """),
    17: answer_list("北|南|热带|亚热带|温带海洋性|温带季风|温带大陆性|亚寒带针叶林|极地|热带雨林|温带海洋性|热带季风|热带草原|亚热带季风|温带季风|地中海|热带沙漠|温带大陆性|极地"),
    18: answer_list("""
        东非高原海拔高、气温较低，对流较弱、降水较少，形成热带草原气候|澳大利亚东北部、巴西高原东南沿海、马达加斯加岛东部|地处南半球低纬，全年高温|东南信风从海上吹来，水汽充足|沿岸暖流增温增湿|迎风坡地形抬升，形成丰沛地形雨|
        南北纬10°之间，赤道低气压带控制、对流旺盛|南北侧高原和西侧山地使亚马孙平原向东敞开，利于大西洋水汽深入，并在迎风坡形成地形雨|北纬40°—60°大陆西岸全年受西风带控制|北大西洋暖流增温增湿，使气候向北可达70°N|平原为主，山脉多呈东西走向，利于西风深入内陆|海岸线曲折，海水深入内陆|安第斯山脉沿海岸分布，地形约束|秘鲁寒流降温减湿|位于安第斯山脉盛行西风的背风坡，焚风效应明显|
        低|多|气温|三圈环流|季风环流|高|高寒|多雨|少雨|近|多|远|少|日较差|年较差|增温增湿|降温减湿
    """),
    19: answer_list("""
        冰川水|地下淡水|湖泊水|土壤水|沼泽水|大气水|河水|生物水|温度|湿度|空气|冰川|河流|淡水|工业生产|航运|发电|水产养殖|生态服务|
        补给类型|气候类型|流域面积|蒸发量|植被|地质条件|河流补给类型|雨季长短|高温期|植被|土质|地形（地势起伏）|降水多少|人类活动|低|结冰期|低纬度|高纬度|地势起伏|流量|河流径流量大|地势起伏大|流向|流程|河网密度|向心状|放射状|
    """),
    20: answer_list("""
        多雨|降水量的多少|降水量的季节变化|降水量的年际变化|集中|变化大|东部季风区|春季|气温|积雪|连续|和缓|东北|夏季|太阳辐射|气温变化|夏季|稳定|西北|青藏|全年|调节|稳定|全年|较稳定|
        削减|调节|湖泊水|湖泊
    """),
    21: answer_list("""
        常年|稳定|一定方向|低|高|高|低|高|低|低|高|等温线|南|凸|寒|盛行风|密度|减少|水平|垂直|东西|分两边|南北|赤道逆流|偏转|性质|暖|寒|顺|逆|寒|暖|逆|西风|南极|顺|逆|寒|暖|逆|暖|寒|西风漂流|东|西|逆|西|东|顺
    """),
    22: answer_list("热量|水分|平衡|增温增湿|降温减湿|生物资源|渔场|交汇|扰动|饵料|游动|集中|离岸风|表层|上泛|表层|繁殖|北大西洋|日本|千岛|墨西哥湾|拉布拉多|秘鲁|顺流|海雾|海冰|扩散|污染范围"),
    23: answer_list("动能|水分|热量|低|高|异常升高|异常降低|减弱|增强|变弱|变强|下降|升高|上升|降低|旱灾或森林大火|洪涝|减产|增产|台风（统计倾向）|暖冬（统计倾向）|南涝北旱（统计倾向）|冷冬（统计倾向）|南旱北涝（统计倾向）|台风（统计倾向）"),
    24: answer_list("""
        岩石|地貌|生物循环|呼吸|光合|分解|内部热能|太阳能|更新|动态平衡|塑造地表形态|矿产资源|物质|相互制约|整体|合成有机物|光合作用|叶绿素|热量|二氧化碳|水分|营养盐|调节|稳定|光合作用|海—气相互作用|生存|发展|人地关系|差异|变化性|统一性|统一|连锁变化|快速|地理环境
    """),
    25: answer_list("""
        热量|水分|东西|南北|南北|东西|低纬|高纬|中纬度|雨林|荒漠|常绿阔叶林|常绿硬叶林|海拔|水热组合|从赤道到两极|低|复杂|高|复杂|大|复杂|阳|阴|下界（最低海拔）|正|高|低|高|低|低|高|低|高|高|低|上升|下降
    """),
}

# Image-embedded blanks and answer cells without vector underlines. Coordinates
# are PDF points, reviewed against the rendered original page; answers are local
# to each region and therefore cannot shift the following underline answers.
MANUAL_BLANKS = {
    2: [(207, y, 289, 16, answer, "table") for y, answer in zip(
        (307, 338, 368, 399, 430),
        ("晴天多，阴雨天少，利于发射和跟踪", "纬度低，自转线速度大，可节省燃料和成本", "地形平坦开阔", "交通便利，利于大宗物资运输", "大陆内部气象条件好，隐蔽性强，人烟稀少，安全性强"))],
    5: [(273, 277, 40, 11, "6月22日", "diagram"),
        (325, 308, 39, 11, "9月23日", "diagram"),
        (217, 332, 39, 11, "3月21日", "diagram"),
        (339, 367, 46, 11, "12月22日", "diagram")],
    33: [(216, 363, 17, 10, "降低", "diagram"), (216, 375, 17, 10, "升高", "diagram"),
         (297, 363, 18, 10, "大风、降温", "diagram")],
    34: [(200, 195, 19, 10, "升高", "diagram"), (200, 210, 19, 10, "降低", "diagram"),
         (292, 494, 35, 10, "连续性降水", "diagram")],
    41: [(309, 349, 17, 10, "低压", "diagram"), (309, 364, 17, 10, "高压", "diagram"),
         (309, 386, 17, 10, "高压", "diagram"), (309, 400, 17, 10, "低压", "diagram")],
    42: [(363, 454, 47, 11, "带", "line")],
    50: [(130, 423, 368, 27, "夏季以东南季风为主，湿润气流来自太平洋；太平洋沿岸为迎风坡，降水较多", "table"),
         (130, 472, 368, 27, "冬季西北季风经过日本海获得水汽，日本海沿岸为迎风坡，多降雪；太平洋沿岸处于背风坡，较少雨雪", "table")],
    53: [(165, 211, 332, 27, "地形平坦、水流平稳；流量大、季节变化小；结冰期短或无结冰期；通航里程长", "table"),
         (165, 258, 332, 27, "流域内经济发达、人口众多、运输需求大", "table")],
    55: [(185, 265, 200, 11, "湖泊水位与河流水位的相对高低", "line"),
         (185, 497, 200, 11, "河流水位与地下水位的相对高低", "line")],
    56: [(218, 160, 20, 11, "河水", "diagram"), (258, 160, 28, 11, "湖水", "diagram"),
         (343, 160, 20, 11, "湖水", "diagram"), (383, 160, 28, 11, "河水", "diagram"),
         (203, 264, 24, 11, "河湖水", "diagram"), (251, 264, 33, 11, "地下水", "diagram"),
         (353, 264, 24, 11, "地下水", "diagram"), (401, 264, 33, 11, "河湖水", "diagram")],
    61: [(506, 670.2, 53, 11, "浮游生物", "line")],
    65: [(244, 325, 52, 11, "蒸发", "diagram"), (345, 485, 52, 11, "凝结", "diagram")],
    69: [(489, 209.8, 8, 11, "重力能", "table")],
}


def render_pages(page_count: int, renderer: Path) -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(IMAGE_DIR.glob("page-*.jpg"))
    if len(existing) == page_count:
        return
    for old in existing:
        old.unlink()
    temp_prefix = IMAGE_DIR / "source"
    subprocess.run(
        [
            str(renderer), "-jpeg", "-r", "150", "-jpegopt", "quality=88",
            str(SOURCE), str(temp_prefix),
        ],
        check=True,
    )
    rendered = sorted(IMAGE_DIR.glob("source-*.jpg"))
    if len(rendered) != page_count:
        raise RuntimeError(f"Expected {page_count} rendered pages, found {len(rendered)}")
    for number, path in enumerate(rendered, start=1):
        path.rename(IMAGE_DIR / f"page-{number:03d}.jpg")


def blank_rectangles(page: pdfplumber.page.Page, crop_bottom: float) -> list[dict]:
    tables = page.find_tables()
    cells = [cell for table in tables for cell in table.cells if cell]
    blanks = []
    for rect in page.rects:
        width = rect["x1"] - rect["x0"]
        height = rect["bottom"] - rect["top"]
        baseline = (rect["top"] + rect["bottom"]) / 2
        if not (0.4 <= height <= 1.25 and 10 <= width <= 420 and rect["top"] < crop_bottom):
            continue
        # Double table rules can be two points apart. They are not answer slots.
        if any(abs(baseline - edge) <= 2 and abs(rect["x0"] - c[0]) < 3 and abs(rect["x1"] - c[2]) < 3 for c in cells for edge in (c[1], c[3])):
            continue
        # Underlined headings are content, not blanks (e.g. p63 舟山渔场).
        if any(c["text"].strip() and rect["x0"] + .5 < (c["x0"] + c["x1"]) / 2 < rect["x1"] - .5 and abs(c["top"] - (rect["top"] - 10.5)) < 3 for c in page.chars):
            continue
        cell = next((c for c in cells if c[0] - 1 <= rect["x0"] and rect["x1"] <= c[2] + 1 and c[1] <= baseline <= c[3]), None)
        blanks.append({"x0": rect["x0"], "top": rect["top"] - 10.5,
                       "x1": rect["x1"], "bottom": rect["top"] + .8,
                       "cell": cell, "kind": "table" if cell else "line"})
    blanks.sort(key=lambda item: (round(item["top"], 1), item["x0"]))
    merged = []
    for blank in blanks:
        previous = merged[-1] if merged else None
        if previous and previous["cell"] == blank["cell"] and abs(previous["top"] - blank["top"]) < 1 and 0 <= blank["x0"] - previous["x1"] <= 12:
            gap_text = [c for c in page.chars if c["text"].strip() and previous["x1"] < (c["x0"] + c["x1"]) / 2 < blank["x0"] and abs(c["top"] - blank["top"]) < 3]
            if not gap_text:
                previous["x1"] = blank["x1"]
                continue
        merged.append(blank)
    # Finish one table cell before reading the next cell in the same row.
    merged.sort(key=lambda b: (b["cell"][1] if b["cell"] else b["top"], b["cell"][0] if b["cell"] else b["x0"], b["top"], b["x0"]))
    for blank in merged:
        blank["x"] = round(blank.pop("x0") / page.width, 6)
        blank["y"] = round(blank.pop("top") / page.height, 6)
        blank["width"] = round(blank.pop("x1") / page.width - blank["x"], 6)
        blank["height"] = round(blank.pop("bottom") / page.height - blank["y"], 6)
        blank.pop("cell")
    return merged


def answer_start(page: pdfplumber.page.Page) -> float | None:
    hits = page.search("【答案】")
    return hits[0]["top"] if hits else None


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    renderer = PDFTOPPM
    if not renderer.exists():
        resolved = shutil.which("pdftoppm")
        if not resolved:
            raise FileNotFoundError("pdftoppm is required")
        renderer = Path(resolved)

    with pdfplumber.open(SOURCE) as document:
        render_pages(len(document.pages), renderer)
        lessons = []
        for lesson_number, (start, end, chapter, title) in enumerate(LESSONS, start=1):
            source_answer_page = None
            source_answer_top = None
            for page_number in range(start, end + 1):
                top = answer_start(document.pages[page_number - 1])
                if top is not None:
                    source_answer_page = page_number
                    source_answer_top = top
                    break

            question_pages = []
            answer_segments = []
            for page_number in range(start, end + 1):
                page = document.pages[page_number - 1]
                image = f"./assets/recall/geography-basics-26/page-{page_number:03d}.jpg"
                if source_answer_page is None or page_number < source_answer_page:
                    bottom = page.height
                elif page_number == source_answer_page:
                    bottom = source_answer_top
                else:
                    bottom = 0
                if bottom and bottom / page.height >= 0.1:
                    question_pages.append(
                        {
                            "page_number": page_number,
                            "image": image,
                            "width": round(page.width, 3),
                            "height": round(page.height, 3),
                            "crop_bottom": round(bottom / page.height, 6),
                            "blanks": blank_rectangles(page, bottom),
                        }
                    )
                if source_answer_page is not None and page_number >= source_answer_page:
                    crop_top = source_answer_top / page.height if page_number == source_answer_page else 0
                    answer_segments.append(
                        {
                            "page_number": page_number,
                            "image": image,
                            "crop_top": round(crop_top, 6),
                            "crop_bottom": 1,
                        }
                    )

            lesson = {
                "id": f"recall-{lesson_number:02d}",
                "order": lesson_number,
                "chapter": chapter,
                "title": title,
                "source_pages": {"start": start, "end": end},
                "question_pages": question_pages,
                "answer_segments": answer_segments,
                "supplement": SUPPLEMENTS.get(lesson_number),
                "corrections": CORRECTIONS.get(lesson_number, []),
            }
            automatic = [blank for page in question_pages for blank in page["blanks"]]
            answers = ANSWER_SEQUENCES[lesson_number]
            if len(automatic) != len(answers):
                raise ValueError(f"Lesson {lesson_number}: {len(automatic)} blanks but {len(answers)} reviewed answers")
            for blank, answer in zip(automatic, answers):
                blank["answer"] = answer
            number = 0
            for page in question_pages:
                for x, y, width, height, answer, kind in MANUAL_BLANKS.get(page["page_number"], []):
                    page["blanks"].append({"x": round(x / page["width"], 6), "y": round(y / page["height"], 6),
                        "width": round(width / page["width"], 6), "height": round(height / page["height"], 6),
                        "answer": answer, "kind": kind})
                # Numbering is page reading order; answers were bound before this
                # sort so multi-line table cells remain correctly associated.
                page["blanks"].sort(key=lambda b: (round(b["y"], 3), b["x"]))
                for blank in page["blanks"]:
                    number += 1
                    blank["number"] = number
                    blank["id"] = f"{lesson['id']}-p{page['page_number']:03d}-b{number:03d}"
            lessons.append(lesson)

    chapters = []
    for lesson in lessons:
        chapter = next((item for item in chapters if item["title"] == lesson["chapter"]), None)
        if chapter is None:
            chapter = {"id": f"recall-chapter-{len(chapters) + 1}", "order": len(chapters) + 1, "title": lesson["chapter"], "lesson_ids": []}
            chapters.append(chapter)
        chapter["lesson_ids"].append(lesson["id"])

    payload = {
        "schema_version": "1.1.0",
        "title": "高中地理基础知识挖空背诵卡",
        "source": {
            "title": "高中地理基础知识挖空复习（含答案）",
            "edition": "26版",
            "page_count": 74,
            "arrangement": "按原PDF目录与页码顺序",
        },
        "interaction": {
            "answers_hidden_by_default": True,
            "click_blank_to_toggle": True,
            "answer_scope": "single_blank",
            "source_pages_preserved_as_images": True,
            "mastery_rule": "查看答案不等于掌握；只有家长听完口头复述后才标记为已复述。",
        },
        "audit": {
            "method": "逐课时对照题面、表格单元格与原答案，为每个空格绑定独立答案；补全图内挖空和遗漏答案，参考USGS、NOAA与国家气候中心核查重点概念。",
            "status": "local_content_reviewed",
            "lesson_count": len(lessons),
            "supplemented_lesson_count": len(SUPPLEMENTS),
            "corrected_lesson_count": len(CORRECTIONS),
            "references": [
                {"title": "USGS: 河流与地下水交换", "url": "https://www.usgs.gov/water-science-school/science/rivers-contain-groundwater", "supports": "河水与地下水的相对水位控制补给方向"},
                {"title": "NOAA: 洋流及形成", "url": "https://oceanservice.noaa.gov/facts/current.html", "supports": "洋流运动及风、地转偏向和地形的影响"},
                {"title": "国家气候中心: ENSO对我国气候的影响", "url": "https://www.ncc-cma.net/channel/news/newsid/4685", "supports": "ENSO对我国的影响有统计倾向与不确定性，不能当作每次必然结果"},
            ],
        },
        "chapters": chapters,
        "lessons": lessons,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(lessons)} lessons")


if __name__ == "__main__":
    main()
