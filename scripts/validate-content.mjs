import { readFile } from "node:fs/promises";
import { calculateTimeLabAnswers, normalizeTimeAnswer } from "../assets/time-utils.js";
await import("../assets/config.js");
await import("../assets/features/solar-season.js");
await import("../assets/features/solar-path.js");
await import("../assets/features/annual-sun.js");
await import("../assets/features/orbit-speed.js");
await import("../assets/features/terminator-link.js");
await import("../assets/features/rotation-speed.js");
await import("../assets/features/date-range.js");
await import("../assets/features/axial-tilt.js");
await import("../assets/features/celestial-scale.js");
await import("../assets/features/learning-export.js");

const topics = JSON.parse(await readFile(new URL("../data/topics.json", import.meta.url), "utf8"));
const questions = JSON.parse(await readFile(new URL("../data/questions.json", import.meta.url), "utf8"));
const paperReviews = JSON.parse(await readFile(new URL("../data/paper_reviews.json", import.meta.url), "utf8"));
const retests = JSON.parse(await readFile(new URL("../data/retests.json", import.meta.url), "utf8"));
const timeLab = JSON.parse(await readFile(new URL("../data/time_lab.json", import.meta.url), "utf8"));
const earthMotionLab = JSON.parse(await readFile(new URL("../data/earth_motion_lab.json", import.meta.url), "utf8"));
const learningProjects = JSON.parse(await readFile(new URL("../data/learning_projects.json", import.meta.url), "utf8"));
const solarSeasonLab = JSON.parse(await readFile(new URL("../data/solar_season_lab.json", import.meta.url), "utf8"));
const solarPathLab = JSON.parse(await readFile(new URL("../data/solar_path_lab.json", import.meta.url), "utf8"));
const annualSunLab = JSON.parse(await readFile(new URL("../data/annual_sun_lab.json", import.meta.url), "utf8"));
const orbitSpeedLab = JSON.parse(await readFile(new URL("../data/orbit_speed_lab.json", import.meta.url), "utf8"));
const terminatorLinkLab = JSON.parse(await readFile(new URL("../data/terminator_link_lab.json", import.meta.url), "utf8"));
const rotationSpeedLab = JSON.parse(await readFile(new URL("../data/rotation_speed_lab.json", import.meta.url), "utf8"));
const dateRangeLab = JSON.parse(await readFile(new URL("../data/date_range_lab.json", import.meta.url), "utf8"));
const axialTiltLab = JSON.parse(await readFile(new URL("../data/axial_tilt_lab.json", import.meta.url), "utf8"));
const celestialScaleLab = JSON.parse(await readFile(new URL("../data/celestial_scale_lab.json", import.meta.url), "utf8"));
const v015Schemas = await Promise.all([
  "celestial-scale-lab.v0.15.schema.json",
  "celestial-scale-attempt.v0.15.schema.json",
  "learning-projects.v0.15.schema.json",
  "learning-export.v0.15.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const topicIds = new Set(topics.map((topic) => topic.id));
const errors = [];

if (v015Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.15 schema 必须声明 $id 与 JSON Schema 版本");

if (!Array.isArray(topics) || topics.length === 0) errors.push("topics.json 必须是非空数组");
if (!Array.isArray(questions) || questions.length === 0) errors.push("questions.json 必须是非空数组");
if (!Array.isArray(paperReviews) || paperReviews.length === 0) errors.push("paper_reviews.json 必须是非空数组");
if (!Array.isArray(retests) || retests.length === 0) errors.push("retests.json 必须是非空数组");
if (!timeLab || !Array.isArray(timeLab.scenarios) || timeLab.scenarios.length === 0) errors.push("time_lab.json 必须包含非空 scenarios");
if (!timeLab || !Array.isArray(timeLab.places) || timeLab.places.length === 0) errors.push("time_lab.json 必须包含非空 places");
if (!earthMotionLab || !Array.isArray(earthMotionLab.views) || earthMotionLab.views.length !== 3) errors.push("earth_motion_lab.json 必须包含3种观察视角");
if (learningProjects?.schema_version !== "0.15.0" || !Array.isArray(learningProjects.projects) || learningProjects.projects.length === 0) errors.push("learning_projects.json 必须是0.15.0版非空项目清单");
if (solarSeasonLab?.schema_version !== "0.7.0" || !Array.isArray(solarSeasonLab.dates) || solarSeasonLab.dates.length !== 4) errors.push("solar_season_lab.json 必须包含4个二分二至日情境");
if (solarPathLab?.schema_version !== "0.8.0" || !Array.isArray(solarPathLab.dates) || solarPathLab.dates.length !== 4) errors.push("solar_path_lab.json 必须包含4个二分二至日情境");
if (annualSunLab?.schema_version !== "0.9.0" || !Array.isArray(annualSunLab.checkpoints) || annualSunLab.checkpoints.length !== 8) errors.push("annual_sun_lab.json 必须包含8个周年观察位置");
if (orbitSpeedLab?.schema_version !== "0.10.0" || !Array.isArray(orbitSpeedLab.checkpoints) || orbitSpeedLab.checkpoints.length !== 4) errors.push("orbit_speed_lab.json 必须包含4个公转轨道位置");
if (terminatorLinkLab?.schema_version !== "0.11.0" || !Array.isArray(terminatorLinkLab.scenarios) || terminatorLinkLab.scenarios.length !== 8) errors.push("terminator_link_lab.json 必须包含8个晨昏线综合情境");
if (rotationSpeedLab?.schema_version !== "0.12.0" || !Array.isArray(rotationSpeedLab.scenarios) || rotationSpeedLab.scenarios.length !== 8) errors.push("rotation_speed_lab.json 必须包含8个自转速度情境");
if (dateRangeLab?.schema_version !== "0.13.0" || !Array.isArray(dateRangeLab.scenarios) || dateRangeLab.scenarios.length !== 8) errors.push("date_range_lab.json 必须包含8个全球日期情境");
if (axialTiltLab?.schema_version !== "0.14.0" || !Array.isArray(axialTiltLab.scenarios) || axialTiltLab.scenarios.length !== 8) errors.push("axial_tilt_lab.json 必须包含8个黄赤交角情境");
if (celestialScaleLab?.schema_version !== "0.15.0" || !Array.isArray(celestialScaleLab.scenarios) || celestialScaleLab.scenarios.length !== 8) errors.push("celestial_scale_lab.json 必须包含8个天体系统尺度情境");

const projectIds = new Set();
const projectOrders = new Set();
const allowedProjectActions = new Set(["start-earth-motion", "start-solar-season", "start-annual-sun", "start-orbit-speed", "start-terminator-link", "start-rotation-speed", "start-date-range", "start-axial-tilt", "start-celestial-scale", "start-solar-path", "start-time-lab", "start-next", "goto"]);
const allowedStatusKinds = new Set(["earth_motion", "solar_season", "annual_sun", "orbit_speed", "terminator_link", "rotation_speed", "date_range", "axial_tilt", "celestial_scale", "solar_path", "time_lab", "diagnostic", "retest"]);
for (const project of learningProjects?.projects || []) {
  if (projectIds.has(project.id)) errors.push(`学习项目编号重复：${project.id}`);
  projectIds.add(project.id);
  if (projectOrders.has(project.order)) errors.push(`学习项目排序重复：${project.order}`);
  projectOrders.add(project.order);
  if (!project.title?.trim() || !project.summary?.trim() || !project.cta?.trim()) errors.push(`${project.id || "未知项目"} 缺少标题、说明或按钮文字`);
  if (!allowedProjectActions.has(project.action)) errors.push(`${project.id} 使用了不支持的 action`);
  if (!allowedStatusKinds.has(project.status_kind)) errors.push(`${project.id} 使用了不支持的 status_kind`);
  if (project.action === "goto" && !project.route) errors.push(`${project.id} 的 goto action 必须指定 route`);
}
for (const requiredProjectId of ["earth-motion-lab", "solar-season-lab", "annual-sun-lab", "orbit-speed-lab", "terminator-link-lab", "rotation-speed-lab", "date-range-lab", "axial-tilt-lab", "celestial-scale-lab", "solar-path-lab", "time-zone-lab", "diagnostic-questions", "delayed-retests"]) {
  if (!projectIds.has(requiredProjectId)) errors.push(`学习项目清单缺少：${requiredProjectId}`);
}

const ids = new Set();
for (const question of questions) {
  if (ids.has(question.id)) errors.push(`题目编号重复：${question.id}`);
  ids.add(question.id);
  if (!topicIds.has(question.topic_id)) errors.push(`${question.id} 引用了不存在的主题：${question.topic_id}`);
  const optionIds = question.options?.map((option) => option.id) ?? [];
  if (new Set(optionIds).size !== optionIds.length) errors.push(`${question.id} 选项编号重复`);
  if (!optionIds.includes(question.answer)) errors.push(`${question.id} 正确答案不在选项中`);
  for (const optionId of optionIds.filter((id) => id !== question.answer)) {
    if (!question.error_map?.[optionId]?.tag) errors.push(`${question.id} 缺少 ${optionId} 的 error_tag`);
  }
  if (!Array.isArray(question.review_after_days) || question.review_after_days.length === 0) {
    errors.push(`${question.id} 缺少复测间隔`);
  }
}

const paperIds = new Set();
for (const review of paperReviews) {
  if (review.schema_version !== "0.2.0") errors.push(`${review.id || "未知试卷"} schema_version 必须为 0.2.0`);
  if (paperIds.has(review.id)) errors.push(`试卷复盘编号重复：${review.id}`);
  paperIds.add(review.id);
  const raw = review.scores?.raw;
  const standard = review.scores?.standard;
  if (!raw || !standard) errors.push(`${review.id} 必须分开记录卷面原始分和标准分`);
  if (raw && raw.objective.earned + raw.subjective.earned !== raw.earned) {
    errors.push(`${review.id} 卷面分项与总分不一致`);
  }
  const reviewedQuestion = review.reviewed_question;
  if (reviewedQuestion) {
    const earned = reviewedQuestion.subquestions.reduce((sum, item) => sum + item.earned_points, 0);
    const max = reviewedQuestion.subquestions.reduce((sum, item) => sum + item.max_points, 0);
    if (earned !== reviewedQuestion.earned_points || max !== reviewedQuestion.max_points) {
      errors.push(`${review.id} ${reviewedQuestion.id} 小问分数与总分不一致`);
    }
  }
}

const retestIds = new Set();
for (const retest of retests) {
  if (!["0.2.0", "0.3.0"].includes(retest.schema_version)) errors.push(`${retest.id || "未知复测"} schema_version 不受支持`);
  if (retestIds.has(retest.id)) errors.push(`复测编号重复：${retest.id}`);
  retestIds.add(retest.id);
  if (retest.schema_version === "0.2.0" && !paperIds.has(retest.source_paper_review_id)) errors.push(`${retest.id} 引用了不存在的试卷复盘`);
  if (retest.schema_version === "0.3.0" && !topicIds.has(retest.source_topic_id)) errors.push(`${retest.id} 引用了不存在的主题`);
  const rubricIds = new Set();
  let maxPoints = 0;
  for (const question of retest.questions || []) {
    const rubricTotal = question.rubric_points.reduce((sum, point) => sum + point.points, 0);
    if (rubricTotal !== question.max_points) errors.push(`${retest.id} ${question.id} 评分点分值与小问满分不一致`);
    maxPoints += question.max_points;
    for (const point of question.rubric_points) {
      if (rubricIds.has(point.id)) errors.push(`${retest.id} 评分点编号重复：${point.id}`);
      rubricIds.add(point.id);
    }
  }
  if (retest.pass_rule.min_points > maxPoints) errors.push(`${retest.id} 通过分数超过总分`);
  for (const requiredId of retest.pass_rule.required_rubric_ids) {
    if (!rubricIds.has(requiredId)) errors.push(`${retest.id} 引用了不存在的必须评分点：${requiredId}`);
  }
}

if (timeLab?.schema_version !== "0.4.0") errors.push("time_lab.json schema_version 必须为 0.4.0");
if (timeLab && !topicIds.has(timeLab.topic_id)) errors.push("time_lab.json 引用了不存在的主题");
const placeIds = new Set();
const placeLongitudes = new Set();
for (const place of timeLab?.places || []) {
  if (placeIds.has(place.id)) errors.push(`时区实验地点编号重复：${place.id}`);
  placeIds.add(place.id);
  if (!place.name?.trim()) errors.push(`${place.id || "未知地点"} 缺少地点名称`);
  if (!Number.isInteger(place.longitude) || Math.abs(place.longitude) > 175) {
    errors.push(`${place.id} longitude 必须是-175至175的整数`);
  }
  if (!Number.isInteger(place.latitude) || Math.abs(place.latitude) > 90) {
    errors.push(`${place.id} latitude 必须是-90至90的整数`);
  }
  if (placeLongitudes.has(place.longitude)) errors.push(`时区实验地点经度重复：${place.longitude}`);
  placeLongitudes.add(place.longitude);
}
const scenarioIds = new Set();
for (const scenario of timeLab?.scenarios || []) {
  if (scenarioIds.has(scenario.id)) errors.push(`时区实验场景编号重复：${scenario.id}`);
  scenarioIds.add(scenario.id);
  if (!Number.isInteger(scenario.utc_minutes) || scenario.utc_minutes < 0 || scenario.utc_minutes >= 1440) {
    errors.push(`${scenario.id} utc_minutes 必须是0至1439的整数`);
  }
  if (!Number.isInteger(scenario.starting_longitude) || Math.abs(scenario.starting_longitude) > 175) {
    errors.push(`${scenario.id} starting_longitude 必须是-175至175的整数`);
  }
  if (!placeLongitudes.has(scenario.starting_longitude)) {
    errors.push(`${scenario.id} starting_longitude 没有对应的城市或地点`);
  }
}

const calculationChecks = [
  {scenario: "TIME-LAB-02", longitude: 116, local: "11:44", zone: "12:00", date: "同一天"},
  {scenario: "TIME-LAB-03", longitude: 150, local: "04:30", zone: "04:30", date: "后一天"},
  {scenario: "TIME-LAB-04", longitude: -90, local: "21:20", zone: "21:20", date: "前一天"},
  {scenario: "TIME-LAB-08", longitude: -165, local: "13:20", zone: "13:20", date: "前一天"}
];
for (const check of calculationChecks) {
  const scenario = timeLab?.scenarios?.find((item) => item.id === check.scenario);
  if (!scenario) { errors.push(`缺少计算校验场景：${check.scenario}`); continue; }
  const result = calculateTimeLabAnswers(scenario, check.longitude);
  if (result.local_time !== check.local || result.zone_time !== check.zone || result.date_relation !== check.date) {
    errors.push(`${check.scenario} 时间联动计算不符合预期`);
  }
}
if (normalizeTimeAnswer("9:00") !== "09:00" || normalizeTimeAnswer("2400") !== "") {
  errors.push("时区实验时间输入规范化失败");
}

if (earthMotionLab?.schema_version !== "0.5.0") errors.push("earth_motion_lab.json schema_version 必须为0.5.0");
if (earthMotionLab && !topicIds.has(earthMotionLab.topic_id)) errors.push("earth_motion_lab.json 引用了不存在的主题");
if (!Number.isInteger(earthMotionLab?.review_after_hours) || earthMotionLab.review_after_hours < 24) {
  errors.push("earth_motion_lab.json review_after_hours 至少为24小时");
}
const expectedMotionAnswers = new Map([
  ["north-upper", ["逆时针", "进入黑夜", "昏线"]],
  ["north-lower", ["逆时针", "进入白昼", "晨线"]],
  ["south-upper", ["顺时针", "进入白昼", "晨线"]],
  ["south-lower", ["顺时针", "进入黑夜", "昏线"]],
  ["equator-visible", ["自西向东", "进入白昼", "晨线"]]
]);
const motionScenarioIds = new Set();
for (const view of earthMotionLab?.views || []) {
  if (!view.id || !view.name || !view.rotation_answer || view.sun_facing_side !== "右半球") {
    errors.push(`晨昏线视角数据不完整：${view.id || "未知视角"}`);
  }
  for (const point of view.points || []) {
    const scenarioId = `${view.id}-${point.id}`;
    if (motionScenarioIds.has(scenarioId)) errors.push(`晨昏线场景编号重复：${scenarioId}`);
    motionScenarioIds.add(scenarioId);
    const expected = expectedMotionAnswers.get(scenarioId);
    if (!expected) {
      errors.push(`晨昏线场景未登记：${scenarioId}`);
      continue;
    }
    if (view.rotation_answer !== expected[0] || point.transition_answer !== expected[1] || point.boundary_answer !== expected[2]) {
      errors.push(`${scenarioId} 的自转、昼夜变化或晨昏线答案不符合模型`);
    }
    if (!point.explanation?.trim()) errors.push(`${scenarioId} 缺少可追溯解释`);
  }
}
for (const scenarioId of expectedMotionAnswers.keys()) {
  if (!motionScenarioIds.has(scenarioId)) errors.push(`缺少晨昏线场景：${scenarioId}`);
}
for (const tag of ["E-SUN-SIDE", "E-VIEW-ROTATION", "E-TERM-TRANSITION", "E-TERM-NAME"]) {
  if (!earthMotionLab?.error_tags?.[tag]) errors.push(`earth_motion_lab.json 缺少错误标签：${tag}`);
}

if (solarSeasonLab && !topicIds.has(solarSeasonLab.topic_id)) errors.push("solar_season_lab.json 引用了不存在的主题");
if (!Number.isInteger(solarSeasonLab?.review_after_hours) || solarSeasonLab.review_after_hours < 24) errors.push("solar_season_lab.json review_after_hours 至少为24小时");
const solarFeature = globalThis.OrangeCoach?.features?.solarSeason;
if (!solarFeature) {
  errors.push("太阳季节实验功能未成功注册");
} else {
  const solarDates = new Map((solarSeasonLab.dates || []).map((item) => [item.id, item]));
  const solarPlaces = new Map((solarSeasonLab.places || []).map((item) => [item.id, item]));
  const solarChecks = [
    ["march-equinox", "beijing", "赤道", "昼夜等长", "各纬度近似等长", 50],
    ["june-solstice", "beijing", "北回归线", "昼长夜短", "由南向北递增", 73.5],
    ["june-solstice", "antarctic-circle", "北回归线", "极夜", "由南向北递增", 0],
    ["december-solstice", "arctic-circle", "南回归线", "极夜", "由南向北递减", 0],
    ["december-solstice", "antarctic-circle", "南回归线", "极昼", "由南向北递减", 47]
  ];
  for (const [dateId, placeId, direct, dayRelation, pattern, altitude] of solarChecks) {
    const date = solarDates.get(dateId);
    const place = solarPlaces.get(placeId);
    if (!date || !place) { errors.push(`缺少太阳季节校验情境：${dateId}-${placeId}`); continue; }
    const result = solarFeature.calculate(date, place);
    if (result.direct !== direct || result.day_relation !== dayRelation || result.north_pattern !== pattern || result.noon_altitude !== altitude) {
      errors.push(`${dateId}-${placeId} 的直射点、昼长或太阳高度计算错误`);
    }
  }
}
for (const tag of ["S-DATE-DIRECT", "S-HEMISPHERE-DAY", "S-POLAR-RULE", "S-LATITUDE-PATTERN", "S-NOON-ALTITUDE"]) {
  if (!solarSeasonLab?.error_tags?.[tag]) errors.push(`solar_season_lab.json 缺少错误标签：${tag}`);
}

if (solarPathLab && !topicIds.has(solarPathLab.topic_id)) errors.push("solar_path_lab.json 引用了不存在的主题");
if (!Number.isInteger(solarPathLab?.review_after_hours) || solarPathLab.review_after_hours < 24) errors.push("solar_path_lab.json review_after_hours 至少为24小时");
const solarPathPlaceIds = new Set();
for (const place of solarPathLab?.places || []) {
  if (solarPathPlaceIds.has(place.id)) errors.push(`太阳视运动地点编号重复：${place.id}`);
  solarPathPlaceIds.add(place.id);
  if (!Number.isFinite(place.latitude) || Math.abs(place.latitude) >= 66.5) errors.push(`${place.id} 必须位于非极昼极夜校验范围内`);
}
const solarPathFeature = globalThis.OrangeCoach?.features?.solarPath;
if (!solarPathFeature) {
  errors.push("太阳视运动实验功能未成功注册");
} else {
  const pathDates = new Map((solarPathLab.dates || []).map((item) => [item.id, item]));
  const pathPlaces = new Map((solarPathLab.places || []).map((item) => [item.id, item]));
  const pathChecks = [
    ["march-equinox", "equator", "正东", "头顶", "正西", "几乎没有", 90],
    ["june-solstice", "guangzhou", "东北", "正北", "西北", "正南", 89.5],
    ["june-solstice", "beijing", "东北", "正南", "西北", "正北", 73.5],
    ["june-solstice", "sydney", "东北", "正北", "西北", "正南", 32.5],
    ["december-solstice", "sydney", "东南", "正北", "西南", "正南", 79.5],
    ["december-solstice", "equator", "东南", "正南", "西南", "正北", 66.5]
  ];
  for (const [dateId, placeId, sunrise, noonSun, sunset, noonShadow, altitude] of pathChecks) {
    const date = pathDates.get(dateId);
    const place = pathPlaces.get(placeId);
    if (!date || !place) { errors.push(`缺少太阳视运动校验情境：${dateId}-${placeId}`); continue; }
    const result = solarPathFeature.calculate(date, place);
    if (result.sunrise !== sunrise || result.noon_sun !== noonSun || result.sunset !== sunset || result.noon_shadow !== noonShadow || result.noon_altitude !== altitude) {
      errors.push(`${dateId}-${placeId} 的日出日落、正午太阳或影子方向错误`);
    }
    const noonPoint = solarPathFeature.pathPoint(result, 0.5);
    if (Math.abs(noonPoint.altitude - altitude) > 0.01 || !Number.isFinite(noonPoint.x) || !Number.isFinite(noonPoint.y)) {
      errors.push(`${dateId}-${placeId} 的天空轨迹坐标错误`);
    }
  }
}
for (const tag of ["P-DATE-RISESET", "P-NOON-LATITUDE", "P-SHADOW-OPPOSITE", "P-OVERHEAD-SHADOW"]) {
  if (!solarPathLab?.error_tags?.[tag]) errors.push(`solar_path_lab.json 缺少错误标签：${tag}`);
}

if (annualSunLab && !topicIds.has(annualSunLab.topic_id)) errors.push("annual_sun_lab.json 引用了不存在的主题");
if (!Number.isInteger(annualSunLab?.review_after_hours) || annualSunLab.review_after_hours < 24) errors.push("annual_sun_lab.json review_after_hours 至少为24小时");
const annualPhases = new Set();
for (const checkpoint of annualSunLab?.checkpoints || []) {
  if (annualPhases.has(checkpoint.phase)) errors.push(`周年观察位置重复：${checkpoint.phase}`);
  annualPhases.add(checkpoint.phase);
  if (!Number.isFinite(checkpoint.phase) || checkpoint.phase < 0 || checkpoint.phase >= 1) errors.push(`${checkpoint.id} phase 必须在0到1之间`);
}
for (const place of annualSunLab?.places || []) {
  if (!Number.isFinite(place.latitude) || Math.abs(place.latitude) <= 23.5 || Math.abs(place.latitude) >= 66.5) errors.push(`${place.id} 应位于回归线与极圈之间，以保证趋势规则稳定`);
}
const annualFeature = globalThis.OrangeCoach?.features?.annualSun;
if (!annualFeature) {
  errors.push("周年回归实验功能未成功注册");
} else {
  const annualCheckpoints = new Map((annualSunLab.checkpoints || []).map((item) => [item.id, item]));
  const annualPlaces = new Map((annualSunLab.places || []).map((item) => [item.id, item]));
  const annualChecks = [
    ["march-equinox", "beijing", 0, "向北移动", "正在变长", "正在升高", 50],
    ["early-may", "beijing", 16.6, "向北移动", "正在变长", "正在升高", 66.6],
    ["june-solstice", "beijing", 23.5, "北界折返向南", "达到最长后转短", "达到最高后降低", 73.5],
    ["early-august", "beijing", 16.6, "向南移动", "正在变短", "正在降低", 66.6],
    ["september-equinox", "sydney", 0, "向南移动", "正在变短", "正在升高", 56],
    ["early-november", "sydney", -16.6, "向南移动", "正在变短", "正在升高", 72.6],
    ["december-solstice", "sydney", -23.5, "南界折返向北", "达到最短后转长", "达到最高后降低", 79.5],
    ["early-february", "sydney", -16.6, "向北移动", "正在变长", "正在降低", 72.6]
  ];
  for (const [checkpointId, placeId, latitude, migration, dayTrend, altitudeTrend, altitude] of annualChecks) {
    const checkpoint = annualCheckpoints.get(checkpointId);
    const place = annualPlaces.get(placeId);
    if (!checkpoint || !place) { errors.push(`缺少周年回归校验情境：${checkpointId}-${placeId}`); continue; }
    const result = annualFeature.calculate(checkpoint, place);
    if (result.direct_latitude !== latitude || result.migration !== migration || result.north_day_trend !== dayTrend || result.altitude_trend !== altitudeTrend || result.noon_altitude !== altitude) {
      errors.push(`${checkpointId}-${placeId} 的直射纬度、移动方向或趋势错误`);
    }
  }
}
for (const tag of ["A-DATE-LATITUDE", "A-MIGRATION-DIRECTION", "A-SOLSTICE-TURN", "A-DAY-TREND", "A-ALTITUDE-TREND"]) {
  if (!annualSunLab?.error_tags?.[tag]) errors.push(`annual_sun_lab.json 缺少错误标签：${tag}`);
}

if (orbitSpeedLab && !topicIds.has(orbitSpeedLab.topic_id)) errors.push("orbit_speed_lab.json 引用了不存在的主题");
if (!Number.isInteger(orbitSpeedLab?.review_after_hours) || orbitSpeedLab.review_after_hours < 24) errors.push("orbit_speed_lab.json review_after_hours 至少为24小时");
if (orbitSpeedLab?.facts?.perihelion_distance_million_km !== 147.1 || orbitSpeedLab?.facts?.aphelion_distance_million_km !== 152.1) errors.push("公转实验近日点、远日点距离必须使用147.1与152.1百万千米近似值");
if (orbitSpeedLab?.facts?.max_speed_km_s !== 30.29 || orbitSpeedLab?.facts?.min_speed_km_s !== 29.29) errors.push("公转实验最大、最小速度必须使用30.29与29.29 km/s近似值");
if (!(orbitSpeedLab?.facts?.north_spring_summer_days > orbitSpeedLab?.facts?.north_autumn_winter_days)) errors.push("公转实验必须体现北半球春夏半年略长于秋冬半年");
if (!Array.isArray(orbitSpeedLab?.sources) || orbitSpeedLab.sources.length < 2 || orbitSpeedLab.sources.some((source) => !/^https:\/\/(science\.nasa\.gov|www\.nesdis\.noaa\.gov)\//.test(source.url))) errors.push("公转实验必须记录NASA或NOAA可追溯来源");
const orbitCheckpointIds = new Set((orbitSpeedLab?.checkpoints || []).map((item) => item.id));
const orbitHemisphereIds = new Set((orbitSpeedLab?.hemispheres || []).map((item) => item.id));
const orbitScenarioIds = new Set();
for (const scenario of orbitSpeedLab?.scenarios || []) {
  const scenarioId = `${scenario.checkpoint_id}-${scenario.hemisphere_id}`;
  if (orbitScenarioIds.has(scenarioId)) errors.push(`公转轨道场景重复：${scenarioId}`);
  orbitScenarioIds.add(scenarioId);
  if (!orbitCheckpointIds.has(scenario.checkpoint_id) || !orbitHemisphereIds.has(scenario.hemisphere_id)) errors.push(`公转轨道场景引用不存在：${scenarioId}`);
}
if (orbitScenarioIds.size !== orbitCheckpointIds.size * orbitHemisphereIds.size) errors.push("公转轨道实验必须覆盖4个位置与南北半球的8种组合");
const orbitFeature = globalThis.OrangeCoach?.features?.orbitSpeed;
if (!orbitFeature) {
  errors.push("公转轨道与速度实验功能未成功注册");
} else {
  const orbitCheckpoints = new Map((orbitSpeedLab.checkpoints || []).map((item) => [item.id, item]));
  const orbitHemispheres = new Map((orbitSpeedLab.hemispheres || []).map((item) => [item.id, item]));
  const orbitChecks = [
    ["early-january", "north", "近日点（最近）", "最快，随后减速", "冬季", 147.1, 30.29],
    ["early-january", "south", "近日点（最近）", "最快，随后减速", "夏季", 147.1, 30.29],
    ["early-april", "north", "由近变远", "正在减速", "春季", 149.6, 29.78],
    ["early-july", "north", "远日点（最远）", "最慢，随后加速", "夏季", 152.1, 29.29],
    ["early-july", "south", "远日点（最远）", "最慢，随后加速", "冬季", 152.1, 29.29],
    ["early-october", "south", "由远变近", "正在加速", "春季", 149.6, 29.78]
  ];
  for (const [checkpointId, hemisphereId, distanceState, speedState, season, distance, speed] of orbitChecks) {
    const checkpoint = orbitCheckpoints.get(checkpointId);
    const hemisphere = orbitHemispheres.get(hemisphereId);
    if (!checkpoint || !hemisphere) { errors.push(`缺少公转轨道校验情境：${checkpointId}-${hemisphereId}`); continue; }
    const result = orbitFeature.calculate(checkpoint, hemisphere, orbitSpeedLab.facts);
    if (result.distance_state !== distanceState || result.speed_state !== speedState || result.season !== season || result.distance_million_km !== distance || result.speed_km_s !== speed || result.season_cause !== orbitSpeedLab.facts.season_cause) {
      errors.push(`${checkpointId}-${hemisphereId} 的轨道远近、速度、季节或成因错误`);
    }
  }
  const perihelion = orbitFeature.calculateFromPhase(0, orbitSpeedLab.facts);
  const aphelion = orbitFeature.calculateFromPhase(0.5, orbitSpeedLab.facts);
  if (perihelion.distance_million_km !== 147.1 || perihelion.speed_km_s !== 30.29 || aphelion.distance_million_km !== 152.1 || aphelion.speed_km_s !== 29.29) errors.push("公转周年滑轨在近日点或远日点的数值错误");
  const perihelionTrail = orbitFeature.trailPoints(0).split(" ");
  const aphelionTrail = orbitFeature.trailPoints(0.5).split(" ");
  const trailLength = (points) => points.slice(1).reduce((sum, point, index) => {
    const [x1, y1] = points[index].split(",").map(Number);
    const [x2, y2] = point.split(",").map(Number);
    return sum + Math.hypot(x2 - x1, y2 - y1);
  }, 0);
  if (!(trailLength(perihelionTrail) > trailLength(aphelionTrail))) errors.push("公转轨迹没有体现相同30天近日点附近弧长更长");
}
for (const tag of ["O-DISTANCE-POSITION", "O-SPEED-DISTANCE", "O-HEMISPHERE-SEASON", "O-SEASON-DISTANCE", "O-SEASON-CAUSE"]) {
  if (!orbitSpeedLab?.error_tags?.[tag]) errors.push(`orbit_speed_lab.json 缺少错误标签：${tag}`);
}

if (terminatorLinkLab && !topicIds.has(terminatorLinkLab.topic_id)) errors.push("terminator_link_lab.json 引用了不存在的主题");
if (!Number.isInteger(terminatorLinkLab?.review_after_hours) || terminatorLinkLab.review_after_hours < 24) errors.push("terminator_link_lab.json review_after_hours 至少为24小时");
if (!Number.isInteger(terminatorLinkLab?.status_line_tolerance_minutes) || terminatorLinkLab.status_line_tolerance_minutes > 15) errors.push("晨昏线状态判定容差必须是不超过15分钟的整数");
const linkDates = new Map((terminatorLinkLab?.dates || []).map((item) => [item.id, item]));
const linkPlaces = new Map((terminatorLinkLab?.places || []).map((item) => [item.id, item]));
const linkScenarioIds = new Set();
for (const scenario of terminatorLinkLab?.scenarios || []) {
  if (linkScenarioIds.has(scenario.id)) errors.push(`晨昏线综合场景编号重复：${scenario.id}`);
  linkScenarioIds.add(scenario.id);
  if (!linkDates.has(scenario.date_id) || !linkPlaces.has(scenario.place_id)) errors.push(`晨昏线综合场景引用不存在：${scenario.id}`);
}
const linkFeature = globalThis.OrangeCoach?.features?.terminatorLink;
const linkStatuses = new Set();
const linkPolarPatterns = new Set();
if (!linkFeature) {
  errors.push("晨昏线综合联动实验功能未成功注册");
} else {
  const expected = [
    ["TL-01", -150, "06:00", 12, "晨线", "两极圈内均无极昼极夜"],
    ["TL-02", 60, "18:00", 12, "昏线", "两极圈内均无极昼极夜"],
    ["TL-03", -128.5, "04:34", 15, "晨线", "北极圈及其以北极昼、南极圈及其以南极夜"],
    ["TL-04", 77, "16:52", 9.5, "昏线", "北极圈及其以北极昼、南极圈及其以南极夜"],
    ["TL-05", -160, "00:00", 24, "白昼区", "北极圈及其以北极昼、南极圈及其以南极夜"],
    ["TL-06", -60, "00:00", 9, "黑夜区", "北极圈及其以北极夜、南极圈及其以南极昼"],
    ["TL-07", 150, "12:00", 14.5, "白昼区", "北极圈及其以北极夜、南极圈及其以南极昼"],
    ["TL-08", 180, "00:00", 24, "白昼区", "北极圈及其以北极夜、南极圈及其以南极昼"]
  ];
  const scenariosById = new Map(terminatorLinkLab.scenarios.map((item) => [item.id, item]));
  for (const [scenarioId, longitude, localTime, dayLength, status, polar] of expected) {
    const scenario = scenariosById.get(scenarioId);
    if (!scenario) { errors.push(`缺少晨昏线综合校验情境：${scenarioId}`); continue; }
    const result = linkFeature.calculate(linkDates.get(scenario.date_id), linkPlaces.get(scenario.place_id), scenario.utc_minutes, terminatorLinkLab.status_line_tolerance_minutes);
    linkStatuses.add(result.status);
    linkPolarPatterns.add(result.polar_pattern);
    if (result.direct_longitude !== longitude || result.local_time !== localTime || result.day_length_hours !== dayLength || result.status !== status || result.polar_pattern !== polar) errors.push(`${scenarioId} 的直射经线、地方时、昼长、晨昏状态或极昼极夜错误`);
  }
  if (linkFeature.dayLengthHours(0, 23.5) !== 12) errors.push("赤道昼长应全年为12小时");
}
for (const status of ["白昼区", "黑夜区", "晨线", "昏线"]) if (!linkStatuses.has(status)) errors.push(`晨昏线综合实验缺少状态：${status}`);
if (linkPolarPatterns.size !== 3) errors.push("晨昏线综合实验必须覆盖二分日和南北半球两种极昼极夜格局");
for (const tag of ["L-DIRECT-MERIDIAN", "L-LOCAL-TIME", "L-DAY-LENGTH", "L-TERMINATOR-STATUS", "L-POLAR-RANGE"]) {
  if (!terminatorLinkLab?.error_tags?.[tag]) errors.push(`terminator_link_lab.json 缺少错误标签：${tag}`);
}

if (rotationSpeedLab && !topicIds.has(rotationSpeedLab.topic_id)) errors.push("rotation_speed_lab.json 引用了不存在的主题");
if (rotationSpeedLab?.facts?.rotation_hours !== 24 || rotationSpeedLab?.facts?.angular_speed_deg_h !== 15) errors.push("自转速度实验必须使用24小时与15°/小时高中理想模型");
const rotationPlaces = new Map((rotationSpeedLab?.places || []).map((item) => [item.id, item]));
const rotationScenarioIds = new Set();
const rotationFeature = globalThis.OrangeCoach?.features?.rotationSpeed;
const rotationExpected = [
  ["RS-01", 1670, 90, 10000, "与赤道相同"], ["RS-02", 1530, 60, 6150, "小于赤道"],
  ["RS-03", 1380, 30, 2750, "小于赤道"], ["RS-04", 1280, 120, 10250, "小于赤道"],
  ["RS-05", 1100, 90, 6550, "小于赤道"], ["RS-06", 980, 120, 7850, "小于赤道"],
  ["RS-07", 730, 60, 2950, "小于赤道"], ["RS-08", 570, 90, 3450, "小于赤道"]
];
const rotationScenarios = new Map((rotationSpeedLab?.scenarios || []).map((item) => [item.id, item]));
for (const scenario of rotationSpeedLab?.scenarios || []) {
  if (rotationScenarioIds.has(scenario.id)) errors.push(`自转速度场景编号重复：${scenario.id}`);
  rotationScenarioIds.add(scenario.id);
  if (!rotationPlaces.has(scenario.place_id)) errors.push(`自转速度场景引用不存在：${scenario.id}`);
}
if (!rotationFeature) {
  errors.push("地球自转速度实验功能未成功注册");
} else {
  for (const [scenarioId, speed, angle, distance, relation] of rotationExpected) {
    const scenario = rotationScenarios.get(scenarioId);
    const place = rotationPlaces.get(scenario?.place_id);
    if (!scenario || !place) { errors.push(`缺少自转速度校验情境：${scenarioId}`); continue; }
    const result = rotationFeature.calculate(place, scenario.duration_hours, rotationSpeedLab.facts);
    if (result.angular_speed_value !== 15 || result.line_speed_km_h !== speed || result.rotated_angle_deg !== angle || result.distance_km !== distance || result.line_speed_relation !== relation) errors.push(`${scenarioId} 的角速度、线速度、转角或运动距离错误`);
  }
  if (!(rotationFeature.calculate(rotationPlaces.get("quito"), 6, rotationSpeedLab.facts).line_speed_km_h > rotationFeature.calculate(rotationPlaces.get("tromso"), 6, rotationSpeedLab.facts).line_speed_km_h)) errors.push("自转线速度没有体现纬度越高越小");
}
for (const tag of ["R-ANGULAR-SAME", "R-LATITUDE-CIRCLE", "R-LINE-SPEED", "R-ANGLE-TIME", "R-DISTANCE-SPEED"]) if (!rotationSpeedLab?.error_tags?.[tag]) errors.push(`rotation_speed_lab.json 缺少错误标签：${tag}`);

if (dateRangeLab && !topicIds.has(dateRangeLab.topic_id)) errors.push("date_range_lab.json 引用了不存在的主题");
if (!Number.isInteger(dateRangeLab?.review_after_hours) || dateRangeLab.review_after_hours < 24) errors.push("date_range_lab.json review_after_hours 至少为24小时");
const dateRangeFeature = globalThis.OrangeCoach?.features?.dateRange;
const dateRangeScenarioIds = new Set();
const dateRangeExpected = [
  ["DR-01", 0, 50, 50, "全球同时存在两个日期", "日期减一天"],
  ["DR-02", -45, 62.5, 37.5, "全球同时存在两个日期", "日期加一天"],
  ["DR-03", -90, 75, 25, "全球同时存在两个日期", "日期减一天"],
  ["DR-04", -135, 87.5, 12.5, "全球同时存在两个日期", "日期加一天"],
  ["DR-05", -180, 100, 0, "全球同属一个日期", "日期减一天"],
  ["DR-06", 135, 12.5, 87.5, "全球同时存在两个日期", "日期加一天"],
  ["DR-07", 90, 25, 75, "全球同时存在两个日期", "日期减一天"],
  ["DR-08", 45, 37.5, 62.5, "全球同时存在两个日期", "日期加一天"]
];
for (const scenario of dateRangeLab?.scenarios || []) {
  if (dateRangeScenarioIds.has(scenario.id)) errors.push(`全球日期场景编号重复：${scenario.id}`);
  dateRangeScenarioIds.add(scenario.id);
}
if (!dateRangeFeature) {
  errors.push("全球日期范围实验功能未成功注册");
} else {
  const scenarios = new Map(dateRangeLab.scenarios.map((item) => [item.id, item]));
  for (const [scenarioId, zero, newer, older, count, crossing] of dateRangeExpected) {
    const scenario = scenarios.get(scenarioId);
    if (!scenario) { errors.push(`缺少全球日期校验情境：${scenarioId}`); continue; }
    const result = dateRangeFeature.calculate(scenario);
    if (result.zero_meridian !== zero || result.new_date_percent !== newer || result.old_date_percent !== older || result.date_count !== count || result.crossing_result !== crossing) {
      errors.push(`${scenarioId} 的0时经线、日期占比、日期数量或跨线方向错误`);
    }
  }
}
for (const tag of ["D-MIDNIGHT-MERIDIAN", "D-NEW-DATE-RANGE", "D-OLD-DATE-RANGE", "D-DATE-COUNT", "D-IDL-DIRECTION"]) {
  if (!dateRangeLab?.error_tags?.[tag]) errors.push(`date_range_lab.json 缺少错误标签：${tag}`);
}

if (axialTiltLab && !topicIds.has(axialTiltLab.topic_id)) errors.push("axial_tilt_lab.json 引用了不存在的主题");
if (!Number.isInteger(axialTiltLab?.review_after_hours) || axialTiltLab.review_after_hours < 24) errors.push("axial_tilt_lab.json review_after_hours 至少为24小时");
if (axialTiltLab?.facts?.current_tilt_deg !== 23.5 || axialTiltLab?.facts?.max_model_tilt_deg !== 45) errors.push("黄赤交角实验必须使用23.5°当前近似值和0°—45°反事实模型边界");
if (!axialTiltLab?.model_note?.includes("反事实") || !axialTiltLab?.model_note?.includes("90°−ε")) errors.push("黄赤交角实验必须明确反事实范围和极圈公式");
if (!Array.isArray(axialTiltLab?.sources) || axialTiltLab.sources.length < 2 || axialTiltLab.sources.some((source) => !/^https:\/\/science\.nasa\.gov\//.test(source.url))) errors.push("黄赤交角实验必须记录至少2条NASA可追溯来源");
const axialTiltFeature = globalThis.OrangeCoach?.features?.axialTilt;
const axialTiltScenarioIds = new Set();
const axialTiltExpected = [
  ["AT-01", 0, 90, 0, 0, 90, "热带、寒带变窄，温带变宽"],
  ["AT-02", 10, 80, 20, 10, 70, "热带、寒带变窄，温带变宽"],
  ["AT-03", 15, 75, 30, 15, 60, "热带、寒带变窄，温带变宽"],
  ["AT-04", 20, 70, 40, 20, 50, "热带、寒带变窄，温带变宽"],
  ["AT-05", 23.5, 66.5, 47, 23.5, 43, "五带范围不变"],
  ["AT-06", 30, 60, 60, 30, 30, "热带、寒带变宽，温带变窄"],
  ["AT-07", 35, 55, 70, 35, 20, "热带、寒带变宽，温带变窄"],
  ["AT-08", 45, 45, 90, 45, 0, "热带、寒带变宽，温带变窄"]
];
for (const scenario of axialTiltLab?.scenarios || []) {
  if (axialTiltScenarioIds.has(scenario.id)) errors.push(`黄赤交角场景编号重复：${scenario.id}`);
  axialTiltScenarioIds.add(scenario.id);
}
if (!axialTiltFeature) {
  errors.push("黄赤交角与五带实验功能未成功注册");
} else {
  const scenarios = new Map(axialTiltLab.scenarios.map((scenario) => [scenario.id, scenario]));
  for (const [scenarioId, tropic, polarCircle, tropicalWidth, polarWidth, temperateWidth, zoneChange] of axialTiltExpected) {
    const scenario = scenarios.get(scenarioId);
    if (!scenario) { errors.push(`缺少黄赤交角校验情境：${scenarioId}`); continue; }
    const result = axialTiltFeature.calculate(scenario, scenario.target_tilt_deg, axialTiltLab.facts);
    if (result.tropic_latitude !== tropic || result.polar_circle_latitude !== polarCircle || result.tropical_width !== tropicalWidth || result.polar_width_each !== polarWidth || result.temperate_width_each !== temperateWidth || result.zone_change !== zoneChange) {
      errors.push(`${scenarioId} 的回归线、极圈或五带宽度计算错误`);
    }
  }
}
for (const tag of ["X-TROPIC-LATITUDE", "X-POLAR-CIRCLE", "X-TROPICAL-WIDTH", "X-TEMPERATE-WIDTH", "X-ZONE-CHANGE"]) {
  if (!axialTiltLab?.error_tags?.[tag]) errors.push(`axial_tilt_lab.json 缺少错误标签：${tag}`);
}

if (celestialScaleLab && !topicIds.has(celestialScaleLab.topic_id)) errors.push("celestial_scale_lab.json 引用了不存在的主题");
if (!Number.isInteger(celestialScaleLab?.review_after_hours) || celestialScaleLab.review_after_hours < 48) errors.push("celestial_scale_lab.json review_after_hours 至少为48小时");
if (!celestialScaleLab?.model_note?.includes("不按真实比例") || !celestialScaleLab.model_note.includes("总星系") || !celestialScaleLab.model_note.includes("可观测宇宙")) errors.push("天体系统实验必须说明非等比例模型、教材称谓和可观测宇宙边界");
if (!Array.isArray(celestialScaleLab?.sources) || celestialScaleLab.sources.length < 4 || celestialScaleLab.sources.some((source) => !/^https:\/\/science\.nasa\.gov\//.test(source.url))) errors.push("天体系统实验必须记录至少4条NASA可追溯来源");
const celestialScaleFeature = globalThis.OrangeCoach?.features?.celestialScale;
const celestialLevelIds = new Set();
const celestialOrders = new Set();
for (const level of celestialScaleLab?.levels || []) {
  if (celestialLevelIds.has(level.id)) errors.push(`天体系统层级编号重复：${level.id}`);
  celestialLevelIds.add(level.id);
  if (celestialOrders.has(level.order)) errors.push(`天体系统层级顺序重复：${level.order}`);
  celestialOrders.add(level.order);
  if (!level.location?.trim() || !level.scale_anchor?.trim() || !level.unit?.trim() || !level.object_note?.trim()) errors.push(`${level.id} 缺少位置、尺度、单位或辨析说明`);
}
const requiredCelestialLevels = ["earth-moon", "solar-system", "milky-way", "observable-universe"];
if (requiredCelestialLevels.some((id) => !celestialLevelIds.has(id)) || celestialScaleLab?.levels?.length !== 4) errors.push("天体系统实验必须包含地月系、太阳系、银河系和可观测宇宙四级");
const celestialScenarioIds = new Set();
const celestialScenarioCounts = new Map();
for (const scenario of celestialScaleLab?.scenarios || []) {
  if (celestialScenarioIds.has(scenario.id)) errors.push(`天体系统尺度场景编号重复：${scenario.id}`);
  celestialScenarioIds.add(scenario.id);
  if (!celestialLevelIds.has(scenario.target_level_id)) errors.push(`${scenario.id} 引用了不存在的目标层级`);
  celestialScenarioCounts.set(scenario.target_level_id, (celestialScenarioCounts.get(scenario.target_level_id) || 0) + 1);
}
if (requiredCelestialLevels.some((id) => celestialScenarioCounts.get(id) !== 2)) errors.push("8个天体系统情境必须让四个层级各出现2次");
const celestialAnswerKeys = ["system_order", "moon_distance", "earth_sun_unit", "galactic_location", "diagram_rule"];
for (const key of celestialAnswerKeys) {
  if (!celestialScaleLab?.choices?.[key]?.includes(celestialScaleLab?.answers?.[key])) errors.push(`天体系统实验正确答案未登记到选项：${key}`);
}
if (!celestialScaleFeature) {
  errors.push("天体系统尺度实验功能未成功注册");
} else {
  const result = celestialScaleFeature.calculate(celestialScaleLab);
  if (celestialAnswerKeys.some((key) => result[key] !== celestialScaleLab.answers[key])) errors.push("天体系统尺度答案计算与数据不一致");
  if (celestialScaleFeature.getLevel(celestialScaleLab, "milky-way")?.unit !== "光年 ly") errors.push("银河系层级必须使用光年尺度锚点");
  const lockedHtml = celestialScaleFeature.renderLab({ lab: celestialScaleLab, scenario: celestialScaleLab.scenarios[0], scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!lockedSvg.includes("第1级") || requiredCelestialLevels.some((id) => lockedSvg.includes(celestialScaleFeature.getLevel(celestialScaleLab, id)?.name))) errors.push("天体系统锁定图不得在提交前泄露四级名称和顺序");
}
for (const tag of ["C-SYSTEM-ORDER", "C-MOON-SCALE", "C-AU-SCALE", "C-GALACTIC-LOCATION", "C-DIAGRAM-SCALE"]) {
  if (!celestialScaleLab?.error_tags?.[tag]) errors.push(`celestial_scale_lab.json 缺少错误标签：${tag}`);
}

const learningExport = globalThis.OrangeCoach?.features?.learningExport;
if (!learningExport) {
  errors.push("可批注学习档案功能未成功注册");
} else {
  const testNow = new Date("2026-08-10T13:14:15.123Z");
  const fixtureState = {
    version: "0.3.0",
    attempts: [{ id: "ATT-TEST", question_id: questions[0].id, is_correct: false, error_tag_candidate: "TEST-TAG", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    retestAttempts: [],
    timeLabAttempts: [],
    earthMotionAttempts: [],
    solarSeasonAttempts: [],
    solarPathAttempts: [{ id: "PATH-TEST", date_id: "march-equinox", place_id: "equator", score: 4, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    annualSunAttempts: [{ id: "ANNUAL-TEST", checkpoint_id: "early-may", place_id: "beijing", score: 4, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    orbitSpeedAttempts: [{ id: "ORBIT-TEST", checkpoint_id: "early-january", hemisphere_id: "north", score: 4, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    terminatorLinkAttempts: [{ id: "LINK-TEST", scenario_id: "TL-01", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    rotationSpeedAttempts: [{ id: "ROTATION-TEST", scenario_id: "RS-01", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    dateRangeAttempts: [{ id: "DATE-TEST", scenario_id: "DR-01", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    axialTiltAttempts: [{ id: "AXIAL-TEST", scenario_id: "AT-05", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    celestialScaleAttempts: [{ id: "CELESTIAL-TEST", scenario_id: "CS-01", target_level_id: "earth-moon", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    coachAnnotations: [{ id: "COACH-TEST", status: "候选" }]
  };
  const packet = learningExport.buildPacket({
    state: fixtureState,
    context: { topics, questions },
    now: testNow,
    config: globalThis.OrangeCoach.config
  });
  const filename = learningExport.exportFilename(testNow);
  if (packet.export_schema_version !== "0.15.0" || packet.exported_at !== testNow.toISOString()) errors.push("学习档案版本或导出时间戳错误");
  if (packet.summary.total_learning_records !== 9 || packet.summary.pending_parent_reviews !== 9) errors.push("学习档案摘要计数错误");
  if (packet.summary.by_project.length !== 13 || packet.summary.celestial_scale_attempts !== 1 || packet.summary.activity_window.first_recorded_at == null || !Array.isArray(packet.solar_season_attempts) || !Array.isArray(packet.solar_path_attempts) || !Array.isArray(packet.annual_sun_attempts) || !Array.isArray(packet.orbit_speed_attempts) || !Array.isArray(packet.terminator_link_attempts) || !Array.isArray(packet.rotation_speed_attempts) || !Array.isArray(packet.date_range_attempts) || !Array.isArray(packet.axial_tilt_attempts) || !Array.isArray(packet.celestial_scale_attempts)) errors.push("学习档案缺少项目进度、宇宙尺度记录或学习时间范围");
  if (packet.summary.candidate_error_tags[0]?.error_tag !== "TEST-TAG") errors.push("学习档案错因聚合错误");
  if (packet.coach_annotations[0]?.id !== "COACH-TEST" || !packet.annotation_guide?.expected_annotation_shape) errors.push("学习档案没有保留批注或批注规范");
  if (!/^orange-geography-records-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}[+-]\d{2}-\d{2}\.json$/.test(filename)) errors.push("学习档案文件名必须包含本地日期、时分秒和时区偏移");
  const merged = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, coachAnnotations: [...fixtureState.coachAnnotations, { id: "COACH-NEW" }] });
  if (!merged.ok || merged.added !== 1 || merged.coachAnnotations.length !== 2) errors.push("学习档案批注追加合并失败");
  const tampered = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, attempts: [{ ...fixtureState.attempts[0], is_correct: true }] });
  if (tampered.ok) errors.push("学习档案导入没有阻止原始证据被改写");
  const tamperedPath = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, solarPathAttempts: [{ ...fixtureState.solarPathAttempts[0], score: 3 }] });
  if (tamperedPath.ok) errors.push("学习档案导入没有保护太阳视运动原始证据");
  const tamperedAnnual = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, annualSunAttempts: [{ ...fixtureState.annualSunAttempts[0], score: 3 }] });
  if (tamperedAnnual.ok) errors.push("学习档案导入没有保护周年回归原始证据");
  const tamperedOrbit = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, orbitSpeedAttempts: [{ ...fixtureState.orbitSpeedAttempts[0], score: 3 }] });
  if (tamperedOrbit.ok) errors.push("学习档案导入没有保护公转轨道原始证据");
  const tamperedLink = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, terminatorLinkAttempts: [{ ...fixtureState.terminatorLinkAttempts[0], score: 4 }] });
  if (tamperedLink.ok) errors.push("学习档案导入没有保护晨昏线综合原始证据");
  const tamperedRotation = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, rotationSpeedAttempts: [{ ...fixtureState.rotationSpeedAttempts[0], score: 4 }] });
  if (tamperedRotation.ok) errors.push("学习档案导入没有保护自转速度原始证据");
  const tamperedDate = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, dateRangeAttempts: [{ ...fixtureState.dateRangeAttempts[0], score: 4 }] });
  if (tamperedDate.ok) errors.push("学习档案导入没有保护全球日期原始证据");
  const tamperedAxial = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, axialTiltAttempts: [{ ...fixtureState.axialTiltAttempts[0], score: 4 }] });
  if (tamperedAxial.ok) errors.push("学习档案导入没有保护黄赤交角原始证据");
  const tamperedCelestial = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, celestialScaleAttempts: [{ ...fixtureState.celestialScaleAttempts[0], score: 4 }] });
  if (tamperedCelestial.ok) errors.push("学习档案导入没有保护天体系统尺度原始证据");
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 内容校验通过：${topics.length} 个主题，${learningProjects.projects.length} 个学习项目，${questions.length} 道选择题，${timeLab.scenarios.length} 个时区实验场景，${motionScenarioIds.size} 个晨昏线场景，${solarSeasonLab.dates.length * solarSeasonLab.places.length} 个太阳季节组合，${solarPathLab.dates.length * solarPathLab.places.length} 个太阳视运动组合，${annualSunLab.checkpoints.length * annualSunLab.places.length} 个周年回归组合，${orbitScenarioIds.size} 个公转轨道组合，${linkScenarioIds.size} 个晨昏线综合情境，${rotationScenarioIds.size} 个自转速度情境，${dateRangeScenarioIds.size} 个全球日期情境，${axialTiltScenarioIds.size} 个黄赤交角情境，${celestialScenarioIds.size} 个天体系统尺度情境，${paperReviews.length} 份试卷复盘，${retests.length} 组复测，可批注档案通过校验`);
