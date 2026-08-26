import fs from "node:fs";

const outputPath = new URL("../data/questions.json", import.meta.url);
const sourceFidelityPath = new URL("../data/question_source_fidelity.json", import.meta.url);
const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
const sourceFidelity = JSON.parse(fs.readFileSync(sourceFidelityPath, "utf8"));
const existingRegion = new Map(existing.filter((item) => item.id.startsWith("GEO-REGDEV-")).map((item) => [item.id, item]));

const letters = ["A", "B", "C", "D"];
const q = ({ id, topic, knowledge, title, source, material = "text", image, alt, stem, options, answer, explanation, keyPoints, difficulty = 2 }) => {
  const normalizedOptions = options.map((text, index) => ({ id: letters[index], text }));
  return {
    id,
    topic_id: topic,
    knowledge_point_id: knowledge,
    title,
    source,
    source_material_kind: material,
    ...(image ? { source_image: image, source_image_alt: alt } : {}),
    type: "single_choice",
    difficulty,
    stem,
    options: normalizedOptions,
    answer,
    error_map: Object.fromEntries(normalizedOptions.filter((option) => option.id !== answer).map((option) => [option.id, {
      tag: `材料证据核对-${option.id}`,
      diagnosis: `这是依据题源答案形成的候选错因：选择${option.id}说明材料、图表信息或地理规律中至少有一项尚未核对完整。`,
      follow_up: `回到题干和配图，逐项说明${option.id}与正确答案${answer}的证据差异。`
    }])),
    explanation,
    key_points: keyPoints,
    review_after_days: [2, 5, 12]
  };
};

const packQuestions = [
  q({
    id: "GEO-EARTH-001", topic: "physical.earth.motion", knowledge: "earth.rotation-revolution-features", title: "地球自转方向图判读",
    source: "资料包·步步高课时6课时精练第1题", material: "image", image: "./assets/questions/earth-motion/rotation-direction-options.png", alt: "A至D四幅地球自转方向示意图",
    stem: "地球的自转和公转是地球最基本的有规律的运动形式。下面四幅示意图中，能正确表示地球自转方向的是（见完整选项图）：",
    options: ["图A", "图B", "图C", "图D"], answer: "C",
    explanation: "地球自西向东自转；从北极上空看呈逆时针，从南极上空看呈顺时针。图C中90°W向东运动到0°，方向正确。",
    keyPoints: ["地球自转方向", "极点俯视图", "经度方向"]
  }),
  q({
    id: "GEO-EARTH-002", topic: "physical.earth.motion", knowledge: "earth.rotation-revolution-features", title: "自转公转与地表温度",
    source: "资料包·步步高课时6课时精练第2题",
    stem: "地球的自转和公转特点影响着地球上许多地理现象。下列地理现象受地球自转和公转直接影响的是：",
    options: ["地球表面大气层厚度适中", "地球表面有适宜的温度", "地球上存在昼夜现象", "北极夜晚出现极光现象"], answer: "B",
    explanation: "地球自转周期和公转周期适中，使地表获得的热量有节律变化并保持适宜温度；其余现象分别主要与质量体积、球体不透明和太阳活动有关。",
    keyPoints: ["自转公转周期", "地球宜居条件", "因果归属"]
  }),
  q({
    id: "GEO-EARTH-003", topic: "physical.earth.motion", knowledge: "earth.rotation-revolution-features", title: "恒星日与恒星年",
    source: "资料包·步步高课时6课时精练第3题",
    stem: "下列关于地球自转和公转的说法，正确的是：",
    options: ["地球自转的真正周期为1恒星日", "地球自转的真正周期为24小时", "地球公转的方向是自东向西", "地球公转的周期为365日"], answer: "A",
    explanation: "以遥远恒星为参照，地球自转真正周期为1恒星日，即23时56分4秒；地球公转方向也是自西向东，真正周期为1恒星年。",
    keyPoints: ["恒星日", "恒星年", "运动方向"]
  }),
  q({
    id: "GEO-EARTH-004", topic: "physical.earth.motion", knowledge: "earth.sidereal-day", title: "北极星轨迹反映的运动",
    source: "资料包·步步高课时6课时精练第4题", material: "image", image: "./assets/questions/earth-motion/north-star-trails.png", alt: "北极星附近星辰长时间曝光形成的同心圆轨迹",
    stem: "某中学地理研究性学习小组野外宿营时，把照相机固定并对准北极星附近星空长时间曝光，得到图示星辰运动轨迹。该图像最能反映：",
    options: ["地球自转", "太阳系组成", "流星运动", "恒星运动"], answer: "A",
    explanation: "地轴指向北极星附近，照相机随地球自转，长曝光中其他星辰相对北极星形成圆弧轨迹，最直接反映地球自转。",
    keyPoints: ["北极星", "地球自转证据", "参照物"]
  }),
  q({
    id: "GEO-EARTH-005", topic: "physical.earth.motion", knowledge: "earth.sidereal-day", title: "恒星日的每日提前量",
    source: "资料包·步步高课时6课时精练第5题", material: "image", image: "./assets/questions/earth-motion/north-star-trails.png", alt: "北极星附近星辰长时间曝光形成的同心圆轨迹",
    stem: "某一遥远恒星A在当日23:00位于图示位置。第二天该恒星处于星空同样位置时，最接近的时间是：",
    options: ["23:00", "22:56", "23:04", "21:52"], answer: "B",
    explanation: "以恒星为参照，地球自转一周为23时56分4秒，因此第二天恒星回到同一位置约比前一天提前4分钟，即22:56。",
    keyPoints: ["恒星日", "太阳日", "每日提前4分钟"]
  }),
  q({
    id: "GEO-EARTH-006", topic: "physical.earth.motion", knowledge: "earth.rotation-geographic-effects", title: "光照图中的晨昏判断",
    source: "资料包·步步高课时8课时精练第1题", material: "image", image: "./assets/questions/earth-motion/solar-illumination.png", alt: "某日太阳光照图，阴影表示夜半球",
    stem: "读某日太阳光照图（阴影部分表示夜半球）。下列关于图中信息的说法，正确的是：",
    options: ["B点日出为0时或24时", "C点日落是22时", "D和E两点的自转角速度和线速度都相同", "下一刻D点将进入白昼"], answer: "D",
    explanation: "地球自西向东自转，沿自转方向判断D点下一刻跨过晨线进入白昼；赤道日落为18时，同纬度角速度相同但线速度随纬度变化。",
    keyPoints: ["晨昏线", "自转方向", "角速度与线速度"]
  }),
  q({
    id: "GEO-EARTH-007", topic: "physical.earth.motion", knowledge: "earth.rotation-geographic-effects", title: "光照图中的0时经线",
    source: "资料包·步步高课时8课时精练第2题", material: "image", image: "./assets/questions/earth-motion/solar-illumination.png", alt: "某日太阳光照图，阴影表示夜半球",
    stem: "读某日太阳光照图（阴影部分表示夜半球）。此时地方时为0:00的经线是：",
    options: ["120°E", "60°E", "20°W", "100°W"], answer: "B",
    explanation: "平分夜半球的经线地方时为0时。结合图中经度分布，A点所在并平分夜半球的经线为60°E。",
    keyPoints: ["0时经线", "夜半球中央经线", "经度判读"]
  }),
  q({
    id: "GEO-EARTH-008", topic: "physical.earth.motion", knowledge: "earth.rotation-geographic-effects", title: "地转偏向与矶头护岸",
    source: "资料包·步步高课时8课时精练第5题", material: "image", image: "./assets/questions/earth-motion/yangtze-rock-head.png", alt: "长江中下游矶头和鹅头状分汊河段示意图",
    stem: "矶头是矗立江边、突出江中的基岩山体。河道形态受矶头分布影响，只有一岸出现矶头时常形成图示鹅头状分汊河段。图中矶头的主要作用是：",
    options: ["保护右岸河堤", "使河床变窄", "加剧左岸堆积", "使河道变顺直"], answer: "A",
    explanation: "北半球河水受地转偏向力作用向右偏，右岸侵蚀较强；坚硬基岩矶头不易受侵蚀，可保护右岸河堤。",
    keyPoints: ["地转偏向力", "河岸侵蚀", "矶头"]
  }),

  q({
    id: "GEO-TIME-001", topic: "physical.earth.time", knowledge: "earth.time-date-boundaries", title: "全球日期图的地方时",
    source: "资料包·步步高课时9课时精练第1题", material: "image", image: "./assets/questions/time/global-date-grid.png", alt: "全球经纬线展开、晨昏线和两个日期分区示意图",
    stem: "图中虚线AS代表晨昏线，D点为晨昏线与赤道交点，也是GF中点；阴影与非阴影代表6日和7日。此时甲地地方时为：",
    options: ["7日21时", "6日9时", "6日21时", "7日9时"], answer: "C",
    explanation: "D点为18时；由日期分区可判左侧界线为180°经线、BC为0时经线，甲位于0时经线以西的旧日期，地方时为6日21时。",
    keyPoints: ["晨昏线交赤道", "0时经线", "日期分区"]
  }),
  q({
    id: "GEO-TIME-002", topic: "physical.earth.time", knowledge: "earth.time-date-boundaries", title: "晨昏线与东西半球昼长",
    source: "资料包·步步高课时9课时精练第2题", material: "image", image: "./assets/questions/time/global-date-grid.png", alt: "全球经纬线展开、晨昏线和两个日期分区示意图",
    stem: "结合图示晨昏线、0时经线和日期分区，下列说法正确的是：",
    options: ["AS线为晨线", "BC线为国际日界线", "赤道上西半球的白昼长于黑夜", "赤道上东、西半球的白昼长度之比为23∶13"], answer: "D",
    explanation: "D点为18时，AS为昏线；BC是0时经线。按20°W和160°E划分东西半球，赤道上东、西半球白昼范围分别为115°和65°，比值23∶13。",
    keyPoints: ["晨线昏线", "东西半球", "白昼范围"]
  }),
  q({
    id: "GEO-TIME-003", topic: "physical.earth.time", knowledge: "earth.time-zone-conversion", title: "北京时间换算纽约时间",
    source: "资料包·步步高课时9课时精练第3题",
    stem: "北京时间2021年5月21日21时48分，云南大理州漾濞县发生地震。该地震发生时，纽约（西五区）时间为：",
    options: ["22日0时48分", "22日10时48分", "21日18时48分", "21日8时48分"], answer: "D",
    explanation: "北京时间为东八区，纽约为西五区，两地相差13小时；纽约在西，21时48分减13小时为21日8时48分。",
    keyPoints: ["区时换算", "东加西减", "日期进退"]
  }),
  q({
    id: "GEO-TIME-004", topic: "physical.earth.time", knowledge: "earth.time-zone-conversion", title: "日期判断太阳直射纬度",
    source: "资料包·步步高课时9课时精练第4题",
    stem: "北京时间2021年5月21日21时48分，云南大理州漾濞县发生地震。该地震发生时，太阳直射点大致在：",
    options: ["0°～23°26′N之间", "0°～23°26′S之间", "23°26′N～66°34′N之间", "23°26′S～66°34′S之间"], answer: "A",
    explanation: "5月21日位于春分日至夏至日之间，太阳直射点在赤道与北回归线之间并向北移动。",
    keyPoints: ["太阳直射点回归运动", "春分至夏至", "日期判读"]
  }),
  q({
    id: "GEO-TIME-005", topic: "physical.earth.time", knowledge: "earth.time-flight", title: "跨区航班的起飞时刻换算",
    source: "资料包·步步高课时9课时精练第7题",
    stem: "2021年9月24日16:27（当地时间），包机从加拿大温哥华（西八区）起飞。我国政府包机从加拿大起飞时，北京时间是：",
    options: ["9月25日8:27", "9月24日8:27", "9月25日0:27", "9月24日0:27"], answer: "A",
    explanation: "温哥华西八区比北京东八区晚16小时，9月24日16:27加16小时为9月25日8:27。",
    keyPoints: ["国际航班", "东西十六时区", "日期进位"]
  }),
  q({
    id: "GEO-TIME-006", topic: "physical.earth.time", knowledge: "earth.time-flight", title: "统一时区计算飞行时间",
    source: "资料包·步步高课时9课时精练第8题",
    stem: "包机于温哥华当地时间2021年9月24日16:27起飞，于北京时间9月25日21:51在深圳降落。飞行时间约是：",
    options: ["13小时", "13.5小时", "14小时", "14.5小时"], answer: "B",
    explanation: "先将起飞时刻换算为北京时间9月25日8:27，再与到达时刻21:51相减，得13小时24分，约13.5小时。",
    keyPoints: ["飞行时间", "统一时间标准", "时长计算"]
  }),
  q({
    id: "GEO-TIME-007", topic: "physical.earth.time", knowledge: "earth.time-jetlag", title: "飞行方向与倒时差",
    source: "资料包·步步高课时9课时精练第10题",
    stem: "研究发现，跨越时区数为N时，往西飞一般需N/2天倒时差，往东飞需N×2/3天。某人从北京出发，前往下列目的地需要倒时差时间最长的是：",
    options: ["莫斯科（38°E）", "新德里（77°E）", "悉尼（151°E）", "檀香山（157°W）"], answer: "D",
    explanation: "按最短跨区方向计算，北京到檀香山跨6个时区且向东飞，需约4天，长于其他目的地。",
    keyPoints: ["时区数", "飞行方向", "倒时差"]
  }),
  q({
    id: "GEO-TIME-008", topic: "physical.earth.time", knowledge: "earth.time-jetlag", title: "抵达当地时刻与航班选择",
    source: "资料包·步步高课时9课时精练第11题",
    stem: "长途飞行选择下午或晚上到达目的地更容易倒时差。北京飞往洛杉矶（118°W）约13小时，最适合选择的北京时间出发时刻是：",
    options: ["7:00", "11:00", "16:00", "21:00"], answer: "D",
    explanation: "北京21:00起飞，飞行13小时并换算到洛杉矶当地时间后约为18:00，符合下午或晚上到达的条件。",
    keyPoints: ["跨时区航班", "当地到达时刻", "时差应用"]
  }),

  q({
    id: "GEO-WEA-001", topic: "physical.atmosphere", knowledge: "atmosphere.front-evolution", title: "主锋与副锋类型",
    source: "资料包·步步高课时14课时精练第1题", material: "image", image: "./assets/questions/atmosphere/main-secondary-front.png", alt: "我国局部地区主锋和副锋分布图",
    stem: "锋后气团性质改变后，被更后面的气团追上会形成副锋，原锋面称主锋。读我国某日局部地区主锋和副锋图，二者锋面类型分别是：",
    options: ["冷锋、冷锋", "暖锋、暖锋", "冷锋、暖锋", "暖锋、冷锋"], answer: "A",
    explanation: "图中两次均为西北侧冷空气向东南推进并追上前方气团，主锋和副锋均属于冷锋。",
    keyPoints: ["冷锋", "气团移动", "副锋"]
  }),
  q({
    id: "GEO-WEA-002", topic: "physical.atmosphere", knowledge: "atmosphere.front-evolution", title: "冷气团南下后的变性",
    source: "资料包·步步高课时14课时精练第2题", material: "image", image: "./assets/questions/atmosphere/main-secondary-front.png", alt: "我国局部地区主锋和副锋分布图",
    stem: "读我国某日局部地区主锋和副锋图。导致主锋锋后气团性质改变的主要原因是：",
    options: ["阴雨削弱太阳辐射，气温下降", "阴雨天气大气逆辐射强，气温下降", "途经高原山地高海拔区，气温下降", "途经地面辐射更强地区，气温升高"], answer: "D",
    explanation: "早期冷气团向南移动，经过地面辐射较强的低纬地区获得热量并增温，性质逐渐改变，后续更冷气团追上形成副锋。",
    keyPoints: ["气团变性", "地面辐射", "冷锋演变"]
  }),
  q({
    id: "GEO-WEA-003", topic: "physical.atmosphere", knowledge: "atmosphere.inversion-fog", title: "海雾过程中的垂直温差",
    source: "资料包·步步高课时14课时精练第3题", material: "image", image: "./assets/questions/atmosphere/sea-fog-temperature.png", alt: "科考船记录的大气温度随高度和时间变化图",
    stem: "受锋面过境影响，某科考船经历一次海雾过程。读部分大气温度随时间变化图，气温垂直变化最剧烈的时刻是：",
    options: ["12日22时", "13日4时", "13日16时", "14日4时"], answer: "B",
    explanation: "13日4时图示高度内最低温约16～17℃、最高温约20～21℃，垂直温差约3～5℃，为各时刻中最剧烈。",
    keyPoints: ["等温线", "垂直温差", "逆温"]
  }),
  q({
    id: "GEO-WEA-004", topic: "physical.atmosphere", knowledge: "atmosphere.inversion-fog", title: "暖锋海雾的形成",
    source: "资料包·步步高课时14课时精练第4题", material: "image", image: "./assets/questions/atmosphere/sea-fog-temperature.png", alt: "科考船记录的大气温度随高度和时间变化图",
    stem: "结合海雾期间的大气温度变化，此次海雾发生的成因可能是：①暖锋过境　②逆温持续　③冷锋过境　④对流旺盛",
    options: ["①②", "②③", "①④", "③④"], answer: "A",
    explanation: "暖锋带来较暖湿空气，近海面水汽趋于饱和；同时下冷上热的逆温抑制对流，使海雾维持。",
    keyPoints: ["暖锋", "逆温", "海雾"]
  }),

  q({
    id: "GEO-AIR-001", topic: "physical.atmosphere", knowledge: "atmosphere.global-circulation", title: "0°经线环流中的气压带",
    source: "资料包·步步高课时16课时精练第1题", material: "image", image: "./assets/questions/atmosphere/zero-meridian-circulation.png", alt: "沿0度经线部分大气环流示意图",
    stem: "读沿0°经线（部分）大气环流示意图，图中甲处为：",
    options: ["极地高压带", "副极地低压带", "副热带高压带", "赤道低压带"], answer: "B",
    explanation: "甲位于约60°N，是冷暖气流相遇并上升的区域，对应副极地低压带。",
    keyPoints: ["三圈环流", "副极地低压带", "纬度定位"]
  }),
  q({
    id: "GEO-AIR-002", topic: "physical.atmosphere", knowledge: "atmosphere.global-circulation", title: "北半球中纬西风方向",
    source: "资料包·步步高课时16课时精练第2题", material: "image", image: "./assets/questions/atmosphere/zero-meridian-circulation.png", alt: "沿0度经线部分大气环流示意图",
    stem: "读沿0°经线（部分）大气环流示意图，乙处风向最可能是：",
    options: ["东北风", "东南风", "西北风", "西南风"], answer: "D",
    explanation: "乙位于北半球中纬度盛行西风带，受地转偏向力作用形成西南风。",
    keyPoints: ["盛行西风", "北半球", "风向"]
  }),
  q({
    id: "GEO-AIR-003", topic: "physical.atmosphere", knowledge: "atmosphere.water-balance", title: "副热带海区水量平衡",
    source: "资料包·步步高课时16课时精练第3题", material: "image", image: "./assets/questions/atmosphere/global-water-balance.png", alt: "全球不同纬度多年平均水量平衡曲线",
    stem: "读全球不同纬度多年平均水量平衡（降水量减实际蒸发量）曲线。造成①②两海区数值较低的大气环流主要为：",
    options: ["盛行西风", "赤道低压带", "西南季风", "副热带高压带"], answer: "D",
    explanation: "①②位于副热带海区，副热带高压控制下盛行下沉气流，降水少且纬度较低、蒸发较强，因此水量平衡值低。",
    keyPoints: ["水量平衡", "副热带高压", "下沉气流"]
  }),
  q({
    id: "GEO-AIR-004", topic: "physical.atmosphere", knowledge: "atmosphere.water-balance", title: "低纬盈余水汽的输送",
    source: "资料包·步步高课时16课时精练第4题", material: "image", image: "./assets/questions/atmosphere/global-water-balance.png", alt: "全球不同纬度多年平均水量平衡曲线",
    stem: "低纬地区海洋与陆地的多年平均水量平衡差异说明，该区域：",
    options: ["盈余水汽主要通过盛行西风输往中纬", "盈余水汽主要通过上升运动形成降水", "亏欠水汽主要通过信风从中纬带来", "亏欠水汽主要通过上升运动形成降水"], answer: "A",
    explanation: "低纬海洋蒸发大于降水，产生的盈余水汽除在低纬形成降水外，还随大气环流输送到中纬地区。",
    keyPoints: ["全球水分收支", "水汽输送", "低纬与中纬"]
  }),
  q({
    id: "GEO-AIR-005", topic: "physical.atmosphere", knowledge: "atmosphere.global-circulation", title: "赤道辐合带北移后的季风",
    source: "资料包·步步高课时16课时精练第5题", material: "image", image: "./assets/questions/atmosphere/itcz-april-july.png", alt: "世界某区域4月和7月赤道辐合带位置图",
    stem: "赤道辐合带位置存在季节性移动。读世界某区域4月和7月赤道辐合带位置图，7月甲河流域的盛行风是：",
    options: ["东北风", "西南风", "西北风", "东南风"], answer: "B",
    explanation: "7月辐合带北移，南半球东南信风越过赤道后受北半球地转偏向力向右偏转，形成西南风。",
    keyPoints: ["赤道辐合带", "越赤道气流", "西南季风"]
  }),

  q({
    id: "GEO-CLI-001", topic: "physical.atmosphere", knowledge: "climate.temperature-controls", title: "北美等温线密集的成因",
    source: "资料包·步步高课时18课时精练第1题", material: "image", image: "./assets/questions/atmosphere/north-america-temperature.png", alt: "北美部分区域1981至2010年年平均气温分布图",
    stem: "读某区域1981～2010年年平均气温分布图。影响甲地附近等温线平行且密集分布的主要因素是：①洋流　②地形　③纬度　④植被",
    options: ["①②", "①③", "②④", "③④"], answer: "A",
    explanation: "甲地附近受阿拉斯加暖流增温和沿岸山地海拔变化共同影响，等温线大体沿海岸且密集。",
    keyPoints: ["洋流", "地形", "等温线"]
  }),
  q({
    id: "GEO-CLI-002", topic: "physical.atmosphere", knowledge: "climate.temperature-controls", title: "区域年平均气温分布方向",
    source: "资料包·步步高课时18课时精练第2题", material: "image", image: "./assets/questions/atmosphere/north-america-temperature.png", alt: "北美部分区域1981至2010年年平均气温分布图",
    stem: "读图判断，该区域年平均气温分布特点最合理的是：",
    options: ["由西南向东北升高", "由西南向东北降低", "由东南向西北升高", "由东南向西北降低"], answer: "B",
    explanation: "区域整体跨越较大纬度，南部低纬气温高、东北高纬气温低，呈由西南向东北降低。",
    keyPoints: ["纬度因素", "气温空间分布", "等温线"]
  }),
  q({
    id: "GEO-CLI-003", topic: "physical.atmosphere", knowledge: "climate.temperature-controls", title: "北美四地气候特征组合",
    source: "资料包·步步高课时18课时精练第3题", material: "image", image: "./assets/questions/atmosphere/north-america-temperature.png", alt: "北美部分区域1981至2010年年平均气温分布图",
    stem: "关于图中甲、乙、丙、丁四地气候特征，正确的是：①甲、丁冬季易受锋面气旋影响　②乙常年受西风影响、气候类型单一　③丙受极地冷空气与热带暖空气影响，气温年较差大　④丁夏季干燥无雨",
    options: ["①②", "①③", "②③", "③④"], answer: "B",
    explanation: "甲、丁位于中纬大陆西岸，冬季锋面气旋活动较多；丙位于北美中部平原，南北气流通道通畅，年温差大。",
    keyPoints: ["大陆西岸气候", "中部平原", "气候影响因素"]
  }),
  q({
    id: "GEO-CLI-004", topic: "physical.atmosphere", knowledge: "climate.rainfall-controls", title: "地中海岛屿7月少雨",
    source: "资料包·步步高课时18课时精练第4题", material: "image", image: "./assets/questions/atmosphere/island-july-rainfall.png", alt: "世界某岛屿7月降水分布图",
    stem: "读世界某岛屿7月降水分布图。该岛屿7月份降水稀少的主要原因是：",
    options: ["受干燥东北信风影响", "寒流降温减湿增强", "位于盛行西风背风坡", "受副热带高压控制"], answer: "D",
    explanation: "该岛位于地中海地区，7月受副热带高压控制，下沉气流不利于成云致雨。",
    keyPoints: ["副热带高压", "地中海气候", "夏季少雨"]
  }),
  q({
    id: "GEO-CLI-005", topic: "physical.atmosphere", knowledge: "climate.rainfall-controls", title: "岛屿山地的降水类型",
    source: "资料包·步步高课时18课时精练第5题", material: "image", image: "./assets/questions/atmosphere/island-july-rainfall.png", alt: "世界某岛屿7月降水分布图",
    stem: "读世界某岛屿7月降水分布图。甲地位于河流源地且降水量线闭合，其主要降水类型是：",
    options: ["对流雨", "地形雨", "锋面雨", "台风雨"], answer: "B",
    explanation: "甲地为岛上山地区域，湿润气流受地形抬升冷却凝结，主要形成地形雨。",
    keyPoints: ["地形雨", "河流源地", "等降水量线"]
  }),

  q({
    id: "GEO-URB-001", topic: "human.urban", knowledge: "urban.satellite-town-location", title: "格林尼治小镇的居住吸引力",
    source: "资料包·步步高课时63课时精练第8题",
    stem: "格林尼治小镇距纽约42千米，是纽约卫星城镇。20世纪初，小镇只是纽约金融从业者逃避城市生活、放松休闲之地。其吸引纽约大量金融高端人士定居，主要是因为：",
    options: ["交通便利", "环境优美", "地价低廉", "设施完善"], answer: "B",
    explanation: "题干强调金融从业者来此逃避大城市生活、放松休闲，直接指向小镇环境优美。",
    keyPoints: ["卫星城镇", "居住区位", "环境质量"]
  }),
  q({
    id: "GEO-URB-002", topic: "human.urban", knowledge: "urban.satellite-town-location", title: "金融服务小镇的集聚优势",
    source: "资料包·步步高课时63课时精练第9题",
    stem: "20世纪90年代，格林尼治小镇吸引纽约大量金融机构总部迁入，成为全球著名金融服务小镇。目前仍有大量金融管理机构入驻，其核心目的是获得：",
    options: ["集聚优势", "设备技术", "工作人员", "公共服务"], answer: "A",
    explanation: "大量同类金融机构集聚，可共享专业劳动力、信息和公共服务，降低协作成本，核心是获得集聚优势。",
    keyPoints: ["产业集聚", "金融服务", "卫星城镇"]
  }),
  q({
    id: "GEO-REG-001", topic: "regional.resources", knowledge: "regional.resource-evaluation", title: "内蒙古优势自然资源",
    source: "资料包·步步高课时60课时精练第7题", material: "image", image: "./assets/questions/region-development/china-resource-evaluation.png", alt: "我国各省区资源条件评价示意图",
    stem: "资源评价包括资源合理性、可利用量、自然品质、赋存条件和开发价值。读我国各省区资源条件评价图，内蒙古自治区的优势自然资源有：",
    options: ["草场、煤炭、稀土", "煤炭、石油、天然气", "风能、水能、生物能", "乳品、土地、有色金属"], answer: "A",
    explanation: "内蒙古草场广阔，煤炭、稀土等矿产资源丰富；乳品属于产品，不是自然资源。",
    keyPoints: ["资源评价", "内蒙古", "自然资源分类"]
  }),
  q({
    id: "GEO-REG-002", topic: "regional.resources", knowledge: "regional.resource-evaluation", title: "西部水土资源约束下的农业选择",
    source: "资料包·步步高课时60课时精练第8题", material: "image", image: "./assets/questions/region-development/china-resource-evaluation.png", alt: "我国各省区资源条件评价示意图",
    stem: "我国西部地区土地资源丰富，但水资源相对不足，发展农业生产时应：",
    options: ["重视跨流域调水工程建设", "大力发展种植业", "开垦荒地增加播种面积", "突出畜牧业优势"], answer: "D",
    explanation: "西部水资源不足限制大规模种植业，而草场资源丰富，应按因地制宜原则突出畜牧业优势。",
    keyPoints: ["水土资源匹配", "因地制宜", "西部农业"]
  })
];

const dayKnowledge = {
  "GEO-REGDEV-005": "region.day01-boundary-scale", "GEO-REGDEV-006": "region.day01-boundary-scale",
  "GEO-REGDEV-001": "region.day02-integrity-linkage", "GEO-REGDEV-002": "region.day02-integrity-linkage",
  "GEO-REGDEV-003": "region.day03-comparison-transfer", "GEO-REGDEV-004": "region.day03-comparison-transfer"
};
for (const id of ["GEO-REGDEV-005", "GEO-REGDEV-006", "GEO-REGDEV-001", "GEO-REGDEV-002", "GEO-REGDEV-003", "GEO-REGDEV-004"]) {
  const item = existingRegion.get(id);
  if (!item) throw new Error(`缺少既有资料包题：${id}`);
  item.knowledge_point_id = dayKnowledge[id];
  item.source_material_kind = item.source_image ? "image" : "table";
  if (item.source_image) item.source_image = item.source_image.replace("./local_learning_sources/region-development/", "./assets/questions/region-development/");
  packQuestions.push(item);
}

const regionQuestion = (args) => q({ topic: "regional.development", ...args });
packQuestions.push(
  regionQuestion({ id: "GEO-REGDEV-007", knowledge: "region.day04-natural-foundation", title: "黄河流域综合指数：甘肃优势", source: "资料包·步步高课时60课时精练第1题（2023·广西百色期末）", material: "image", image: "./assets/questions/region-development/yellow-river-index.png", alt: "2007至2017年黄河流域各省区水能源粮食安全综合指数均值图", stem: "黄河流域水—能源—粮食安全系统综合指数越高，区域发展协调度越高。读2007～2017年均值空间分布图，甘肃省综合指数最高，得益于：", options: ["农作物单产高", "经济发展水平高", "能源丰富多样", "气候条件较优越"], answer: "C", explanation: "甘肃风能、水能、太阳能和煤炭等能源资源丰富，为经济和粮食生产提供多样能源保障。", keyPoints: ["自然资源", "区域协调", "能源结构"] }),
  regionQuestion({ id: "GEO-REGDEV-008", knowledge: "region.day04-natural-foundation", title: "黄河流域综合指数：山西短板", source: "资料包·步步高课时60课时精练第2题（2023·广西百色期末）", material: "image", image: "./assets/questions/region-development/yellow-river-index.png", alt: "2007至2017年黄河流域各省区水能源粮食安全综合指数均值图", stem: "读黄河流域各省区水—能源—粮食安全系统综合指数均值空间分布图。山西省综合指数低的主要原因是：", options: ["煤炭消费量大，利用效率低", "多山地丘陵，粮食生产面积小", "位于干旱地区，降水总量少", "热量条件差，作物生长周期短"], answer: "A", explanation: "山西能源结构以煤炭为主，消费量大且利用效率较低，影响水—能源—粮食系统协调。", keyPoints: ["资源利用效率", "产业结构", "区域短板"] }),
  regionQuestion({ id: "GEO-REGDEV-009", knowledge: "region.day05-ecological-governance", title: "风沙流防控的关键高度", source: "资料包·步步高课时61课时精练第1题（2023·四川绵阳模拟）", material: "image", image: "./assets/questions/region-development/wind-sand-height.png", alt: "蒙古国甲地风沙流输沙量随高度变化的累积分布图", stem: "蒙古国甲地位于平坦河谷，植被覆盖率较高但年输沙量大。读近地面风沙流输沙量随高度变化的累积分布图，防控风沙流的关键高度是：", options: ["0～20 cm", "21～40 cm", "41～60 cm", "61 cm以上"], answer: "A", explanation: "0～35 cm输沙累积增长最快，其中0～20 cm增速最大，是防控风沙流的关键高度。", keyPoints: ["风沙流", "读曲线", "关键高度"] }),
  regionQuestion({ id: "GEO-REGDEV-010", knowledge: "region.day05-ecological-governance", title: "风沙流防控的植被组合", source: "资料包·步步高课时61课时精练第2题（2023·四川绵阳模拟）", material: "image", image: "./assets/questions/region-development/wind-sand-height.png", alt: "蒙古国甲地风沙流输沙量随高度变化的累积分布图", stem: "结合甲地风沙流主要集中在近地面低层且区域水资源有限，防控风沙流的有效生态措施是大量种植：", options: ["灌木和乔木", "草本和灌木", "草本和乔木", "藤本和水生植物"], answer: "B", explanation: "草本和灌木覆盖高度贴近关键输沙层，需水量又小于乔木，更符合干旱区生态承载力。", keyPoints: ["生态治理", "植被配置", "水资源约束"] }),
  regionQuestion({ id: "GEO-REGDEV-011", knowledge: "region.day06-resource-city-transition", title: "布查德花园的经营优势", source: "资料包·步步高课时62课时精练第1题", material: "image", image: "./assets/questions/region-development/butchart-garden.png", alt: "加拿大温哥华岛布查德花园位置与景观图", stem: "加拿大温哥华岛石灰岩开采殆尽后，人们在矿坑上建造布查德花园，由专业设计师设计、专业园艺师运营，并配置多种服务设施。花园经营效果很好，主要因为：", options: ["明确目标客户群定价", "突出花园文化特色", "专业规划与专业经营", "充分发掘旅游衍生品"], answer: "C", explanation: "材料直接强调专业设计、专业运营和完善服务设施，这是花园持续吸引游客的核心。", keyPoints: ["资源型地区转型", "专业运营", "旅游开发"] }),
  regionQuestion({ id: "GEO-REGDEV-012", knowledge: "region.day06-resource-city-transition", title: "资源枯竭城市的转型启示", source: "资料包·步步高课时62课时精练第2题", material: "image", image: "./assets/questions/region-development/butchart-garden.png", alt: "加拿大温哥华岛布查德花园位置与景观图", stem: "布查德花园经过几代人努力，由废弃石灰岩矿坑转型为著名旅游地。其经营模式给资源枯竭型城市的启示是：", options: ["加大投入，一次性完成战略转型", "开发新的资源，培育新的主导产业", "延长产业链，提升原有资源利用价值", "依靠长久历史文化积淀"], answer: "B", explanation: "矿坑转为花园旅游地，本质是开发新的发展资源、培育替代产业，并非延伸原采矿产业链。", keyPoints: ["替代产业", "资源枯竭型城市", "渐进转型"] }),
  regionQuestion({ id: "GEO-REGDEV-013", knowledge: "region.day07-transition-case", title: "南桐煤炭基地的区位条件", source: "资料包·步步高课时62课时精练第3题（2023·江苏扬州期末）", material: "image", image: "./assets/questions/region-development/wansheng-location.png", alt: "重庆万盛区位置示意图", stem: "读重庆市万盛区（原南桐矿区）位置与发展简历。南桐矿区发展为当时著名煤炭工业基地的区位条件有：①地形平坦开阔　②临近河流、航运发达　③煤炭丰富　④国防需求与政策支持", options: ["①②", "①③", "②③", "③④"], answer: "D", explanation: "南桐矿区煤炭资源丰富，抗战时期国防物资需求与政策支持显著；其山区地形和距长江较远并非优势。", keyPoints: ["资源型城市", "区位条件", "政策因素"] }),
  regionQuestion({ id: "GEO-REGDEV-014", knowledge: "region.day07-transition-case", title: "万盛区的转型措施", source: "资料包·步步高课时62课时精练第4题（2023·江苏扬州期末）", material: "image", image: "./assets/questions/region-development/wansheng-location.png", alt: "重庆万盛区位置示意图", stem: "面对煤炭资源枯竭和矿区环境问题，重庆万盛区转型发展的合理措施有：①开发新资源、培育新产业　②修梯田发展水稻　③整合小煤矿扩大规模　④治理环境发展旅游", options: ["①②", "①④", "②③", "②④"], answer: "B", explanation: "资源枯竭区应培育替代产业并修复生态、发展旅游；继续扩大煤炭开采不能解决资源枯竭，水稻种植也不符合山区条件。", keyPoints: ["产业替代", "生态修复", "转型措施"] }),
  regionQuestion({ id: "GEO-REGDEV-015", knowledge: "region.day08-city-radiation", title: "城市群核心辐射强度", source: "资料包·步步高课时63课时精练第1题", material: "image", image: "./assets/questions/region-development/city-cluster-crystal.png", alt: "单中心、双中心和多中心城市群空间结构组合图", stem: "城市群空间扩展可形成类似晶体的分等级节点网络。读单中心、双中心和多中心组合城市群图，核心城市对周边城市的辐射功能由大到小是：", options: ["单中心、多中心、双中心", "双中心、多中心、单中心", "多中心、双中心、单中心", "单中心、双中心、多中心"], answer: "D", explanation: "核心数量越多，核心腹地重叠越明显，单个核心对节点城市的单一辐射程度越低。", keyPoints: ["城市辐射", "城市群结构", "核心城市"] }),
  regionQuestion({ id: "GEO-REGDEV-016", knowledge: "region.day08-city-radiation", title: "城市群核心城市等级", source: "资料包·步步高课时63课时精练第2题", material: "image", image: "./assets/questions/region-development/city-cluster-crystal.png", alt: "单中心、双中心和多中心城市群空间结构组合图", stem: "下列城市群中，核心城市等级最高的是：", options: ["京津冀城市群", "山东半岛城市群", "辽中南城市群", "长江中游城市群"], answer: "A", explanation: "京津冀城市群核心北京为国家首都和全国性中心城市，城市等级高于其他选项中的核心城市。", keyPoints: ["城市等级", "服务范围", "京津冀"] }),
  regionQuestion({ id: "GEO-REGDEV-017", knowledge: "region.day09-industrial-structure", title: "榆林产业结构演化因素", source: "资料包·步步高课时64课时精练第1题（2023·湖南郴州期末）", material: "image", image: "./assets/questions/region-development/yulin-industry-structure.png", alt: "榆林市1990至2015年GDP与三次产业结构演化图", stem: "榆林位于陕北能源开发区腹地，煤炭、石油、天然气丰富。读1990～2015年GDP与三次产业结构演化图，影响其产业结构演化的主要因素有：①资源禀赋　②人力数量　③市场需求　④国家政策", options: ["①②③", "①②④", "①③④", "②③④"], answer: "C", explanation: "能源资源禀赋、能源市场需求和国家能源基地政策共同推动第二产业发展，人力资源数量不是主要决定因素。", keyPoints: ["产业结构", "资源禀赋", "市场与政策"] }),
  regionQuestion({ id: "GEO-REGDEV-018", knowledge: "region.day09-industrial-structure", title: "榆林产业结构升级的影响", source: "资料包·步步高课时64课时精练第2题（2023·湖南郴州期末）", material: "image", image: "./assets/questions/region-development/yulin-industry-structure.png", alt: "榆林市1990至2015年GDP与三次产业结构演化图", stem: "读图可见2012～2015年榆林第二产业比重下降、第三产业比重上升。该阶段产业结构演化对当地的主要影响是：", options: ["加快矿产资源开发", "提高资源利用效率", "加快基础设施建设", "促进区域均衡发展"], answer: "B", explanation: "第二产业比重下降、第三产业上升表明资源开发增速放缓、技术和服务投入增强，有助于提高资源利用效率。", keyPoints: ["产业升级", "资源效率", "三次产业"] }),
  regionQuestion({ id: "GEO-REGDEV-019", knowledge: "region.day10-industry-localization", title: "汽车适应伊朗市场的性能取舍", source: "资料包·步步高课时68课时精练第4题", material: "image", image: "./assets/questions/region-development/iran-car-material.png", alt: "伊朗等高线图和德黑兰气候统计图", stem: "某中国汽车品牌进入伊朗并针对当地自然环境进行适应性测试。读伊朗等高线图和德黑兰气候统计图，不需要着重考虑的性能是：", options: ["爬坡性能", "防爆胎性能", "防湿滑性能", "防风沙性能"], answer: "C", explanation: "伊朗地形起伏大、气候干旱多风沙，需要考虑爬坡、防爆胎和防风沙；全年降水少，防湿滑并非重点。", keyPoints: ["市场本土化", "自然环境", "产品适应性"] }),
  regionQuestion({ id: "GEO-REGDEV-020", knowledge: "region.day10-industry-localization", title: "伊朗合资建厂的首要因素", source: "资料包·步步高课时68课时精练第5题", material: "image", image: "./assets/questions/region-development/iran-car-material.png", alt: "伊朗等高线图和德黑兰气候统计图", stem: "该品牌在伊朗拥有年产6万辆整车的合资工厂和150家销售服务网点。在伊朗建设合资工厂考虑的最主要因素是：", options: ["优惠政策", "市场前景", "科技水平", "劳动力成本"], answer: "B", explanation: "合资工厂与密集销售网点体现靠近消费市场、开拓市场的目的，汽车生产对低成本劳动力依赖相对较小。", keyPoints: ["工业区位", "市场因素", "海外建厂"] }),
  regionQuestion({ id: "GEO-REGDEV-021", knowledge: "region.day11-basin-coordination", title: "国际河流综合开发核心", source: "资料包·步步高课时65课时精练第1题", material: "image", image: "./assets/questions/region-development/senegal-basin-material.png", alt: "塞内加尔河流域区域图与甲乙站年降水量图", stem: "马里、塞内加尔和毛里塔尼亚联合成立流域治理开发委员会并修建水坝。读流域图和甲、乙站年降水图，塞内加尔河流域综合开发利用的核心是：", options: ["矿产资源深加工", "水资源的协作开发", "水污染综合治理", "大力发展内河航运"], answer: "B", explanation: "流域内降水空间和季节差异显著，多个国家共享河流，综合开发核心是跨国协作配置水资源。", keyPoints: ["流域治理", "国际河流", "水资源协作"] }),
  regionQuestion({ id: "GEO-REGDEV-022", knowledge: "region.day11-basin-coordination", title: "河口水坝的独特功能", source: "资料包·步步高课时65课时精练第2题", material: "image", image: "./assets/questions/region-development/senegal-basin-material.png", alt: "塞内加尔河流域区域图与甲乙站年降水量图", stem: "与上游马南塔里坝相比，靠近塞内加尔河入海口的迪亚马坝独特功能可能是：", options: ["防洪", "灌溉", "航运", "阻咸"], answer: "D", explanation: "迪亚马坝位于地势低平的河口附近，能够阻挡海水倒灌，阻咸是其区别于上游水坝的功能。", keyPoints: ["河口", "水坝功能", "海水倒灌"] }),
  regionQuestion({ id: "GEO-REGDEV-023", knowledge: "region.day12-resource-transfer", title: "鄂北调水工程的水量特征", source: "资料包·步步高课时66课时精练第1题", material: "image", image: "./assets/questions/region-development/north-hubei-water-transfer.png", alt: "鄂北水资源配置一期工程线路图", stem: "鄂北水资源配置工程起点为丹江口水库，沿线地势不断降低，人口和耕地较多。读图判断，该工程：", options: ["需要逐级抽水东送", "可彻底解决鄂北旱情", "调水水量季节变化小", "调水水质较差"], answer: "C", explanation: "水源来自具有调节能力的丹江口水库，调水量季节变化较小；线路地势降低可自流，工程只能缓解而非彻底解决旱情。", keyPoints: ["跨流域调水", "水库调节", "工程评价"] }),
  regionQuestion({ id: "GEO-REGDEV-024", knowledge: "region.day12-resource-transfer", title: "鄂北调水的区域影响", source: "资料包·步步高课时66课时精练第2题", material: "image", image: "./assets/questions/region-development/north-hubei-water-transfer.png", alt: "鄂北水资源配置一期工程线路图", stem: "鄂北水资源配置工程通水的主要影响是：", options: ["造成调出区水资源枯竭", "加剧沿线土壤盐渍化", "根治沿线水质污染", "提高鄂北地区水安全保障"], answer: "D", explanation: "工程增加鄂北供水，可缓解缺水对生产生活的限制，提高水安全保障；其他选项均夸大或不符合当地条件。", keyPoints: ["调水影响", "水安全", "区域协调"] }),
  regionQuestion({ id: "GEO-REGDEV-025", knowledge: "region.day13-industry-transfer", title: "佛山高耗能产业转出", source: "资料包·步步高课时67课时精练第1题（2023·湖北黄冈模拟）", material: "image", image: "./assets/questions/region-development/guangzhou-industry-transfer.png", alt: "2009至2019年广州都市圈各城市产业转移系统综合水平图", stem: "图中产业转移系统综合水平越高，产业转出比重越大。2013年佛山该指数达到峰值，原因可能是：", options: ["人口回流意愿明显", "高耗能产业迁出", "生态环境遭到破坏", "劳动力成本下降"], answer: "B", explanation: "指数峰值表示产业转出比重高，佛山推进产业升级时高耗能产业外迁最能直接解释该变化。", keyPoints: ["产业转移", "高耗能产业", "图表判读"] }),
  regionQuestion({ id: "GEO-REGDEV-026", knowledge: "region.day13-industry-transfer", title: "产业转出骤降的影响", source: "资料包·步步高课时67课时精练第2题（2023·湖北黄冈模拟）", material: "image", image: "./assets/questions/region-development/guangzhou-industry-transfer.png", alt: "2009至2019年广州都市圈各城市产业转移系统综合水平图", stem: "2016～2017年部分城市产业转移系统综合水平呈断崖式下跌，说明产业转出比重降低。这将使：", options: ["土地成本上升", "交通条件改善", "科技成本提高", "经济稳定发展"], answer: "D", explanation: "产业转出比重突然下降意味着本地生产活动相对稳定，有助于维持就业和经济运行稳定；不能直接推出其他变化。", keyPoints: ["产业转移水平", "区域经济", "指标解读"] }),
  regionQuestion({ id: "GEO-REGDEV-027", knowledge: "region.day14-international-cooperation", title: "埃塞俄比亚承接成衣制造的优势", source: "资料包·步步高课时68课时精练第1题", stem: "我国服装企业在埃塞俄比亚工业园区投资建立成衣制造厂，使其成为向欧美出口服装和皮革的主要国家之一。埃塞俄比亚的比较优势是：①土地和劳动力成本低　②距市场近　③工业基础好　④政策支持", options: ["①②", "①②③", "①②④", "①②③④"], answer: "C", explanation: "埃塞俄比亚土地和劳动力成本低，面向欧美市场区位较近，且增长转型计划提供政策支持，但工业基础仍较薄弱。", keyPoints: ["国际产业转移", "比较优势", "政策与市场"] }),
  regionQuestion({ id: "GEO-REGDEV-028", knowledge: "region.day14-international-cooperation", title: "承接产业转移的区域影响", source: "资料包·步步高课时68课时精练第2题", stem: "埃塞俄比亚承接中国产业转移，对本国的影响是：①促进产业结构调整　②改善当地环境质量　③加快工业化和城镇化　④提高失业率", options: ["①②", "③④", "①③", "②④"], answer: "C", explanation: "承接制造业有利于产业结构调整、增加就业并推进工业化和城镇化；同时可能带来环境压力，不会提高失业率。", keyPoints: ["产业转移影响", "工业化", "城镇化"] })
);

for (const item of packQuestions) {
  const verified = sourceFidelity[item.id];
  if (!verified) throw new Error(`缺少资料包原题核对记录：${item.id}`);
  item.source = verified.source;
  item.source_document = verified.source_document;
  item.source_material = verified.source_material;
  item.stem = verified.stem;
  item.options = verified.options.map((text, index) => ({ id: letters[index], text }));
  item.answer = verified.answer;
  item.explanation = verified.explanation;
  item.source_fidelity = {
    status: "verified_against_teacher_docx",
    verified_on: "2026-08-27",
    fields: ["source_material", "stem", "options", "answer", "explanation"]
  };
}

const ids = new Set();
for (const item of packQuestions) {
  if (ids.has(item.id)) throw new Error(`题号重复：${item.id}`);
  ids.add(item.id);
  if (!item.source.startsWith("资料包·")) throw new Error(`非资料包题源：${item.id}`);
}

fs.writeFileSync(outputPath, `${JSON.stringify(packQuestions, null, 2)}\n`);
console.log(`已生成 ${packQuestions.length} 道资料包诊断题。`);
