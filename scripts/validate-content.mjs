import { access, readFile, stat } from "node:fs/promises";
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
await import("../assets/features/habitability.js");
await import("../assets/features/solar-activity.js");
await import("../assets/features/moon-phase.js");
await import("../assets/features/eclipse.js");
await import("../assets/features/tide.js");
await import("../assets/features/coriolis.js");
await import("../assets/features/front-weather.js");
await import("../assets/features/cyclone-system.js");
await import("../assets/features/atmosphere-reasoning.js");
await import("../assets/features/learning-export.js");

const topics = JSON.parse(await readFile(new URL("../data/topics.json", import.meta.url), "utf8"));
const questions = JSON.parse(await readFile(new URL("../data/questions.json", import.meta.url), "utf8"));
const questionSourceFidelity = JSON.parse(await readFile(new URL("../data/question_source_fidelity.json", import.meta.url), "utf8"));
const appSource = await readFile(new URL("../assets/app.js", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../assets/features/home.js", import.meta.url), "utf8");
const regionFeatureSource = await readFile(new URL("../assets/features/region-review.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const paperReviews = JSON.parse(await readFile(new URL("../data/paper_reviews.json", import.meta.url), "utf8"));
const retests = JSON.parse(await readFile(new URL("../data/retests.json", import.meta.url), "utf8"));
const timeLab = JSON.parse(await readFile(new URL("../data/time_lab.json", import.meta.url), "utf8"));
const earthMotionLab = JSON.parse(await readFile(new URL("../data/earth_motion_lab.json", import.meta.url), "utf8"));
const learningProjects = JSON.parse(await readFile(new URL("../data/learning_projects.json", import.meta.url), "utf8"));
const curriculumCatalog = JSON.parse(await readFile(new URL("../data/curriculum_catalog.json", import.meta.url), "utf8"));
const regionReview = JSON.parse(await readFile(new URL("../data/region_review.json", import.meta.url), "utf8"));
const presentationCatalog = JSON.parse(await readFile(new URL("../data/presentation_catalog.json", import.meta.url), "utf8"));
const solarSeasonLab = JSON.parse(await readFile(new URL("../data/solar_season_lab.json", import.meta.url), "utf8"));
const solarPathLab = JSON.parse(await readFile(new URL("../data/solar_path_lab.json", import.meta.url), "utf8"));
const annualSunLab = JSON.parse(await readFile(new URL("../data/annual_sun_lab.json", import.meta.url), "utf8"));
const orbitSpeedLab = JSON.parse(await readFile(new URL("../data/orbit_speed_lab.json", import.meta.url), "utf8"));
const terminatorLinkLab = JSON.parse(await readFile(new URL("../data/terminator_link_lab.json", import.meta.url), "utf8"));
const rotationSpeedLab = JSON.parse(await readFile(new URL("../data/rotation_speed_lab.json", import.meta.url), "utf8"));
const dateRangeLab = JSON.parse(await readFile(new URL("../data/date_range_lab.json", import.meta.url), "utf8"));
const axialTiltLab = JSON.parse(await readFile(new URL("../data/axial_tilt_lab.json", import.meta.url), "utf8"));
const celestialScaleLab = JSON.parse(await readFile(new URL("../data/celestial_scale_lab.json", import.meta.url), "utf8"));
const habitabilityLab = JSON.parse(await readFile(new URL("../data/habitability_lab.json", import.meta.url), "utf8"));
const solarActivityLab = JSON.parse(await readFile(new URL("../data/solar_activity_lab.json", import.meta.url), "utf8"));
const moonPhaseLab = JSON.parse(await readFile(new URL("../data/moon_phase_lab.json", import.meta.url), "utf8"));
const eclipseLab = JSON.parse(await readFile(new URL("../data/eclipse_lab.json", import.meta.url), "utf8"));
const tideLab = JSON.parse(await readFile(new URL("../data/tide_lab.json", import.meta.url), "utf8"));
const coriolisLab = JSON.parse(await readFile(new URL("../data/coriolis_lab.json", import.meta.url), "utf8"));
const frontWeatherLab = JSON.parse(await readFile(new URL("../data/front_weather_lab.json", import.meta.url), "utf8"));
const cycloneSystemLab = JSON.parse(await readFile(new URL("../data/cyclone_system_lab.json", import.meta.url), "utf8"));
const atmosphereLabs = JSON.parse(await readFile(new URL("../data/atmosphere_reasoning_labs.json", import.meta.url), "utf8"));
const v025Schemas = await Promise.all([
  "atmosphere-reasoning-labs.v0.25.schema.json",
  "atmosphere-reasoning-attempt.v0.25.schema.json",
  "learning-projects.v0.25.schema.json",
  "learning-export.v0.25.0.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const v024Schemas = await Promise.all([
  "atmosphere-reasoning-labs.v0.24.schema.json",
  "atmosphere-reasoning-attempt.v0.24.schema.json",
  "learning-projects.v0.24.schema.json",
  "learning-export.v0.24.0.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const v023Schemas = await Promise.all([
  "front-weather-lab.v0.23.schema.json",
  "front-weather-attempt.v0.23.schema.json",
  "cyclone-system-lab.v0.23.schema.json",
  "cyclone-system-attempt.v0.23.schema.json",
  "learning-projects.v0.23.schema.json",
  "learning-export.v0.23.0.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const v021Schemas = await Promise.all([
  "coriolis-lab.v0.21.schema.json",
  "coriolis-attempt.v0.21.schema.json",
  "learning-projects.v0.21.schema.json",
  "learning-export.v0.21.schema.json",
  "learning-export.v0.21.1.schema.json",
  "learning-export.v0.21.2.schema.json",
  "learning-export.v0.21.3.schema.json",
  "learning-export.v0.22.0.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const v020Schemas = await Promise.all([
  "tide-lab.v0.20.schema.json",
  "tide-attempt.v0.20.schema.json",
  "learning-projects.v0.20.schema.json",
  "learning-export.v0.20.schema.json"
].map(async (name) => JSON.parse(await readFile(new URL(`../schemas/${name}`, import.meta.url), "utf8"))));
const presentationCatalogSchema = JSON.parse(await readFile(new URL("../schemas/presentation-catalog.v0.1.schema.json", import.meta.url), "utf8"));
const curriculumCatalogSchema = JSON.parse(await readFile(new URL("../schemas/curriculum-catalog.v0.22.schema.json", import.meta.url), "utf8"));
const regionReviewSchema = JSON.parse(await readFile(new URL("../schemas/region-review.v0.28.schema.json", import.meta.url), "utf8"));
const retestV03Schema = JSON.parse(await readFile(new URL("../schemas/retest.v0.3.schema.json", import.meta.url), "utf8"));
const gitignoreSource = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
const topicIds = new Set(topics.map((topic) => topic.id));
const errors = [];
const diagnosticCatalogStart = appSource.indexOf("function renderDiagnosticCatalog()");
const diagnosticCatalogEnd = appSource.indexOf("function renderTrain()", diagnosticCatalogStart);
const diagnosticCatalogSource = diagnosticCatalogStart >= 0 && diagnosticCatalogEnd > diagnosticCatalogStart ? appSource.slice(diagnosticCatalogStart, diagnosticCatalogEnd) : "";

if (v020Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.20 schema 必须声明 $id 与 JSON Schema 版本");
if (v021Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.21 schema 必须声明 $id 与 JSON Schema 版本");
if (v023Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.23 schema 必须声明 $id 与 JSON Schema 版本");
if (v024Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.24 schema 必须声明 $id 与 JSON Schema 版本");
if (v025Schemas.some((schema) => !schema.$id || !schema.$schema)) errors.push("v0.25 schema 必须声明 $id 与 JSON Schema 版本");
if (!presentationCatalogSchema.$id || !presentationCatalogSchema.$schema) errors.push("PPT目录 schema 必须声明 $id 与 JSON Schema 版本");
if (!curriculumCatalogSchema.$id || !curriculumCatalogSchema.$schema) errors.push("教材课程目录 schema 必须声明 $id 与 JSON Schema 版本");
if (!regionReviewSchema.$id || !regionReviewSchema.$schema) errors.push("区域发展复习 schema 必须声明 $id 与 JSON Schema 版本");
if (retestV03Schema.properties?.source?.const !== "资料包选题") errors.push("复测 schema 必须只允许资料包选题");

if (!Array.isArray(topics) || topics.length === 0) errors.push("topics.json 必须是非空数组");
if (!Array.isArray(questions) || questions.length === 0) errors.push("questions.json 必须是非空数组");
if (Object.keys(questionSourceFidelity).length !== questions.length) errors.push("资料包原题核对清单必须覆盖全部诊断题");
if (!appSource.includes("选择理由（选填）") || !appSource.includes('if (!selectedOption) return alert("请先选择答案。");') || appSource.includes("!selectedOption || !reasoning")) errors.push("普通诊断题必须允许理由留空提交");
if (!indexSource.includes("ORANGE GEOGRAPHY COACH · v0.28.1") || !indexSource.includes("app.js?v=0.28.1") || !indexSource.includes("region-review.js?v=0.28.1")) errors.push("网页展示版本、静态资源版本或区域发展模块入口不是v0.28.1");
if (!indexSource.includes('data-action="goto" data-route="projects">学习</button>') || !indexSource.includes('data-action="start-next" data-route="train">题目</button>')) errors.push("底部导航必须保留学习目录和题目常驻入口");
if (!diagnosticCatalogSource.includes("题目目录") || !diagnosticCatalogSource.includes("教材册—章—节") || !diagnosticCatalogSource.includes('data-action="start-question"') || !diagnosticCatalogSource.includes('data-action="set-diagnostic-filter"')) errors.push("诊断题目录必须支持教材章节、状态筛选和指定题目进入");
if (!diagnosticCatalogSource.includes("diagnostic-section") || !diagnosticCatalogSource.includes('data-current-question="true"') || !diagnosticCatalogSource.includes("scrollIntoView")) errors.push("诊断题目录必须在第3级自动折叠题目并定位当前题");
if (diagnosticCatalogSource.includes("question.answer") || diagnosticCatalogSource.includes("question.explanation") || diagnosticCatalogSource.includes("question.error_map")) errors.push("诊断题目录不得提前展示答案、解析或错因映射");
if (!appSource.includes('class="result-option-list"') || !appSource.includes('data-action="continue-question"') || !appSource.includes("chooseNextCatalogQuestion(question.id)") || !appSource.includes("没把握，去看教材第") || !appSource.includes('data-action="save-attempt-region-day"')) errors.push("诊断讲解页必须保留四个选项、教材页入口，以及保存后继续或返回本日的按钮");
if (!appSource.includes("原题材料") || !appSource.includes("资料原解析（完整保留）") || !appSource.includes("renderQuestionSourceContent(question)")) errors.push("诊断题作答页与讲解页必须完整展示原题材料和资料原解析");
if (!homeSource.includes('data-action="open-diagnostic-catalog"') || !homeSource.includes("学习目录") || !homeSource.includes("learning-focus-section")) errors.push("学习目录必须提供当前学习项目与题目快捷入口");
if (!regionFeatureSource.includes("region-chapter-card") || !regionFeatureSource.includes("region-day-card") || !regionFeatureSource.includes("textbook-inline-viewer") || !regionFeatureSource.includes('loading="lazy"')) errors.push("区域复习必须按章—日折叠，并延迟加载教材页面图片");
if (!Array.isArray(paperReviews) || paperReviews.length === 0) errors.push("paper_reviews.json 必须是非空数组");
if (!Array.isArray(retests) || retests.length === 0) errors.push("retests.json 必须是非空数组");
if (!timeLab || !Array.isArray(timeLab.scenarios) || timeLab.scenarios.length === 0) errors.push("time_lab.json 必须包含非空 scenarios");
if (!timeLab || !Array.isArray(timeLab.places) || timeLab.places.length === 0) errors.push("time_lab.json 必须包含非空 places");
if (!earthMotionLab || !Array.isArray(earthMotionLab.views) || earthMotionLab.views.length !== 3) errors.push("earth_motion_lab.json 必须包含3种观察视角");
if (learningProjects?.schema_version !== "0.25.0" || !Array.isArray(learningProjects.projects) || learningProjects.projects.length !== 27) errors.push("learning_projects.json 必须是0.25.0版且包含27个项目");
if (curriculumCatalog?.schema_version !== "0.22.0" || !Array.isArray(curriculumCatalog.books) || curriculumCatalog.books.length !== 2) errors.push("curriculum_catalog.json 必须是0.22.0版且包含2册教材");
if (regionReview?.schema_version !== "0.28.0" || regionReview.id !== "region-development-review" || regionReview.local_only !== false || regionReview.days?.length !== 14 || regionReview.reasoning_steps?.length !== 7 || regionReview.chapters?.length !== 4 || regionReview.textbook?.image_base !== "./assets/textbook/region-development") errors.push("region_review.json 必须是可发布的0.28.0十四日复习模块，并包含四章目录、教材图片和7步区域分析链");
const ignoredLocalSourceDirs = new Set(gitignoreSource.split(/\r?\n/));
for (const sourceDir of ["local_learning_sources/", "教材/", "2025高中地理学习资料包 (知识点+教辅+试卷)/"]) {
  if (!ignoredLocalSourceDirs.has(sourceDir)) errors.push(`本机学习资料目录必须保持 Git 忽略：${sourceDir}`);
}
if (presentationCatalog?.schema_version !== "0.1.0" || !Array.isArray(presentationCatalog.decks) || presentationCatalog.decks.length !== 4) errors.push("presentation_catalog.json 必须是0.1.0版且包含4册PPT");
if (solarSeasonLab?.schema_version !== "0.7.0" || !Array.isArray(solarSeasonLab.dates) || solarSeasonLab.dates.length !== 4) errors.push("solar_season_lab.json 必须包含4个二分二至日情境");
if (solarPathLab?.schema_version !== "0.8.0" || !Array.isArray(solarPathLab.dates) || solarPathLab.dates.length !== 4) errors.push("solar_path_lab.json 必须包含4个二分二至日情境");
if (annualSunLab?.schema_version !== "0.9.0" || !Array.isArray(annualSunLab.checkpoints) || annualSunLab.checkpoints.length !== 8) errors.push("annual_sun_lab.json 必须包含8个周年观察位置");
if (orbitSpeedLab?.schema_version !== "0.10.0" || !Array.isArray(orbitSpeedLab.checkpoints) || orbitSpeedLab.checkpoints.length !== 4) errors.push("orbit_speed_lab.json 必须包含4个公转轨道位置");
if (terminatorLinkLab?.schema_version !== "0.11.0" || !Array.isArray(terminatorLinkLab.scenarios) || terminatorLinkLab.scenarios.length !== 8) errors.push("terminator_link_lab.json 必须包含8个晨昏线综合情境");
if (rotationSpeedLab?.schema_version !== "0.12.0" || !Array.isArray(rotationSpeedLab.scenarios) || rotationSpeedLab.scenarios.length !== 8) errors.push("rotation_speed_lab.json 必须包含8个自转速度情境");
if (dateRangeLab?.schema_version !== "0.13.0" || !Array.isArray(dateRangeLab.scenarios) || dateRangeLab.scenarios.length !== 8) errors.push("date_range_lab.json 必须包含8个全球日期情境");
if (axialTiltLab?.schema_version !== "0.14.0" || !Array.isArray(axialTiltLab.scenarios) || axialTiltLab.scenarios.length !== 8) errors.push("axial_tilt_lab.json 必须包含8个黄赤交角情境");
if (celestialScaleLab?.schema_version !== "0.15.0" || !Array.isArray(celestialScaleLab.scenarios) || celestialScaleLab.scenarios.length !== 8) errors.push("celestial_scale_lab.json 必须包含8个天体系统尺度情境");
if (habitabilityLab?.schema_version !== "0.16.0" || !Array.isArray(habitabilityLab.scenarios) || habitabilityLab.scenarios.length !== 8) errors.push("habitability_lab.json 必须包含8个地球宜居条件对照情境");
if (solarActivityLab?.schema_version !== "0.17.0" || !Array.isArray(solarActivityLab.scenarios) || solarActivityLab.scenarios.length !== 8) errors.push("solar_activity_lab.json 必须包含8个太阳活动证据情境");
if (moonPhaseLab?.schema_version !== "0.18.0" || !Array.isArray(moonPhaseLab.scenarios) || moonPhaseLab.scenarios.length !== 8 || moonPhaseLab?.phases?.length !== 8) errors.push("moon_phase_lab.json 必须包含8个月相位置与8个实验情境");
if (eclipseLab?.schema_version !== "0.19.0" || !Array.isArray(eclipseLab.scenarios) || eclipseLab.scenarios.length !== 8 || eclipseLab?.cases?.length !== 8) errors.push("eclipse_lab.json 必须包含8种日月食几何与8个实验情境");
if (tideLab?.schema_version !== "0.20.0" || !Array.isArray(tideLab.scenarios) || tideLab.scenarios.length !== 8 || tideLab?.cases?.length !== 8) errors.push("tide_lab.json 必须包含8个月相潮差阶段与8个实验情境");
if (coriolisLab?.schema_version !== "0.21.0" || !Array.isArray(coriolisLab.scenarios) || coriolisLab.scenarios.length !== 8) errors.push("coriolis_lab.json 必须包含8个半球与运动方向情境");
if (frontWeatherLab?.schema_version !== "0.23.0" || !Array.isArray(frontWeatherLab.scenarios) || frontWeatherLab.scenarios.length !== 4) errors.push("front_weather_lab.json 必须包含4个锋面天气情境");
if (cycloneSystemLab?.schema_version !== "0.23.0" || !Array.isArray(cycloneSystemLab.scenarios) || cycloneSystemLab.scenarios.length !== 4) errors.push("cyclone_system_lab.json 必须包含4个气旋反气旋情境");
if (atmosphereLabs?.schema_version !== "0.25.0" || !Array.isArray(atmosphereLabs.labs) || atmosphereLabs.labs.length !== 5 || atmosphereLabs.labs.some((lab) => lab.questions?.length !== 5 || lab.scenarios?.length < 4)) errors.push("atmosphere_reasoning_labs.json 必须包含5个实验室、每个5项判断且至少4个情境");

const projectIds = new Set();
const projectOrders = new Set();
const allowedProjectActions = new Set(["start-atmosphere-lab", "start-front-weather", "start-cyclone-system", "start-earth-motion", "start-coriolis", "start-solar-season", "start-annual-sun", "start-orbit-speed", "start-terminator-link", "start-rotation-speed", "start-date-range", "start-axial-tilt", "start-celestial-scale", "start-habitability", "start-solar-activity", "start-moon-phase", "start-eclipse", "start-tide", "start-solar-path", "start-time-lab", "start-next", "goto"]);
const allowedStatusKinds = new Set(["atmosphere_reasoning", "front_weather", "cyclone_system", "earth_motion", "coriolis", "solar_season", "annual_sun", "orbit_speed", "terminator_link", "rotation_speed", "date_range", "axial_tilt", "celestial_scale", "habitability", "solar_activity", "moon_phase", "eclipse", "tide", "solar_path", "time_lab", "diagnostic", "retest"]);
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
for (const requiredProjectId of ["front-weather-lab", "cyclone-system-lab", "global-circulation-lab", "monsoon-system-lab", "climate-control-lab", "climate-graph-lab", "orographic-rain-lab", "earth-motion-lab", "coriolis-lab", "solar-season-lab", "annual-sun-lab", "orbit-speed-lab", "terminator-link-lab", "rotation-speed-lab", "date-range-lab", "axial-tilt-lab", "celestial-scale-lab", "habitability-lab", "solar-activity-lab", "moon-phase-lab", "eclipse-lab", "tide-lab", "solar-path-lab", "time-zone-lab", "diagnostic-questions", "delayed-retests", "region-development-review"]) {
  if (!projectIds.has(requiredProjectId)) errors.push(`学习项目清单缺少：${requiredProjectId}`);
}
const diagnosticProject = learningProjects?.projects?.find((project) => project.id === "diagnostic-questions");
const firstLabOrder = Math.min(...(learningProjects?.projects || []).filter((project) => project.id.endsWith("-lab")).map((project) => project.order));
if (!diagnosticProject || diagnosticProject.order >= firstLabOrder) errors.push("诊断题必须排在实验室之前，避免手机端入口被长列表淹没");

const curriculumBookIds = new Set();
const curriculumChapterIds = new Set();
const curriculumSectionIds = new Set();
const curriculumQuestionIds = [];
const curriculumProjectIds = [];
for (const book of curriculumCatalog?.books || []) {
  if (curriculumBookIds.has(book.id)) errors.push(`教材编号重复：${book.id}`);
  curriculumBookIds.add(book.id);
  const chapterNumbers = new Set();
  for (const chapter of book.chapters || []) {
    if (curriculumChapterIds.has(chapter.id)) errors.push(`教材章节编号重复：${chapter.id}`);
    curriculumChapterIds.add(chapter.id);
    if (chapterNumbers.has(chapter.number)) errors.push(`${book.id} 章节序号重复：${chapter.number}`);
    chapterNumbers.add(chapter.number);
    const sectionNumbers = new Set();
    for (const section of chapter.sections || []) {
      if (curriculumSectionIds.has(section.id)) errors.push(`教材小节编号重复：${section.id}`);
      curriculumSectionIds.add(section.id);
      if (sectionNumbers.has(section.number)) errors.push(`${chapter.id} 小节序号重复：${section.number}`);
      sectionNumbers.add(section.number);
      curriculumQuestionIds.push(...(section.question_ids || []));
      curriculumProjectIds.push(...(section.project_ids || []));
    }
  }
}
curriculumQuestionIds.push(...(curriculumCatalog?.supplemental?.question_ids || []));
curriculumProjectIds.push(...(curriculumCatalog?.supplemental?.project_ids || []), ...(curriculumCatalog?.utility_project_ids || []));
for (const questionId of curriculumQuestionIds) if (!questions.some((question) => question.id === questionId)) errors.push(`教材课程目录引用不存在的题目：${questionId}`);
for (const projectId of curriculumProjectIds) if (!projectIds.has(projectId)) errors.push(`教材课程目录引用不存在的项目：${projectId}`);
if (new Set(curriculumQuestionIds).size !== curriculumQuestionIds.length) errors.push("教材课程目录中的题目必须只有一个归属");
if (new Set(curriculumProjectIds).size !== curriculumProjectIds.length) errors.push("教材课程目录中的项目必须只有一个归属");
if (curriculumQuestionIds.length !== questions.length || questions.some((question) => !curriculumQuestionIds.includes(question.id))) errors.push("每道诊断题都必须登记到教材章节或综合专题");
if (curriculumProjectIds.length !== learningProjects.projects.length || learningProjects.projects.some((project) => !curriculumProjectIds.includes(project.id))) errors.push("每个学习项目都必须登记到教材章节、综合专题或快捷入口");
const curriculumChapters = curriculumCatalog?.books?.[0]?.chapters || [];
if (curriculumChapters.length !== 5) errors.push("选择性必修1课程目录必须登记5章");
const atmosphereChapter = curriculumChapters.find((chapter) => chapter.number === 3);
const waterChapter = curriculumChapters.find((chapter) => chapter.number === 4);
if (atmosphereChapter?.title !== "大气的运动" || atmosphereChapter?.status !== "active" || atmosphereChapter?.sections?.map((section) => section.title).join("|") !== "常见天气系统|气压带和风带|气压带和风带对气候的影响" || atmosphereChapter.sections[0].question_ids.length !== 4 || atmosphereChapter.sections[0].project_ids.join("|") !== "front-weather-lab|cyclone-system-lab" || atmosphereChapter.sections[1].question_ids.length !== 5 || atmosphereChapter.sections[1].project_ids.join("|") !== "global-circulation-lab|monsoon-system-lab" || atmosphereChapter.sections[2].question_ids.length !== 5 || atmosphereChapter.sections[2].project_ids.join("|") !== "climate-control-lab|climate-graph-lab|orographic-rain-lab") errors.push("第三章大气的运动目录或三节专项内容不正确");
if (waterChapter?.title !== "水的运动" || waterChapter?.status !== "planned" || waterChapter?.sections?.map((section) => section.title).join("|") !== "陆地水体及其相互关系|洋流|海—气相互作用") errors.push("第四章水的运动目录或学习状态不正确");
const regionBook = curriculumCatalog?.books?.find((book) => book.id === "pep-selective-2");
const regionChapter = regionBook?.chapters?.find((chapter) => chapter.number === 1);
if (regionBook?.title !== "选择性必修2·区域发展" || regionBook.chapters?.length !== 4 || regionChapter?.status !== "active" || regionChapter?.sections?.map((section) => section.title).join("|") !== "多种多样的区域|区域整体性和关联性") errors.push("选择性必修2目录或第一章两节内容不正确");
const regionBookQuestionIds = regionBook?.chapters?.flatMap((chapter) => chapter.sections.flatMap((section) => section.question_ids)) || [];
if (regionBookQuestionIds.length !== 28 || regionChapter?.sections?.flatMap((section) => section.question_ids).length !== 6 || regionChapter?.sections?.[0]?.project_ids?.[0] !== "region-development-review") errors.push("选择性必修2必须登记28道资料包诊断题和十四日复习项目");

const presentationDeckIds = new Set();
const presentationSlideIds = new Set();
const presentationQuestionIds = new Set();
for (const deck of presentationCatalog?.decks || []) {
  if (presentationDeckIds.has(deck.id)) errors.push("PPT目录编号重复：" + deck.id);
  presentationDeckIds.add(deck.id);
  if (!deck.path?.endsWith(".pptx")) errors.push(deck.id + " 的路径必须指向PPTX文件");
  if (deck.slide_count !== deck.slides?.length) errors.push(deck.id + " 的slide_count与slides数量不一致");
  for (const labId of deck.lab_ids || []) {
    if (!projectIds.has(labId)) errors.push(deck.id + " 引用了不存在的实验室：" + labId);
  }
  for (const questionId of deck.question_ids || []) {
    if (presentationQuestionIds.has(questionId)) errors.push("PPT题目编号重复：" + questionId);
    presentationQuestionIds.add(questionId);
  }
  for (const slide of deck.slides || []) {
    if (presentationSlideIds.has(slide.id)) errors.push("PPT页面编号重复：" + slide.id);
    presentationSlideIds.add(slide.id);
    for (const labId of slide.lab_ids || []) {
      if (!deck.lab_ids.includes(labId)) errors.push(slide.id + " 引用了未在本册登记的实验室：" + labId);
    }
    if (slide.question_id && !deck.question_ids.includes(slide.question_id)) {
      errors.push(slide.id + " 引用了未在本册登记的题目：" + slide.question_id);
    }
  }
}

const ids = new Set();
for (const question of questions) {
  if (ids.has(question.id)) errors.push(`题目编号重复：${question.id}`);
  ids.add(question.id);
  if (!topicIds.has(question.topic_id)) errors.push(`${question.id} 引用了不存在的主题：${question.topic_id}`);
  if (!question.source?.startsWith("资料包·")) errors.push(`${question.id} 不是资料包选题`);
  const verifiedSource = questionSourceFidelity[question.id];
  if (!verifiedSource) {
    errors.push(`${question.id} 缺少资料包原题核对记录`);
  } else {
    for (const field of ["source", "source_document", "source_material", "stem", "answer", "explanation"]) {
      if (question[field] !== verifiedSource[field]) errors.push(`${question.id} 的 ${field} 与资料包核对清单不一致`);
    }
    const questionOptionTexts = question.options?.map((option) => option.text) || [];
    if (JSON.stringify(questionOptionTexts) !== JSON.stringify(verifiedSource.options)) errors.push(`${question.id} 的四个选项与资料包核对清单不一致`);
  }
  if (!question.source_material?.trim()) errors.push(`${question.id} 缺少完整原题共同材料`);
  if (!question.source_document?.endsWith(".docx")) errors.push(`${question.id} 缺少可追溯的资料包教师版文件名`);
  if (question.source_fidelity?.status !== "verified_against_teacher_docx" || question.source_fidelity?.fields?.length !== 5) errors.push(`${question.id} 未声明题面与解析已逐项核对`);
  if (question.options?.length !== 4) errors.push(`${question.id} 必须完整保留四个选项`);
  if (!question.knowledge_point_id?.trim()) errors.push(`${question.id} 缺少 knowledge_point_id`);
  const optionIds = question.options?.map((option) => option.id) ?? [];
  if (new Set(optionIds).size !== optionIds.length) errors.push(`${question.id} 选项编号重复`);
  if (!optionIds.includes(question.answer)) errors.push(`${question.id} 正确答案不在选项中`);
  for (const optionId of optionIds.filter((id) => id !== question.answer)) {
    if (!question.error_map?.[optionId]?.tag) errors.push(`${question.id} 缺少 ${optionId} 的 error_tag`);
  }
  if (!Array.isArray(question.review_after_days) || question.review_after_days.length === 0) {
    errors.push(`${question.id} 缺少复测间隔`);
  }
  if (question.source_image) {
    if (!question.source_image.startsWith("./assets/questions/") || !question.source_image_alt?.trim()) errors.push(`${question.id} 的发布题图路径或替代文字不合规`);
    try { await access(new URL(`../${question.source_image.slice(2)}`, import.meta.url)); } catch { errors.push(`${question.id} 缺少发布题图：${question.source_image}`); }
  }
}

const knowledgeCounts = new Map();
for (const question of questions) knowledgeCounts.set(question.knowledge_point_id, (knowledgeCounts.get(question.knowledge_point_id) || 0) + 1);
for (const [knowledgePointId, count] of knowledgeCounts) if (count < 2 || count > 5) errors.push(`${knowledgePointId} 题量必须为2—5道，当前为${count}道`);

const regionQuestionIds = regionReview.days.flatMap((day) => day.question_ids || []);
if (regionQuestionIds.length !== 28 || new Set(regionQuestionIds).size !== 28) errors.push("十四日复习必须引用28道不重复诊断题");
const coveredRegionDays = regionReview.chapters?.flatMap((chapter) => Array.from({ length: chapter.day_end - chapter.day_start + 1 }, (_, index) => chapter.day_start + index)) || [];
if (coveredRegionDays.length !== 14 || new Set(coveredRegionDays).size !== 14 || coveredRegionDays.some((day) => day < 1 || day > 14)) errors.push("区域发展四章必须无遗漏、无重复地覆盖DAY 1—14");
for (const day of regionReview.days) {
  if (day.question_ids.length < 2 || day.question_ids.length > 5) errors.push(`第${day.day}天必须安排2—5道题`);
  if (day.textbook_page_start > day.textbook_page_end || day.pdf_page_start > day.pdf_page_end) errors.push(`第${day.day}天教材或PDF页码范围倒置`);
  if (day.pdf_page_start - day.textbook_page_start !== regionReview.textbook.textbook_page_offset || day.pdf_page_end - day.textbook_page_end !== regionReview.textbook.textbook_page_offset) errors.push(`第${day.day}天教材页与PDF页映射不一致`);
  if (day.pdf_page_start < regionReview.textbook.first_pdf_page || day.pdf_page_end > regionReview.textbook.last_pdf_page) errors.push(`第${day.day}天教材图片超出发布页范围`);
  for (const questionId of day.question_ids) if (questions.find((item) => item.id === questionId)?.knowledge_point_id !== day.knowledge_point_id) errors.push(`${questionId} 的知识点与第${day.day}天不一致`);
}
for (let page = regionReview.textbook.first_pdf_page; page <= regionReview.textbook.last_pdf_page; page += 1) {
  const filename = `page-${String(page).padStart(3, "0")}.jpg`;
  try {
    const imageInfo = await stat(new URL(`../assets/textbook/region-development/${filename}`, import.meta.url));
    if (imageInfo.size < 100_000) errors.push(`教材页面图片疑似不完整：${filename}`);
  } catch {
    errors.push(`缺少教材页面图片：${filename}`);
  }
}
for (const questionId of regionQuestionIds) {
  const question = questions.find((item) => item.id === questionId);
  if (!question) continue;
  if (!question.source?.startsWith("资料包·")) errors.push(`${question.id} 必须来自资料包`);
  if (!question.source_material_kind) errors.push(`${question.id} 必须声明材料类型`);
  if (question.dataset && (!question.dataset.title || question.dataset.columns?.length < 2 || question.dataset.rows?.length < 1 || question.dataset.rows.some((row) => row.length !== question.dataset.columns.length))) errors.push(`${question.id} 的源题表格不完整`);
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

const regionRetests = regionReview.delayed_retest_ids.map((id) => retests.find((retest) => retest.id === id)).filter(Boolean);
if (regionRetests.length !== 2 || retests.length !== 2 || retests.some((retest) => retest.source !== "资料包选题")) errors.push("十四日复习必须只保留2组资料包延迟复测");
for (const retest of regionRetests) {
  if (retest.source !== "资料包选题") errors.push(`${retest.id} 必须从资料包选取`);
  if (retest.source_images?.length < 2) errors.push(`${retest.id} 必须保留至少2张源题图`);
  if (!retest.dataset?.title || retest.dataset.columns?.length < 2 || retest.dataset.rows?.length < 1 || retest.dataset.rows.some((row) => row.length !== retest.dataset.columns.length)) errors.push(`${retest.id} 的源题表格不完整`);
  for (const image of retest.source_images || []) {
    if (!image.src?.startsWith("./assets/questions/region-development/") || !image.alt?.trim()) errors.push(`${retest.id} 的发布题图路径或替代文字不合规`);
    try { await access(new URL(`../${image.src.slice(2)}`, import.meta.url)); } catch { errors.push(`${retest.id} 缺少发布题图：${image.src}`); }
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
  if (!requiredCelestialLevels.every((id) => lockedSvg.includes(celestialScaleFeature.getLevel(celestialScaleLab, id)?.name))) errors.push("天体系统图示必须从进入实验室起显示四级名称和顺序");
}
for (const tag of ["C-SYSTEM-ORDER", "C-MOON-SCALE", "C-AU-SCALE", "C-GALACTIC-LOCATION", "C-DIAGRAM-SCALE"]) {
  if (!celestialScaleLab?.error_tags?.[tag]) errors.push(`celestial_scale_lab.json 缺少错误标签：${tag}`);
}

if (habitabilityLab && !topicIds.has(habitabilityLab.topic_id)) errors.push("habitability_lab.json 引用了不存在的主题");
if (!Number.isInteger(habitabilityLab?.review_after_hours) || habitabilityLab.review_after_hours < 48) errors.push("habitability_lab.json review_after_hours 至少为48小时");
if (!habitabilityLab?.model_note?.includes("不把宜居性等同于已经存在生命") || !habitabilityLab.model_note.includes("反照率")) errors.push("宜居条件实验必须说明生命证据边界与模型限制");
if (!Array.isArray(habitabilityLab?.sources) || habitabilityLab.sources.length < 5 || habitabilityLab.sources.some((source) => !/^https:\/\/science\.nasa\.gov\//.test(source.url))) errors.push("宜居条件实验必须记录至少5条NASA可追溯来源");
const habitabilityFeature = globalThis.OrangeCoach?.features?.habitability;
const habitabilityBodyIds = new Set((habitabilityLab?.bodies || []).map((body) => body.id));
for (const requiredBody of ["venus", "earth", "mars", "moon"]) {
  if (!habitabilityBodyIds.has(requiredBody)) errors.push(`宜居条件实验缺少对照天体：${requiredBody}`);
}
const habitabilityBodyMap = new Map((habitabilityLab?.bodies || []).map((body) => [body.id, body]));
if (habitabilityBodyMap.get("venus")?.pressure_ratio !== 93 || habitabilityBodyMap.get("venus")?.solar_flux_percent !== 193) errors.push("金星对照必须保留约93倍地球气压与约193%太阳辐射锚点");
if (habitabilityBodyMap.get("earth")?.distance_au !== 1 || !habitabilityBodyMap.get("earth")?.surface_water?.includes("71%")) errors.push("地球对照必须保留1 AU与海洋约71%锚点");
if (!(habitabilityBodyMap.get("mars")?.pressure_ratio < 0.01) || habitabilityBodyMap.get("mars")?.solar_flux_percent !== 43) errors.push("火星对照必须体现不足地球1%气压与约43%太阳辐射");
if (habitabilityBodyMap.get("moon")?.pressure_ratio !== 0 || habitabilityBodyMap.get("moon")?.solar_flux_percent !== 100) errors.push("月球对照必须体现近似无大气且与地球接收近似太阳辐射");
const habitabilityScenarioIds = new Set();
const habitabilityCategories = new Set();
const habitabilityAnswerKeys = ["higher_solar", "higher_pressure", "temperature_window", "stable_liquid_water", "best_inference"];
for (const scenario of habitabilityLab?.scenarios || []) {
  if (habitabilityScenarioIds.has(scenario.id)) errors.push(`宜居条件场景编号重复：${scenario.id}`);
  habitabilityScenarioIds.add(scenario.id);
  habitabilityCategories.add(scenario.pair_category);
  if (!habitabilityBodyIds.has(scenario.body_a) || !habitabilityBodyIds.has(scenario.body_b) || scenario.body_a === scenario.body_b) errors.push(`${scenario.id} 的对照天体无效`);
  if (!Array.isArray(scenario.inference_choices) || scenario.inference_choices.length !== 4 || !scenario.inference_choices.includes(scenario.answers?.best_inference)) errors.push(`${scenario.id} 的合理推论选项或答案无效`);
  if (habitabilityAnswerKeys.some((key) => !scenario.answers?.[key])) errors.push(`${scenario.id} 缺少五步答案`);
  if (habitabilityFeature && habitabilityAnswerKeys.some((key) => habitabilityFeature.calculate(scenario)[key] !== scenario.answers[key])) errors.push(`${scenario.id} 的宜居条件答案计算与数据不一致`);
}
if (!["same_solar", "different_solar"].every((category) => habitabilityCategories.has(category))) errors.push("宜居条件实验必须同时包含同辐射与不同辐射对照");
if (!habitabilityFeature) {
  errors.push("地球宜居条件对照实验功能未成功注册");
} else {
  const lockedHtml = habitabilityFeature.renderLab({ lab: habitabilityLab, scenario: habitabilityLab.scenarios[0], scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!["467°C", "71%"].every((value) => lockedHtml.includes(value))) errors.push("宜居条件图示必须从进入实验室起显示温度和地表水证据");
}
for (const tag of ["H-SOLAR-FLUX", "H-ATMOSPHERE-PRESSURE", "H-TEMP-WINDOW", "H-LIQUID-WATER", "H-EVIDENCE-BOUNDARY"]) {
  if (!habitabilityLab?.error_tags?.[tag]) errors.push(`habitability_lab.json 缺少错误标签：${tag}`);
}

if (solarActivityLab && !topicIds.has(solarActivityLab.topic_id)) errors.push("solar_activity_lab.json 引用了不存在的主题");
if (!Number.isInteger(solarActivityLab?.review_after_hours) || solarActivityLab.review_after_hours < 48) errors.push("solar_activity_lab.json review_after_hours 至少为48小时");
if (!solarActivityLab?.model_note?.includes("高中理想模型") || !solarActivityLab.model_note.includes("真实太阳爆发结构可跨越多个大气层")) errors.push("太阳活动实验必须说明高中分层模型与真实多层结构的证据边界");
if (!Array.isArray(solarActivityLab?.sources) || solarActivityLab.sources.length < 6 || solarActivityLab.sources.some((source) => !/^https:\/\/(science\.nasa\.gov|www\.swpc\.noaa\.gov)\//.test(source.url))) errors.push("太阳活动实验必须记录至少6条NASA或NOAA可追溯来源");
const solarActivityFeature = globalThis.OrangeCoach?.features?.solarActivity;
const solarActivityPathMap = new Map((solarActivityLab?.paths || []).map((path) => [path.id, path]));
if (solarActivityPathMap.size !== 3 || solarActivityPathMap.get("radiation")?.name !== "电磁辐射" || solarActivityPathMap.get("radiation")?.time !== "约8分钟" || solarActivityPathMap.get("particles")?.name !== "高能带电粒子" || solarActivityPathMap.get("particles")?.time !== "分钟至小时" || solarActivityPathMap.get("plasma")?.name !== "磁化等离子体" || !solarActivityPathMap.get("plasma")?.time?.includes("14—17小时")) errors.push("太阳活动实验的三条传播路径或时间锚点错误");
const solarActivityScenarioIds = new Set();
const solarActivityCategories = new Set();
const solarActivityAnswerKeys = ["phenomenon", "transport", "arrival", "impact", "conclusion"];
const solarActivityCorrectPositions = new Map(solarActivityAnswerKeys.map((key) => [key, []]));
for (const scenario of solarActivityLab?.scenarios || []) {
  if (solarActivityScenarioIds.has(scenario.id)) errors.push(`太阳活动场景编号重复：${scenario.id}`);
  solarActivityScenarioIds.add(scenario.id);
  solarActivityCategories.add(scenario.category);
  if (!Array.isArray(scenario.observations) || scenario.observations.length !== 3) errors.push(`${scenario.id} 必须保留3条原始观测`);
  for (const key of solarActivityAnswerKeys) {
    if (!Array.isArray(scenario.choices?.[key]) || scenario.choices[key].length !== 4 || !scenario.choices[key].includes(scenario.answers?.[key])) errors.push(`${scenario.id} 的${key}正确答案未登记到4个选项中`);
  }
  if (solarActivityFeature && solarActivityAnswerKeys.some((key) => solarActivityFeature.calculate(scenario)[key] !== scenario.answers[key])) errors.push(`${scenario.id} 的太阳活动答案计算与数据不一致`);
  if (solarActivityFeature) {
    const scenarioHtml = solarActivityFeature.renderLab({ lab: solarActivityLab, scenario, scenarioIndex: 0 });
    for (const key of solarActivityAnswerKeys) {
      const values = [...scenarioHtml.matchAll(new RegExp(`name="solar-activity-${key}" value="([^"]+)"`, "g"))].map((match) => match[1]);
      solarActivityCorrectPositions.get(key).push(values.indexOf(scenario.answers[key]));
    }
  }
}
if (!["indicator", "radiation", "particles", "plasma", "combined"].every((category) => solarActivityCategories.has(category))) errors.push("太阳活动实验必须覆盖指标、辐射、粒子、等离子体和复合事件");
if ([...solarActivityCorrectPositions.entries()].some(([, positions]) => positions.includes(-1) || new Set(positions).size < 2)) errors.push("太阳活动五组正确选项必须按情境稳定打乱，不能形成固定位置暗示");
if (!solarActivityFeature) {
  errors.push("太阳活动证据判读实验功能未成功注册");
} else {
  const lockedHtml = solarActivityFeature.renderLab({ lab: solarActivityLab, scenario: solarActivityLab.scenarios[0], scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!["电磁辐射", "高能带电粒子", "磁化等离子体", "约8分钟"].every((value) => lockedSvg.includes(value))) errors.push("太阳活动图示必须从进入实验室起显示传播载体和时间答案");
}
const solarActivityById = new Map((solarActivityLab?.scenarios || []).map((scenario) => [scenario.id, scenario]));
if (solarActivityById.get("SA-02")?.answers?.arrival !== "约8分钟" || !solarActivityById.get("SA-02")?.answers?.impact?.includes("无线电")) errors.push("SA-02 必须保留耀斑电磁辐射约8分钟与无线电影响锚点");
if (!solarActivityById.get("SA-04")?.answers?.arrival?.includes("14—17小时") || !solarActivityById.get("SA-04")?.answers?.impact?.includes("地磁暴")) errors.push("SA-04 必须保留对地CME到达时标与地磁影响锚点");
if (solarActivityById.get("SA-05")?.answers?.arrival !== "分钟至小时" || solarActivityById.get("SA-05")?.answers?.transport !== "高能带电粒子") errors.push("SA-05 必须保留高能粒子分钟至小时时标");
if (!solarActivityById.get("SA-03")?.answers?.impact?.includes("不预期") || !solarActivityById.get("SA-03")?.answers?.conclusion?.includes("传播方向")) errors.push("SA-03 必须保留非对地CME的方向证据边界");
if (!solarActivityById.get("SA-07")?.observations?.some((item) => item.includes("0.1%")) || !solarActivityById.get("SA-07")?.answers?.conclusion?.includes("地轴倾斜和公转")) errors.push("SA-07 必须保留约0.1%辐照度变化与四季成因边界");
for (const tag of ["SA-PHENOMENON", "SA-TRANSPORT", "SA-TIMESCALE", "SA-EARTH-IMPACT", "SA-EVIDENCE-BOUNDARY"]) {
  if (!solarActivityLab?.error_tags?.[tag]) errors.push(`solar_activity_lab.json 缺少错误标签：${tag}`);
}

if (moonPhaseLab && !topicIds.has(moonPhaseLab.topic_id)) errors.push("moon_phase_lab.json 引用了不存在的主题");
if (!Number.isInteger(moonPhaseLab?.review_after_hours) || moonPhaseLab.review_after_hours < 48) errors.push("moon_phase_lab.json review_after_hours 至少为48小时");
if (!moonPhaseLab?.model_note?.includes("北极上空") || !moonPhaseLab.model_note.includes("倾斜约5°") || !moonPhaseLab.model_note.includes("南北半球")) errors.push("月相实验必须说明观察视角、轨道倾角与南北半球朝向边界");
if (!Array.isArray(moonPhaseLab?.sources) || moonPhaseLab.sources.length < 5 || moonPhaseLab.sources.some((source) => !/^https:\/\/(science\.nasa\.gov|svs\.gsfc\.nasa\.gov)\//.test(source.url))) errors.push("月相实验必须记录至少5条NASA可追溯来源");
const moonPhaseFeature = globalThis.OrangeCoach?.features?.moonPhase;
const expectedPhaseIds = ["new", "waxing-crescent", "first-quarter", "waxing-gibbous", "full", "waning-gibbous", "last-quarter", "waning-crescent"];
const moonPhaseIds = new Set();
for (const [index, phase] of (moonPhaseLab?.phases || []).entries()) {
  if (moonPhaseIds.has(phase.id)) errors.push(`月相编号重复：${phase.id}`);
  moonPhaseIds.add(phase.id);
  if (phase.id !== expectedPhaseIds[index] || phase.angle_deg !== index * 45) errors.push(`八相月轨顺序或角度错误：${phase.id}`);
  if (!/^约(?:0|3|6|9|12|15|18|21)时$/.test(phase.rise) || !/^约(?:0|3|6|9|12|15|18|21)时$/.test(phase.transit) || !/^约(?:0|3|6|9|12|15|18|21)时$/.test(phase.set)) errors.push(`${phase.id} 的月升、中天或月落近似时刻无效`);
}
if (expectedPhaseIds.some((id) => !moonPhaseIds.has(id))) errors.push("月相实验必须完整覆盖新月至残月八相");
const expectedTransit = ["约12时", "约15时", "约18时", "约21时", "约0时", "约3时", "约6时", "约9时"];
if ((moonPhaseLab?.phases || []).some((phase, index) => phase.transit !== expectedTransit[index])) errors.push("八相过中天近似时刻必须按每相3小时连续推进");
const moonScenarioIds = new Set();
const moonScenarioPhaseIds = new Set();
const moonAnswerKeys = ["phase", "illumination", "trend", "transit", "conclusion"];
const moonCorrectPositions = new Map(moonAnswerKeys.map((key) => [key, []]));
for (const scenario of moonPhaseLab?.scenarios || []) {
  if (moonScenarioIds.has(scenario.id)) errors.push(`月相场景编号重复：${scenario.id}`);
  moonScenarioIds.add(scenario.id);
  if (!moonPhaseIds.has(scenario.phase_id) || moonScenarioPhaseIds.has(scenario.phase_id)) errors.push(`${scenario.id} 的月相引用无效或重复`);
  moonScenarioPhaseIds.add(scenario.phase_id);
  if (!Array.isArray(scenario.observations) || scenario.observations.length !== 3) errors.push(`${scenario.id} 必须保留3条原始观测`);
  for (const key of moonAnswerKeys) {
    if (!Array.isArray(scenario.choices?.[key]) || scenario.choices[key].length !== 4 || !scenario.choices[key].includes(scenario.answers?.[key])) errors.push(`${scenario.id} 的${key}正确答案未登记到4个选项中`);
  }
  if (moonPhaseFeature && moonAnswerKeys.some((key) => moonPhaseFeature.calculate(scenario)[key] !== scenario.answers[key])) errors.push(`${scenario.id} 的月相答案计算与数据不一致`);
  if (moonPhaseFeature) {
    const phase = moonPhaseFeature.getPhase(moonPhaseLab, scenario.phase_id);
    const scenarioHtml = moonPhaseFeature.renderLab({ lab: moonPhaseLab, scenario, phase, scenarioIndex: 0 });
    for (const key of moonAnswerKeys) {
      const inputName = key === "phase" ? "name" : key;
      const values = [...scenarioHtml.matchAll(new RegExp(`name="moon-phase-${inputName}" value="([^"]+)"`, "g"))].map((match) => match[1]);
      moonCorrectPositions.get(key).push(values.indexOf(scenario.answers[key]));
    }
  }
}
if (moonScenarioPhaseIds.size !== 8) errors.push("8个月相情境必须与八相一一对应");
if ([...moonCorrectPositions.entries()].some(([, positions]) => positions.includes(-1) || new Set(positions).size < 2)) errors.push("月相五组正确选项必须按情境稳定打乱，不能形成固定位置暗示");
if (!moonPhaseFeature) {
  errors.push("月相位置与可见时段实验功能未成功注册");
} else {
  const scenario = moonPhaseLab.scenarios[0];
  const lockedHtml = moonPhaseFeature.renderLab({ lab: moonPhaseLab, scenario, phase: moonPhaseFeature.getPhase(moonPhaseLab, scenario.phase_id), scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!["新月（朔）", "近0%", "约12时", "从地球看"].every((value) => lockedSvg.includes(value))) errors.push("月相图示必须从进入实验室起显示月相、亮面和中天时刻");
}
const moonScenarioById = new Map((moonPhaseLab?.scenarios || []).map((scenario) => [scenario.id, scenario]));
if (!moonScenarioById.get("MP-01")?.answers?.conclusion?.includes("轨道交点") || !moonScenarioById.get("MP-05")?.answers?.conclusion?.includes("轨道交点")) errors.push("新月与满月情境必须保留并非每次发生日月食的轨道倾角边界");
if (moonScenarioById.get("MP-03")?.answers?.transit !== "约18时" || moonScenarioById.get("MP-07")?.answers?.transit !== "约6时") errors.push("上弦月与下弦月必须保留18时/6时过中天锚点");
if (!moonScenarioById.get("MP-02")?.answers?.conclusion?.includes("逐日稍晚") || !moonScenarioById.get("MP-08")?.answers?.conclusion?.includes("日出前东方")) errors.push("渐盈与渐亏月牙必须保留可见方位和时段差异");
for (const tag of ["MP-POSITION-PHASE", "MP-ILLUMINATION", "MP-WAX-WANE", "MP-VISIBLE-TIME", "MP-EVIDENCE-BOUNDARY"]) {
  if (!moonPhaseLab?.error_tags?.[tag]) errors.push(`moon_phase_lab.json 缺少错误标签：${tag}`);
}

if (eclipseLab && !topicIds.has(eclipseLab.topic_id)) errors.push("eclipse_lab.json 引用了不存在的主题");
if (!Number.isInteger(eclipseLab?.review_after_hours) || eclipseLab.review_after_hours < 48) errors.push("eclipse_lab.json review_after_hours 至少为48小时");
if (!eclipseLab?.model_note?.includes("倾斜约5°") || !eclipseLab.model_note.includes("不按真实比例")) errors.push("日月食实验必须说明轨道倾角与示意图非真实比例边界");
if (!Array.isArray(eclipseLab?.sources) || eclipseLab.sources.length < 5 || eclipseLab.sources.some((source) => !/^https:\/\/(science\.nasa\.gov|eclipse\.gsfc\.nasa\.gov)\//.test(source.url))) errors.push("日月食实验必须记录至少5条NASA可追溯来源");
const eclipseFeature = globalThis.OrangeCoach?.features?.eclipse;
const eclipseCaseIds = new Set();
for (const item of eclipseLab?.cases || []) {
  if (eclipseCaseIds.has(item.id)) errors.push(`日月食几何编号重复：${item.id}`);
  eclipseCaseIds.add(item.id);
  if ((item.family === "solar") !== (item.phase === "新月") || (item.family === "lunar") !== (item.phase === "满月")) errors.push(`${item.id} 的食类与月相条件不一致`);
}
if ((eclipseLab?.cases || []).filter((item) => item.family === "solar").length !== 4 || (eclipseLab?.cases || []).filter((item) => item.family === "lunar").length !== 4) errors.push("日月食实验必须各覆盖4种日食与4种月食/无食情境");
const eclipseScenarioIds = new Set();
const eclipseScenarioCaseIds = new Set();
const eclipseAnswerKeys = ["alignment", "shadow", "phenomenon", "visibility", "conclusion"];
const eclipseCorrectPositions = new Map(eclipseAnswerKeys.map((key) => [key, []]));
for (const scenario of eclipseLab?.scenarios || []) {
  if (eclipseScenarioIds.has(scenario.id)) errors.push(`日月食场景编号重复：${scenario.id}`);
  eclipseScenarioIds.add(scenario.id);
  if (!eclipseCaseIds.has(scenario.case_id) || eclipseScenarioCaseIds.has(scenario.case_id)) errors.push(`${scenario.id} 的几何情境引用无效或重复`);
  eclipseScenarioCaseIds.add(scenario.case_id);
  if (!Array.isArray(scenario.observations) || scenario.observations.length !== 3) errors.push(`${scenario.id} 必须保留3条原始观测`);
  for (const key of eclipseAnswerKeys) {
    if (!Array.isArray(scenario.choices?.[key]) || scenario.choices[key].length !== 4 || !scenario.choices[key].includes(scenario.answers?.[key])) errors.push(`${scenario.id} 的${key}正确答案未登记到4个选项中`);
  }
  if (eclipseFeature && eclipseAnswerKeys.some((key) => eclipseFeature.calculate(scenario)[key] !== scenario.answers[key])) errors.push(`${scenario.id} 的日月食答案计算与数据不一致`);
  if (eclipseFeature) {
    const item = eclipseFeature.getCase(eclipseLab, scenario.case_id);
    const scenarioHtml = eclipseFeature.renderLab({ lab: eclipseLab, scenario, item, scenarioIndex: 0 });
    for (const key of eclipseAnswerKeys) {
      const values = [...scenarioHtml.matchAll(new RegExp(`name="eclipse-${key}" value="([^"]+)"`, "g"))].map((match) => match[1]);
      eclipseCorrectPositions.get(key).push(values.indexOf(scenario.answers[key]));
    }
  }
}
if (eclipseScenarioCaseIds.size !== 8) errors.push("8个日月食情境必须与8种几何一一对应");
if ([...eclipseCorrectPositions.entries()].some(([, positions]) => positions.includes(-1) || new Set(positions).size < 2)) errors.push("日月食五组正确选项必须按情境稳定打乱，不能形成固定位置暗示");
if (!eclipseFeature) {
  errors.push("日月食几何与可见范围实验功能未成功注册");
} else {
  const scenario = eclipseLab.scenarios[0];
  const lockedHtml = eclipseFeature.renderLab({ lab: eclipseLab, scenario, item: eclipseFeature.getCase(eclipseLab, scenario.case_id), scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!["日全食", "本影", "半影", "狭窄全食带"].every((value) => lockedSvg.includes(value))) errors.push("日月食图示必须从进入实验室起显示影区、食象和可见范围");
}
const eclipseScenarioById = new Map((eclipseLab?.scenarios || []).map((scenario) => [scenario.id, scenario]));
if (!eclipseScenarioById.get("EC-02")?.answers?.conclusion?.includes("视直径") || !eclipseScenarioById.get("EC-05")?.answers?.visibility?.includes("夜半球")) errors.push("日环食视直径与月食夜半球可见范围锚点缺失");
if (!eclipseScenarioById.get("EC-04")?.answers?.conclusion?.includes("必要条件") || !eclipseScenarioById.get("EC-08")?.answers?.conclusion?.includes("必要条件")) errors.push("新月与满月无食情境必须保留交点必要条件边界");
if (eclipseFeature?.getCase(eclipseLab, "no-solar")?.offset > -90 || eclipseFeature?.getCase(eclipseLab, "no-lunar")?.offset > -90) errors.push("无食情境示意必须让月影或月球路径明显避开目标天体");
for (const tag of ["EC-ALIGNMENT-PHASE", "EC-SHADOW-TYPE", "EC-ECLIPSE-TYPE", "EC-VISIBILITY", "EC-EVIDENCE-BOUNDARY"]) {
  if (!eclipseLab?.error_tags?.[tag]) errors.push(`eclipse_lab.json 缺少错误标签：${tag}`);
}

if (tideLab && !topicIds.has(tideLab.topic_id)) errors.push("tide_lab.json 引用了不存在的主题");
if (!Number.isInteger(tideLab?.review_after_hours) || tideLab.review_after_hours < 48) errors.push("tide_lab.json review_after_hours 至少为48小时");
if (!tideLab?.model_note?.includes("高中理想模型") || !tideLab.model_note.includes("不预测某港口")) errors.push("潮汐实验必须说明理想模型与局地预报边界");
if (!Array.isArray(tideLab?.sources) || tideLab.sources.length < 5 || tideLab.sources.some((source) => !/^https:\/\/(science\.nasa\.gov|oceanservice\.noaa\.gov|scijinks\.gov)\//.test(source.url))) errors.push("潮汐实验必须记录至少5条NASA或NOAA可追溯来源");
const tideFeature = globalThis.OrangeCoach?.features?.tide;
const tideCaseIds = new Set();
const tideAngles = new Set();
for (const [index, item] of (tideLab?.cases || []).entries()) {
  if (tideCaseIds.has(item.id)) errors.push(`潮汐阶段编号重复：${item.id}`);
  tideCaseIds.add(item.id);
  tideAngles.add(item.angle_deg);
  if (item.angle_deg !== index * 45) errors.push(`${item.id} 的月相顺序或日月夹角错误`);
}
if (tideAngles.size !== 8 || (tideLab?.cases || []).filter((item) => item.category === "spring").length !== 2 || (tideLab?.cases || []).filter((item) => item.category === "neap").length !== 2 || (tideLab?.cases || []).filter((item) => item.category === "transition").length !== 4) errors.push("潮汐实验必须覆盖2个大潮、2个小潮和4个过渡阶段");
const tideScenarioIds = new Set();
const tideScenarioCaseIds = new Set();
const tideAnswerKeys = ["geometry", "tide_type", "range", "cycle", "conclusion"];
const tideCorrectPositions = new Map(tideAnswerKeys.map((key) => [key, []]));
for (const scenario of tideLab?.scenarios || []) {
  if (tideScenarioIds.has(scenario.id)) errors.push(`潮汐场景编号重复：${scenario.id}`);
  tideScenarioIds.add(scenario.id);
  if (!tideCaseIds.has(scenario.case_id) || tideScenarioCaseIds.has(scenario.case_id)) errors.push(`${scenario.id} 的潮汐阶段引用无效或重复`);
  tideScenarioCaseIds.add(scenario.case_id);
  if (!Array.isArray(scenario.observations) || scenario.observations.length !== 3) errors.push(`${scenario.id} 必须保留3条原始观测`);
  for (const key of tideAnswerKeys) {
    if (!Array.isArray(scenario.choices?.[key]) || scenario.choices[key].length !== 4 || !scenario.choices[key].includes(scenario.answers?.[key])) errors.push(`${scenario.id} 的${key}正确答案未登记到4个选项中`);
  }
  if (tideFeature && tideAnswerKeys.some((key) => tideFeature.calculate(scenario)[key] !== scenario.answers[key])) errors.push(`${scenario.id} 的潮汐答案计算与数据不一致`);
  if (tideFeature) {
    const item = tideFeature.getCase(tideLab, scenario.case_id);
    const scenarioHtml = tideFeature.renderLab({ lab: tideLab, scenario, item, scenarioIndex: 0 });
    for (const key of tideAnswerKeys) {
      const inputName = key === "tide_type" ? "type" : key;
      const values = [...scenarioHtml.matchAll(new RegExp(`name="tide-${inputName}" value="([^"]+)"`, "g"))].map((match) => match[1]);
      tideCorrectPositions.get(key).push(values.indexOf(scenario.answers[key]));
    }
  }
}
if (tideScenarioCaseIds.size !== 8) errors.push("8个潮汐情境必须与八个月相阶段一一对应");
if ([...tideCorrectPositions.entries()].some(([, positions]) => positions.includes(-1) || new Set(positions).size < 2)) errors.push("潮汐五组正确选项必须按情境稳定打乱，不能形成固定位置暗示");
if (!tideFeature) {
  errors.push("潮汐周期与月相实验功能未成功注册");
} else {
  const scenario = tideLab.scenarios[0];
  const lockedHtml = tideFeature.renderLab({ lab: tideLab, scenario, item: tideFeature.getCase(tideLab, scenario.case_id), scenarioIndex: 0 });
  const lockedSvg = lockedHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] || "";
  if (!["大潮", "潮差通常较大", "月球引潮方向"].every((value) => lockedSvg.includes(value))) errors.push("潮汐图示必须从进入实验室起显示潮型、潮差和引潮方向");
}
const tideScenarioById = new Map((tideLab?.scenarios || []).map((scenario) => [scenario.id, scenario]));
if (!tideScenarioById.get("TD-01")?.answers?.conclusion?.includes("当地潮汐资料") || !tideScenarioById.get("TD-01")?.answers?.cycle?.includes("24时50分")) errors.push("新月大潮情境必须保留太阴日与当地潮汐资料边界");
if (!tideScenarioById.get("TD-03")?.answers?.cycle?.includes("两组大潮和两组小潮") || !tideScenarioById.get("TD-07")?.answers?.conclusion?.includes("不能推出")) errors.push("上弦下弦小潮必须保留朔望月周期与非瞬时潮位边界");
if (!tideScenarioById.get("TD-08")?.answers?.conclusion?.includes("春季无关")) errors.push("潮汐实验必须澄清春潮与季节无关");

const coriolisFeature = globalThis.OrangeCoach?.features?.coriolis;
if (!coriolisFeature) {
  errors.push("地转偏向力实验功能未成功注册");
} else {
  for (const scenario of coriolisLab.scenarios) {
    const result = coriolisFeature.calculate(scenario);
    if (JSON.stringify(result) !== JSON.stringify(scenario.answers)) errors.push(`${scenario.id} 地转偏向力答案计算与数据不一致`);
  }
  const north = coriolisLab.scenarios.find((scenario) => scenario.id === "CF-01");
  const south = coriolisLab.scenarios.find((scenario) => scenario.id === "CF-05");
  const equator = coriolisLab.scenarios.find((scenario) => scenario.id === "CF-08");
  if (north?.answers?.final_direction !== "向东偏转" || south?.answers?.final_direction !== "向西偏转" || equator?.answers?.relative_side !== "不发生偏转") errors.push("地转偏向力南北半球与赤道锚点错误");
  const visibleHtml = coriolisFeature.renderLab({ lab: coriolisLab, scenario: north, scenarioIndex: 0 });
  if (!visibleHtml.includes("向东偏转") || !visibleHtml.includes("判断链（选填）") || visibleHtml.includes("required")) errors.push("地转偏向力图示必须默认可见，判断链必须选填");
}

const frontWeatherFeature = globalThis.OrangeCoach?.features?.frontWeather;
if (!frontWeatherFeature) {
  errors.push("锋面天气实验功能未成功注册");
} else {
  for (const scenario of frontWeatherLab.scenarios) {
    if (JSON.stringify(frontWeatherFeature.calculate(scenario)) !== JSON.stringify(scenario.answers)) errors.push(`${scenario.id} 锋面天气答案计算与数据不一致`);
  }
  const cold = frontWeatherLab.scenarios.find((scenario) => scenario.front_type === "冷锋");
  const warm = frontWeatherLab.scenarios.find((scenario) => scenario.front_type === "暖锋");
  const stationary = frontWeatherLab.scenarios.find((scenario) => scenario.front_type === "准静止锋");
  if (!cold?.answers?.precipitation_zone.includes("锋后") || !warm?.answers?.precipitation_zone.includes("锋前") || !stationary?.answers?.station_weather.includes("阴雨持续")) errors.push("冷锋、暖锋、准静止锋锚点答案错误");
  const visibleHtml = frontWeatherFeature.renderLab({ lab: frontWeatherLab, scenario: cold, scenarioIndex: 0 });
  if (!visibleHtml.includes("降水多在锋后附近") || !visibleHtml.includes("判断链（选填）") || visibleHtml.includes("required")) errors.push("锋面图示必须默认可见，判断链必须选填");
}

const cycloneSystemFeature = globalThis.OrangeCoach?.features?.cycloneSystem;
if (!cycloneSystemFeature) {
  errors.push("气旋反气旋实验功能未成功注册");
} else {
  for (const scenario of cycloneSystemLab.scenarios) {
    if (JSON.stringify(cycloneSystemFeature.calculate(scenario)) !== JSON.stringify(scenario.answers)) errors.push(`${scenario.id} 气旋反气旋答案计算与数据不一致`);
  }
  const northLow = cycloneSystemLab.scenarios.find((scenario) => scenario.id === "CY-01");
  const southLow = cycloneSystemLab.scenarios.find((scenario) => scenario.id === "CY-02");
  const northHigh = cycloneSystemLab.scenarios.find((scenario) => scenario.id === "CY-03");
  if (northLow?.answers?.rotation !== "逆时针" || southLow?.answers?.rotation !== "顺时针" || northHigh?.answers?.surface_flow !== "近地面由中心向四周辐散") errors.push("气旋反气旋南北半球锚点答案错误");
  const visibleHtml = cycloneSystemFeature.renderLab({ lab: cycloneSystemLab, scenario: northLow, scenarioIndex: 0 });
  if (!visibleHtml.includes("逆时针辐合") || !visibleHtml.includes("判断链（选填）") || visibleHtml.includes("required")) errors.push("气旋反气旋图示必须默认可见，判断链必须选填");
}

const atmosphereReasoningFeature = globalThis.OrangeCoach?.features?.atmosphereReasoning;
if (!atmosphereReasoningFeature) {
  errors.push("大气运动连续推理实验功能未成功注册");
} else {
  const circulation = atmosphereLabs.labs.find((lab) => lab.id === "global-circulation-lab");
  const monsoon = atmosphereLabs.labs.find((lab) => lab.id === "monsoon-system-lab");
  const climateControl = atmosphereLabs.labs.find((lab) => lab.id === "climate-control-lab");
  const climateGraph = atmosphereLabs.labs.find((lab) => lab.id === "climate-graph-lab");
  const orographicRain = atmosphereLabs.labs.find((lab) => lab.id === "orographic-rain-lab");
  for (const lab of atmosphereLabs.labs) {
    for (const scenario of lab.scenarios) {
      if (JSON.stringify(atmosphereReasoningFeature.calculate(scenario)) !== JSON.stringify(scenario.answers)) errors.push(`${scenario.id} 大气运动答案计算与数据不一致`);
    }
  }
  const equator = circulation?.scenarios.find((scenario) => scenario.id === "AC-01");
  const southAsiaSummer = monsoon?.scenarios.find((scenario) => scenario.id === "AM-04");
  const mediterranean = climateControl?.scenarios.find((scenario) => scenario.id === "CL-04");
  const london = climateGraph?.scenarios.find((scenario) => scenario.id === "CG-03");
  const moistEastWind = orographicRain?.scenarios.find((scenario) => scenario.id === "OR-01");
  if (equator?.answers?.pressure_origin !== "热力低压" || southAsiaSummer?.answers?.regional_wind !== "南亚西南季风，温暖湿润" || mediterranean?.answers?.precipitation !== "夏季少雨、冬季多雨" || london?.answers?.climate_type !== "温带海洋性气候" || moistEastWind?.answers?.windward_side !== "山体东坡") errors.push("大气环流、气候或地形雨锚点答案错误");
  const circulationHtml = atmosphereReasoningFeature.renderLab({ lab: circulation, scenario: equator, scenarioIndex: 0 });
  const monsoonHtml = atmosphereReasoningFeature.renderLab({ lab: monsoon, scenario: southAsiaSummer, scenarioIndex: 3 });
  const climateControlHtml = atmosphereReasoningFeature.renderLab({ lab: climateControl, scenario: mediterranean, scenarioIndex: 3 });
  const climateGraphHtml = atmosphereReasoningFeature.renderLab({ lab: climateGraph, scenario: london, scenarioIndex: 2 });
  const orographicHtml = atmosphereReasoningFeature.renderLab({ lab: orographicRain, scenario: moistEastWind, scenarioIndex: 0 });
  if (!circulationHtml.includes("图示默认可见") || !circulationHtml.includes("判断链（选填）") || circulationHtml.includes("required") || !monsoonHtml.includes("南亚西南季风") || !climateControlHtml.includes("第三章第三节") || !climateControlHtml.includes("冬夏控制系统交替") || !climateGraphHtml.includes("气温折线 · 降水柱") || !orographicHtml.includes("迎风抬升") || [climateControlHtml, climateGraphHtml, orographicHtml].some((html) => html.includes("required"))) errors.push("第二、三节实验图示必须默认可见，判断链必须选填");
}

for (const id of ["GEO-EARTH-001", "GEO-EARTH-002", "GEO-EARTH-003", "GEO-EARTH-004", "GEO-EARTH-005", "GEO-EARTH-006", "GEO-EARTH-007", "GEO-EARTH-008"]) {
  if (!questions.some((question) => question.id === id)) errors.push(`教材第一章补漏题缺失：${id}`);
}
for (const id of ["GEO-WEA-001", "GEO-WEA-002", "GEO-WEA-003", "GEO-WEA-004"]) {
  if (!questions.some((question) => question.id === id)) errors.push(`教材第三章第一节诊断题缺失：${id}`);
}
for (const id of ["GEO-AIR-001", "GEO-AIR-002", "GEO-AIR-003", "GEO-AIR-004", "GEO-AIR-005"]) {
  if (!questions.some((question) => question.id === id)) errors.push(`教材第三章第二节诊断题缺失：${id}`);
}
for (const id of ["GEO-CLI-001", "GEO-CLI-002", "GEO-CLI-003", "GEO-CLI-004", "GEO-CLI-005"]) {
  if (!questions.some((question) => question.id === id)) errors.push(`教材第三章第三节诊断题缺失：${id}`);
}
for (const tag of ["TD-GEOMETRY-PHASE", "TD-SPRING-NEAP", "TD-TIDAL-RANGE", "TD-LUNAR-DAY", "TD-LOCAL-BOUNDARY"]) {
  if (!tideLab?.error_tags?.[tag]) errors.push(`tide_lab.json 缺少错误标签：${tag}`);
}

const learningExport = globalThis.OrangeCoach?.features?.learningExport;
if (!learningExport) {
  errors.push("可批注学习档案功能未成功注册");
} else {
  const testNow = new Date("2026-08-10T13:14:15.123Z");
  const fixtureState = {
    version: "0.3.0",
    attempts: [{ id: "ATT-TEST", question_id: questions[0].id, is_correct: false, error_tag_candidate: "TEST-TAG", reasoning: "", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
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
    habitabilityAttempts: [{ id: "HABITABILITY-TEST", scenario_id: "HB-01", pair_category: "different_solar", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    solarActivityAttempts: [{ id: "SOLAR-ACTIVITY-TEST", scenario_id: "SA-02", category: "radiation", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    moonPhaseAttempts: [{ id: "MOON-PHASE-TEST", scenario_id: "MP-03", phase_id: "first-quarter", category: "waxing", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    eclipseAttempts: [{ id: "ECLIPSE-TEST", scenario_id: "EC-01", case_id: "total-solar", family: "solar", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    tideAttempts: [{ id: "TIDE-TEST", scenario_id: "TD-01", case_id: "new-moon", category: "spring", score: 5, error_tags: [], parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    coriolisAttempts: [{ id: "CORIOLIS-TEST", scenario_id: "CF-01", hemisphere: "北半球", score: 5, error_tags: [], reasoning: "", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    frontWeatherAttempts: [{ id: "FRONT-TEST", scenario_id: "FR-01", front_type: "冷锋", score: 5, error_tags: [], reasoning: "", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    cycloneSystemAttempts: [{ id: "CYCLONE-TEST", scenario_id: "CY-01", hemisphere: "北半球", system_family: "低气压（气旋）", score: 5, error_tags: [], reasoning: "", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    atmosphereReasoningAttempts: [{ id: "ATMOSPHERE-TEST", lab_id: "global-circulation-lab", scenario_id: "AC-01", section_id: "pep-selective-1-ch03-s02", contrast_key: "热力低压", score: 5, error_tags: [], reasoning: "", parent_review_status: "待家长确认", submitted_at: testNow.toISOString() }],
    coachAnnotations: [{ id: "COACH-TEST", status: "候选" }]
  };
  const packet = learningExport.buildPacket({
    state: fixtureState,
    context: { topics, questions },
    now: testNow,
    config: globalThis.OrangeCoach.config
  });
  const filename = learningExport.exportFilename(testNow);
  if (packet.export_schema_version !== "0.25.0" || packet.app_version !== "0.28.1" || packet.exported_at !== testNow.toISOString()) errors.push("学习档案版本或导出时间戳错误");
  if (packet.summary.total_learning_records !== 18 || packet.summary.pending_parent_reviews !== 18) errors.push("学习档案摘要计数错误");
  if (packet.summary.by_project.length !== 26 || packet.summary.habitability_attempts !== 1 || packet.summary.solar_activity_attempts !== 1 || packet.summary.moon_phase_attempts !== 1 || packet.summary.eclipse_attempts !== 1 || packet.summary.tide_attempts !== 1 || packet.summary.coriolis_attempts !== 1 || packet.summary.front_weather_attempts !== 1 || packet.summary.cyclone_system_attempts !== 1 || packet.summary.atmosphere_reasoning_attempts !== 1 || packet.summary.activity_window.first_recorded_at == null || !Array.isArray(packet.solar_season_attempts) || !Array.isArray(packet.solar_path_attempts) || !Array.isArray(packet.annual_sun_attempts) || !Array.isArray(packet.orbit_speed_attempts) || !Array.isArray(packet.terminator_link_attempts) || !Array.isArray(packet.rotation_speed_attempts) || !Array.isArray(packet.date_range_attempts) || !Array.isArray(packet.axial_tilt_attempts) || !Array.isArray(packet.celestial_scale_attempts) || !Array.isArray(packet.habitability_attempts) || !Array.isArray(packet.solar_activity_attempts) || !Array.isArray(packet.moon_phase_attempts) || !Array.isArray(packet.eclipse_attempts) || !Array.isArray(packet.tide_attempts) || !Array.isArray(packet.coriolis_attempts) || !Array.isArray(packet.front_weather_attempts) || !Array.isArray(packet.cyclone_system_attempts) || !Array.isArray(packet.atmosphere_reasoning_attempts)) errors.push("学习档案缺少第三章项目进度或学习时间范围");
  if (packet.summary.candidate_error_tags[0]?.error_tag !== "TEST-TAG") errors.push("学习档案错因聚合错误");
  if (packet.attempts[0]?.reasoning !== "") errors.push("诊断题空理由没有被原样保存到学习档案");
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
  const tamperedHabitability = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, habitabilityAttempts: [{ ...fixtureState.habitabilityAttempts[0], score: 4 }] });
  if (tamperedHabitability.ok) errors.push("学习档案导入没有保护宜居条件原始证据");
  const tamperedSolarActivity = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, solarActivityAttempts: [{ ...fixtureState.solarActivityAttempts[0], score: 4 }] });
  if (tamperedSolarActivity.ok) errors.push("学习档案导入没有保护太阳活动原始证据");
  const tamperedMoonPhase = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, moonPhaseAttempts: [{ ...fixtureState.moonPhaseAttempts[0], score: 4 }] });
  if (tamperedMoonPhase.ok) errors.push("学习档案导入没有保护月相原始证据");
  const tamperedEclipse = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, eclipseAttempts: [{ ...fixtureState.eclipseAttempts[0], score: 4 }] });
  if (tamperedEclipse.ok) errors.push("学习档案导入没有保护日月食原始证据");
  const tamperedTide = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, tideAttempts: [{ ...fixtureState.tideAttempts[0], score: 4 }] });
  if (tamperedTide.ok) errors.push("学习档案导入没有保护潮汐原始证据");
  const tamperedCoriolis = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, coriolisAttempts: [{ ...fixtureState.coriolisAttempts[0], score: 4 }] });
  if (tamperedCoriolis.ok) errors.push("学习档案导入没有保护地转偏向力原始证据");
  const tamperedFront = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, frontWeatherAttempts: [{ ...fixtureState.frontWeatherAttempts[0], score: 4 }] });
  if (tamperedFront.ok) errors.push("学习档案导入没有保护锋面天气原始证据");
  const tamperedCyclone = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, cycloneSystemAttempts: [{ ...fixtureState.cycloneSystemAttempts[0], score: 4 }] });
  if (tamperedCyclone.ok) errors.push("学习档案导入没有保护气旋反气旋原始证据");
  const tamperedAtmosphere = learningExport.mergeAnnotatedArchive(fixtureState, { ...fixtureState, atmosphereReasoningAttempts: [{ ...fixtureState.atmosphereReasoningAttempts[0], score: 4 }] });
  if (tamperedAtmosphere.ok) errors.push("学习档案导入没有保护大气运动原始证据");
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 内容校验通过：${topics.length} 个主题，${learningProjects.projects.length} 个学习项目，${questions.length} 道选择题，${timeLab.scenarios.length} 个时区实验场景，${motionScenarioIds.size} 个晨昏线场景，${solarSeasonLab.dates.length * solarSeasonLab.places.length} 个太阳季节组合，${solarPathLab.dates.length * solarPathLab.places.length} 个太阳视运动组合，${annualSunLab.checkpoints.length * annualSunLab.places.length} 个周年回归组合，${orbitScenarioIds.size} 个公转轨道组合，${linkScenarioIds.size} 个晨昏线综合情境，${rotationScenarioIds.size} 个自转速度情境，${dateRangeScenarioIds.size} 个全球日期情境，${axialTiltScenarioIds.size} 个黄赤交角情境，${celestialScenarioIds.size} 个天体系统尺度情境，${habitabilityScenarioIds.size} 个宜居条件对照情境，${solarActivityScenarioIds.size} 个太阳活动证据情境，${moonScenarioIds.size} 个月相位置情境，${eclipseScenarioIds.size} 个日月食几何情境，${tideScenarioIds.size} 个潮汐周期情境，${coriolisLab.scenarios.length} 个地转偏向力情境，${frontWeatherLab.scenarios.length} 个锋面天气情境，${cycloneSystemLab.scenarios.length} 个气旋反气旋情境，${atmosphereLabs.labs.reduce((sum, lab) => sum + lab.scenarios.length, 0)} 个大气环流、气候与地形雨情境，${paperReviews.length} 份试卷复盘，${retests.length} 组复测，可批注档案通过校验`);
