# 项目架构与升级约定

## 目标

保持无后端、可离线和静态托管兼容，同时让新增专题不再挤占首页，也不必继续扩张单个脚本的职责。

## 分层

### 1. 内容数据：`data/`

- `learning_projects.json` 是所有学习项目的导航清单；
- `curriculum_catalog.json` 是教材册—章—节目录，保存题目和项目的课程位置；`topic_id` 仍独立用于错因统计与掌握分析；
- `presentation_catalog.json` 是章节 PPT 的机器可读目录，保存稳定的 deck、slide、lab 和 question 映射；
- `questions.json`、`retests.json` 是诊断与复测内容；
- `region_review.json` 是选择性必修2四章的14天复习编排，记录章—DAY层级和教材页/PDF页映射；`教材/`、完整资料包与 `local_learning_sources/` 保持Git忽略，区域发展对应教材页面图片发布到 `assets/textbook/region-development/`，实际入题所需图表发布到 `assets/questions/`；
- `time_lab.json`、`earth_motion_lab.json`、`solar_season_lab.json`、`solar_path_lab.json`、`annual_sun_lab.json`、`orbit_speed_lab.json`、`terminator_link_lab.json`、`rotation_speed_lab.json`、`date_range_lab.json`、`axial_tilt_lab.json`、`celestial_scale_lab.json`、`habitability_lab.json`、`solar_activity_lab.json`、`moon_phase_lab.json`、`eclipse_lab.json`、`tide_lab.json`、`coriolis_lab.json`、`front_weather_lab.json`、`cyclone_system_lab.json`、`atmosphere_reasoning_labs.json` 是专题实验模型；
- 内容文件不直接包含HTML，也不保存浏览器作答状态。

### 2. 格式约束：`schemas/`

新数据格式必须有带版本号的 schema。旧记录需要继续支持时，新增 schema 或兼容读取逻辑，不静默改写旧数据。

### 3. 功能模块：`assets/features/`

当前使用按加载顺序注册到 `window.OrangeCoach.features` 的经典脚本，不使用构建工具，也不依赖 ES module。原因是项目需要兼容 GitHub Pages、本地静态服务器和曾出现过模块脚本启动失败的外部浏览器。

- `home.js`：今日建议与项目目录的纯渲染；
- `solar-season.js`：太阳直射点、昼长和正午太阳高度计算及渲染；
- `solar-path.js`：日出日落、正午太阳、影子方向和天空时间轴计算及渲染；
- `annual-sun.js`：直射点周年回归、移动方向、昼长与太阳高度趋势计算及渲染；
- `orbit-speed.js`：日地距离、公转速度、半球季节与等时段轨迹计算及渲染；
- `terminator-link.js`：直射经线、地方时、昼长、晨昏状态、极昼极夜与全球昼夜图联动；
- `rotation-speed.js`：自转角速度、纬线圈、线速度、转角与运动弧长计算及渲染；
- `date-range.js`：0时经线、全球日期范围、日期占比和跨日界线计算及渲染；
- `axial-tilt.js`：黄赤交角、回归线、极圈、五带宽度与反事实滑轨计算及渲染；
- `celestial-scale.js`：地月系、太阳系、银河系与可观测宇宙的层级缩放、尺度锚点和位置辨析；
- `habitability.js`：金星、地球、火星和月球的轨道、大气、温度、液态水与生命证据边界对照；
- `solar-activity.js`：黑子、耀斑、高能粒子、CME与高速太阳风的传播载体、时标、地球影响和证据边界；
- `moon-phase.js`：八相日地月位置、月面受光、盈亏、可见时段与普通月相/日月食边界；
- `eclipse.js`：新月/满月与交点、本影/半影/伪本影、日月食类型和地表可见范围；
- `tide.js`：八相日月方向、引潮作用、大潮/小潮、潮差周期与当地预报边界；
- `coriolis.js`：地转偏向力半球规则、相对偏向与地图方位转换；
- `front-weather.js`：冷锋、暖锋、准静止锋的剖面模型与过境天气判断；
- `cyclone-system.js`：高低压、南北半球旋转、垂直运动与阴晴联动；
- `atmosphere-reasoning.js`：三圈环流、气压带风带季节移动、海陆气压中心与季风的通用五步实验；
- `learning-export.js`：学习档案摘要、时间戳和文件名；
- `region-review.js`：章—DAY折叠目录、教材页面图片、资料包诊断题、延迟复测与家长检查清单的纯渲染；
- 后续专题可继续拆分自己的渲染和计算模块。

脚本加载顺序由 `index.html` 明确声明：配置 → 功能模块 → `app.js` 集成层。

### 4. 集成层：`assets/app.js`

负责浏览器状态、路由、事件委托、导入兼容和专题流程编排。新增功能优先放到独立模块，只在这里连接状态与事件，不再把纯渲染或导出算法继续堆入主文件。

## 新增一个学习项目

1. 在 `data/learning_projects.json` 登记项目编号、说明、入口 action、状态类型和排序；
2. 在 `data/curriculum_catalog.json` 将项目登记到对应教材小节；跨章或教材外项目登记到综合专题，诊断和复测类工具登记到快捷入口；
3. 在相应数据文件中加入内容，并创建或升级 schema；
4. 如需新交互，在 `assets/features/` 新建功能模块；
5. 在 `app.js` 连接 action、状态摘要和路由；
6. 在 `scripts/validate-content.mjs` 加入项目、数据关系和关键算法校验；
7. 更新产品文档，执行 `npm test`，再完成 iPad 横竖屏与手机验收。

## 新增教材章节内容

1. 先核对教材目录，将章、节和问题研究登记到 `curriculum_catalog.json`；
2. 题目继续保留 `topic_id`，并把题号登记到唯一一个教材小节或综合专题；
3. 学习项目同样只登记到一个教材小节、综合专题或快捷入口；
4. `active` 表示当前学习，`available` 表示已有可用内容，`planned` 表示即将学习，`registered` 表示仅登记目录；
5. 校验脚本必须阻止不存在的引用、重复归属和未归类内容。

## 新增或更新章节 PPT

1. 在 `data/presentation_catalog.json` 登记稳定的 `deck_id`、`slide_id`、`lab_id` 和 `question_id`；
2. 保持题目页与答案页分离，并把外部来源写入页眉和演讲者备注；
3. 只改文字或视觉时不改变稳定编号；调序或增删页面时同步更新目录；
4. 后续项目接入按 `docs/PRESENTATION_INTEGRATION_PLAN.md` 分阶段进行，不把“打开 PPT”记为掌握；
5. 更新 schema 和校验脚本，执行 `npm test`。

## 版本规则

- 应用资源版本当前为 `0.28.1`，集中定义在 `assets/config.js`；
- LocalStorage 学习记录仍使用兼容版本 `0.3.0`，避免破坏已有浏览器数据；
- 导出档案独立使用 `export_schema_version: 0.25.0`；
- 修改数据结构时分别判断“应用版本、记录版本、导出版本”是否需要升级。

## 完成检查

- 普通知识点诊断题在作答前看不到答案或完整解析；实验室图示默认可见；
- AI判断仍为候选，家长能确认或标记教师复核；
- 作答、选填判断链、审核、复测和批注均能保存或导出；
- 新项目不会让首页增加新的大型入口卡片；
- “学习”和“题目”在底部导航常驻，正在学习的项目在学习目录最前；
- 诊断题和学习项目按教材册—章—节导航；目录只显示到三级，题目列表在第3级内折叠并可定位当前题；
- 诊断题目录不提前输出正确答案或解析，状态筛选与指定题目进入不改写原有作答记录；
- 所有诊断与复测均来自资料包；每个知识点2—5题；共同材料、题干、四个选项、答案、原解析、原图、原表、图例和单位缺任一项时校验失败；精选题图必须位于可发布的 `assets/questions/`；
- 区域发展教材第2—91页以页面图片发布，14天页码映射、图片存在性和最小文件大小由校验脚本检查；整本PDF不进入站点资源；
- `npm test` 通过，iPad横竖屏与手机触控流程可用。
