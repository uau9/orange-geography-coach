# 项目架构与升级约定

## 目标

保持无后端、可离线和静态托管兼容，同时让新增专题不再挤占首页，也不必继续扩张单个脚本的职责。

## 分层

### 1. 内容数据：`data/`

- `learning_projects.json` 是所有学习项目的导航清单；
- `questions.json`、`retests.json` 是诊断与复测内容；
- `time_lab.json`、`earth_motion_lab.json`、`solar_season_lab.json`、`solar_path_lab.json`、`annual_sun_lab.json`、`orbit_speed_lab.json`、`terminator_link_lab.json`、`rotation_speed_lab.json`、`date_range_lab.json`、`axial_tilt_lab.json`、`celestial_scale_lab.json`、`habitability_lab.json`、`solar_activity_lab.json`、`moon_phase_lab.json`、`eclipse_lab.json` 是专题实验模型；
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
- `learning-export.js`：学习档案摘要、时间戳和文件名；
- 后续专题可继续拆分自己的渲染和计算模块。

脚本加载顺序由 `index.html` 明确声明：配置 → 功能模块 → `app.js` 集成层。

### 4. 集成层：`assets/app.js`

负责浏览器状态、路由、事件委托、导入兼容和专题流程编排。新增功能优先放到独立模块，只在这里连接状态与事件，不再把纯渲染或导出算法继续堆入主文件。

## 新增一个学习项目

1. 在 `data/learning_projects.json` 登记项目编号、说明、入口 action、状态类型和排序；
2. 在相应数据文件中加入内容，并创建或升级 schema；
3. 如需新交互，在 `assets/features/` 新建功能模块；
4. 在 `app.js` 连接 action、状态摘要和路由；
5. 在 `scripts/validate-content.mjs` 加入项目、数据关系和关键算法校验；
6. 更新产品文档，执行 `npm test`，再完成 iPad 横竖屏与手机验收。

## 版本规则

- 应用资源版本当前为 `0.19.0`，集中定义在 `assets/config.js`；
- LocalStorage 学习记录仍使用兼容版本 `0.3.0`，避免破坏已有浏览器数据；
- 导出档案独立使用 `export_schema_version: 0.19.0`；
- 修改数据结构时分别判断“应用版本、记录版本、导出版本”是否需要升级。

## 完成检查

- 学生作答前看不到答案或完整解析；
- AI判断仍为候选，家长能确认或标记教师复核；
- 作答、理由、审核、复测和批注均能保存或导出；
- 新项目不会让首页增加新的大型入口卡片；
- `npm test` 通过，iPad横竖屏与手机触控流程可用。
