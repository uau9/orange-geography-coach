const STORAGE_KEY = "orange-geography-coach:v0.1";
const COACH_CONFIG = window.OrangeCoach?.config || { APP_VERSION: "0.7.0", ASSET_VERSION: "0.7.0", EXPORT_SCHEMA_VERSION: "0.7.0", STUDENT_ALIAS: "橙子" };
const ASSET_VERSION = COACH_CONFIG.ASSET_VERSION;

function formatClock(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function dateDelta(totalMinutes) { return Math.floor(totalMinutes / 1440); }
function dateRelationLabel(delta) { return delta < 0 ? "前一天" : delta > 0 ? "后一天" : "同一天"; }

function longitudeLabel(longitude) {
  if (longitude === 0) return "0°";
  return `${Math.abs(longitude)}°${longitude > 0 ? "E" : "W"}`;
}

function longitudeRelation(longitude) { return longitude > 0 ? "东经" : longitude < 0 ? "西经" : "本初子午线"; }

function theoreticalZoneIndex(longitude) {
  if (longitude === 0) return 0;
  return Math.sign(longitude) * Math.floor(Math.abs(longitude) / 15 + 0.5);
}

function zoneLabel(index) { return index === 0 ? "零时区" : `${index > 0 ? "东" : "西"}${Math.abs(index)}区`; }

function normalizeTimeAnswer(value = "") {
  const match = String(value).trim().replace(/[：.时]/g, ":").match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function readTimeParts(form, prefix) {
  const hours = String(form.get(`${prefix}-hour`) || "").trim();
  const minutes = String(form.get(`${prefix}-minute`) || "").trim();
  if (!hours || !minutes) return "";
  return normalizeTimeAnswer(`${hours}:${minutes.padStart(2, "0")}`);
}

function calculateTimeLabAnswers(scenario, longitude) {
  const zoneIndex = theoreticalZoneIndex(longitude);
  const localTotal = scenario.utc_minutes + longitude * 4;
  const zoneTotal = scenario.utc_minutes + zoneIndex * 60;
  return {
    relation: longitudeRelation(longitude),
    local_time: formatClock(localTotal),
    zone_time: formatClock(zoneTotal),
    date_relation: dateRelationLabel(dateDelta(zoneTotal)),
    local_date_relation: dateRelationLabel(dateDelta(localTotal)),
    zone_name: zoneLabel(zoneIndex),
    zone_index: zoneIndex
  };
}

const app = document.querySelector("#app");
const state = loadState();
let catalog = { topics: [], questions: [], paperReviews: [], retests: [], projects: [], timeLab: null, earthMotionLab: null, solarSeasonLab: null };

function defaultState() {
  return {
    version: "0.3.0",
    route: "today",
    currentQuestionId: null,
    currentRetestId: null,
    activeSession: null,
    activeRetestSession: null,
    activeTimeLabAttemptId: null,
    timeLabScenarioIndex: 0,
    activeEarthMotionAttemptId: null,
    earthMotionViewId: "north",
    earthMotionPointId: "upper",
    activeSolarSeasonAttemptId: null,
    solarSeasonDateId: "june-solstice",
    solarSeasonPlaceId: "beijing",
    attempts: [],
    retestAttempts: [],
    timeLabAttempts: [],
    earthMotionAttempts: [],
    solarSeasonAttempts: [],
    coachAnnotations: [],
    lastAction: ""
  };
}

function normalizeState(parsed) {
  const normalized = { ...defaultState(), ...parsed, version: "0.3.0" };
  normalized.attempts = Array.isArray(parsed?.attempts) ? parsed.attempts : [];
  normalized.retestAttempts = Array.isArray(parsed?.retestAttempts)
    ? parsed.retestAttempts
    : Array.isArray(parsed?.retest_attempts)
      ? parsed.retest_attempts
      : [];
  normalized.timeLabAttempts = Array.isArray(parsed?.timeLabAttempts)
    ? parsed.timeLabAttempts
    : Array.isArray(parsed?.time_lab_attempts)
      ? parsed.time_lab_attempts
      : [];
  normalized.earthMotionAttempts = Array.isArray(parsed?.earthMotionAttempts)
    ? parsed.earthMotionAttempts
    : Array.isArray(parsed?.earth_motion_attempts)
      ? parsed.earth_motion_attempts
      : [];
  normalized.solarSeasonAttempts = Array.isArray(parsed?.solarSeasonAttempts)
    ? parsed.solarSeasonAttempts
    : Array.isArray(parsed?.solar_season_attempts)
      ? parsed.solar_season_attempts
      : [];
  normalized.coachAnnotations = Array.isArray(parsed?.coachAnnotations)
    ? parsed.coachAnnotations
    : Array.isArray(parsed?.coach_annotations)
      ? parsed.coach_annotations
      : [];
  return normalized;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return parsed && ["0.1.0", "0.2.0", "0.3.0"].includes(parsed.version) ? normalizeState(parsed) : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function getTopic(id) { return catalog.topics.find((topic) => topic.id === id); }
function getQuestion(id) { return catalog.questions.find((question) => question.id === id); }
function getRetest(id) { return catalog.retests.find((retest) => retest.id === id); }
function getTimeLabAttempt(id) { return state.timeLabAttempts.find((attempt) => attempt.id === id); }
function getEarthMotionAttempt(id) { return state.earthMotionAttempts.find((attempt) => attempt.id === id); }
function getSolarSeasonAttempt(id) { return state.solarSeasonAttempts.find((attempt) => attempt.id === id); }
function getActiveQuestion() { return getQuestion(state.currentQuestionId) || chooseNextQuestion(); }
function chooseNextQuestion() {
  const attempted = new Set(state.attempts.map((attempt) => attempt.question_id));
  const unseen = catalog.questions.find((question) => !attempted.has(question.id));
  if (unseen) return unseen;
  return [...catalog.questions].sort((a, b) => scoreQuestion(a) - scoreQuestion(b))[0] || catalog.questions[0];
}
function chooseNextQuestionForTopic(topicId) {
  const candidates = catalog.questions.filter((question) => question.topic_id === topicId);
  const attempted = new Set(state.attempts.map((attempt) => attempt.question_id));
  return candidates.find((question) => !attempted.has(question.id))
    || [...candidates].sort((a, b) => scoreQuestion(a) - scoreQuestion(b))[0]
    || null;
}
function scoreQuestion(question) {
  const attempts = state.attempts.filter((attempt) => attempt.question_id === question.id);
  if (!attempts.length) return 0;
  const latest = attempts[attempts.length - 1];
  return latest.is_correct ? attempts.length + 2 : attempts.length - 2;
}
function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function latestAttempts() { return [...state.attempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestRetestAttempts() { return [...state.retestAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestTimeLabAttempts() { return [...state.timeLabAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestEarthMotionAttempts() { return [...state.earthMotionAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestSolarSeasonAttempts() { return [...state.solarSeasonAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function completedToday() {
  const today = new Date().toDateString();
  return [...state.attempts, ...state.retestAttempts, ...state.timeLabAttempts, ...state.earthMotionAttempts, ...state.solarSeasonAttempts]
    .filter((attempt) => attempt.submitted_at && new Date(attempt.submitted_at).toDateString() === today).length;
}
function topicStats(topic) {
  const attempts = state.attempts.filter((attempt) => getQuestion(attempt.question_id)?.topic_id === topic.id);
  const correct = attempts.filter((attempt) => attempt.is_correct).length;
  const ratio = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
  return { attempts, correct, ratio };
}

function getTimeLabScenario() {
  const scenarios = catalog.timeLab?.scenarios || [];
  return scenarios.length ? scenarios[state.timeLabScenarioIndex % scenarios.length] : null;
}

function getPlaceAtLongitude(longitude) {
  return (catalog.timeLab?.places || []).find((place) => place.longitude === longitude) || null;
}

function renderWorldMap(longitude) {
  const places = catalog.timeLab?.places || [];
  const selectedPlace = getPlaceAtLongitude(longitude);
  const meridianX = longitude + 180;
  return `
    <div class="world-map-block">
      <div class="world-map" aria-label="平面世界地图，经度从西经180度到东经180度">
        <svg viewBox="0 0 360 180" role="img" aria-label="点击地图选择目标经度" data-action="select-map-longitude">
          <rect class="map-ocean" width="360" height="180" rx="12" />
          <g class="map-grid" aria-hidden="true">
            <path d="M60 0V180M120 0V180M180 0V180M240 0V180M300 0V180" />
            <path d="M0 30H360M0 60H360M0 90H360M0 120H360M0 150H360" />
          </g>
          <g class="map-land" aria-hidden="true">
            <path d="M18 36L39 20 70 15 103 28 117 44 105 59 90 70 78 76 64 65 59 52 39 50 25 60 10 53Z" />
            <path d="M86 86L110 91 126 108 123 135 109 165 99 149 94 121Z" />
            <path d="M135 13L161 7 175 22 162 39 142 33Z" />
            <path d="M166 43L191 34 209 47 201 60 180 61 165 53Z" />
            <path d="M177 64L203 58 224 78 216 113 198 145 182 124 171 91Z" />
            <path d="M200 39L228 23 266 26 305 38 338 56 344 73 318 85 287 76 267 94 244 88 225 69 207 62Z" />
            <path d="M281 116L316 109 341 129 332 151 300 154 283 136Z" />
            <path d="M0 168L360 168 341 179 21 179Z" />
          </g>
          <line id="lab-selected-meridian" class="map-selected-meridian" x1="${meridianX}" y1="0" x2="${meridianX}" y2="180" aria-hidden="true" />
        </svg>
        ${places.map((place) => `<button type="button" class="map-place ${place.longitude === longitude ? "active" : ""}" data-action="select-place" data-longitude="${place.longitude}" style="--map-x:${((place.longitude + 180) / 360) * 100}%;--map-y:${((90 - place.latitude) / 180) * 100}%" aria-label="选择${escapeHtml(place.name)}，${longitudeLabel(place.longitude)}"><span class="map-place-label">${escapeHtml(place.name)}</span></button>`).join("")}
      </div>
      <p class="map-hint">点地图可选任意经度；点地点名称可快速定位。</p>
      <div class="place-shortcuts" aria-label="城市和地点快捷选择">
        ${places.map((place) => `<button type="button" class="place-chip ${place.longitude === longitude ? "active" : ""}" data-action="select-place" data-longitude="${place.longitude}"><span>${escapeHtml(place.name)}</span><small>${longitudeLabel(place.longitude)}</small></button>`).join("")}
      </div>
      <div class="longitude-scale" aria-hidden="true"><span>175°W</span><span>0°</span><span>175°E</span></div>
      <input id="lab-longitude" class="longitude-slider" name="longitude" type="range" min="-175" max="175" step="1" value="${longitude}" aria-label="目标经度" style="--marker:${((longitude + 175) / 350) * 100}%" />
    </div>
    <div class="longitude-selection-note">当前地点：<strong id="lab-place-label">${escapeHtml(selectedPlace?.name || "自选经度")}</strong> · <output id="lab-longitude-label">${longitudeLabel(longitude)}</output></div>
  `;
}

function updateLabLongitudeSelection(rawLongitude) {
  const parsed = Number(rawLongitude);
  if (!Number.isFinite(parsed)) return;
  const longitude = Math.max(-175, Math.min(175, Math.round(parsed)));
  const slider = document.querySelector("#lab-longitude");
  if (slider) {
    slider.value = String(longitude);
    slider.style.setProperty("--marker", `${((longitude + 175) / 350) * 100}%`);
  }
  const longitudeOutput = document.querySelector("#lab-longitude-label");
  if (longitudeOutput) longitudeOutput.textContent = longitudeLabel(longitude);
  const placeOutput = document.querySelector("#lab-place-label");
  if (placeOutput) placeOutput.textContent = getPlaceAtLongitude(longitude)?.name || "自选经度";
  const meridian = document.querySelector("#lab-selected-meridian");
  if (meridian) {
    meridian.setAttribute("x1", String(longitude + 180));
    meridian.setAttribute("x2", String(longitude + 180));
  }
  document.querySelectorAll("[data-action='select-place']").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.longitude) === longitude);
  });
}

function getEarthMotionView(viewId = state.earthMotionViewId) {
  return (catalog.earthMotionLab?.views || []).find((view) => view.id === viewId) || catalog.earthMotionLab?.views?.[0] || null;
}

function getEarthMotionPoint(view = getEarthMotionView(), pointId = state.earthMotionPointId) {
  return view?.points?.find((point) => point.id === pointId) || view?.points?.[0] || null;
}

function setEarthMotionScenario(viewId, pointId) {
  const view = getEarthMotionView(viewId);
  if (!view) return;
  state.earthMotionViewId = view.id;
  state.earthMotionPointId = getEarthMotionPoint(view, pointId)?.id || view.points[0].id;
  state.activeEarthMotionAttemptId = null;
  saveState();
  render();
}

function chooseEarthMotionScenario(offset = 0) {
  const scenarios = (catalog.earthMotionLab?.views || []).flatMap((view) => view.points.map((point) => ({ view, point })));
  if (!scenarios.length) return null;
  const currentIndex = scenarios.findIndex(({ view, point }) => view.id === state.earthMotionViewId && point.id === state.earthMotionPointId);
  return scenarios[((currentIndex < 0 ? 0 : currentIndex) + offset + scenarios.length) % scenarios.length];
}

function earthMotionMasteryStatus() {
  const reviewHours = catalog.earthMotionLab?.review_after_hours || 48;
  const confirmedFull = [...state.earthMotionAttempts]
    .filter((attempt) => attempt.score === 4 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: "需要两次满分并由家长确认。", mastered: false };
  const latest = confirmedFull[confirmedFull.length - 1];
  const earlier = [...confirmedFull].reverse().find((attempt) => new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000);
  return earlier
    ? { label: "延迟复测通过", detail: `两次确认间隔已达到${reviewHours}小时。`, mastered: true }
    : { label: "等待延迟复测", detail: `满分记录需间隔至少${reviewHours}小时。`, mastered: false };
}

function renderEarthMotionDiagram(view, point, showAnswers = false) {
  const isPolar = view.id !== "equator";
  const pointPosition = point.id === "upper" ? { x: 360, y: 75, label: "A" } : point.id === "lower" ? { x: 360, y: 355, label: "B" } : { x: 360, y: 215, label: "C" };
  const rotationPath = view.id === "north"
    ? "M500 215 A140 140 0 0 0 220 215"
    : view.id === "south"
      ? "M220 215 A140 140 0 0 1 500 215"
      : "M255 255 C310 285 410 285 465 255";
  return `
    <svg class="earth-motion-svg" viewBox="0 0 720 430" role="img" aria-label="${escapeHtml(view.name)}晨昏线观察模型">
      <defs>
        <filter id="earth-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#10283c" flood-opacity=".18" /></filter>
        <marker id="ray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#e6a33e" /></marker>
        <marker id="motion-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0L9 4.5 0 9Z" fill="#ed8a3b" /></marker>
        <clipPath id="earth-clip"><circle cx="360" cy="215" r="140" /></clipPath>
      </defs>
      <rect class="space-bg" width="720" height="430" rx="24" />
      <g class="sun-rays" aria-hidden="true">
        ${[125, 170, 215, 260, 305].map((y) => `<line x1="585" y1="${y}" x2="505" y2="${y}" marker-end="url(#ray-arrow)" />`).join("")}
      </g>
      <g class="sun-symbol" aria-hidden="true"><circle cx="642" cy="215" r="48" /><circle cx="642" cy="215" r="61" /></g>
      <text class="sun-label" x="642" y="220" text-anchor="middle">太阳</text>
      <g filter="url(#earth-shadow)">
        <circle class="earth-day" cx="360" cy="215" r="140" />
        <path class="earth-night" d="M360 75A140 140 0 0 0 360 355Z" />
        <line class="terminator-line" x1="360" y1="75" x2="360" y2="355" />
        ${isPolar ? `<g class="polar-grid"><circle cx="360" cy="215" r="92" /><circle cx="360" cy="215" r="47" /><path d="M220 215H500M360 75V355" /></g><text class="pole-label" x="360" y="223" text-anchor="middle">${view.id === "north" ? "N" : "S"}</text>` : `<g class="side-grid"><ellipse cx="360" cy="215" rx="140" ry="42" /><path d="M360 75V355" /></g><text class="axis-label" x="372" y="94">N</text><text class="axis-label" x="372" y="346">S</text><text class="axis-label" x="438" y="204">赤道</text>`}
      </g>
      <g class="target-point" aria-label="${escapeHtml(point.name)}"><circle cx="${pointPosition.x}" cy="${pointPosition.y}" r="15" /><text x="${pointPosition.x}" y="${pointPosition.y + 5}" text-anchor="middle">${pointPosition.label}</text></g>
      ${showAnswers ? `<path class="motion-path" d="${rotationPath}" marker-end="url(#motion-arrow)" /><text class="motion-label" x="360" y="405" text-anchor="middle">${escapeHtml(view.name)}：${escapeHtml(view.rotation_answer)}</text><text class="hemisphere-label night" x="285" y="220" text-anchor="middle">夜半球</text><text class="hemisphere-label day" x="435" y="220" text-anchor="middle">昼半球</text><g class="boundary-result"><rect x="250" y="22" width="220" height="35" rx="17" /><text x="360" y="45" text-anchor="middle">${escapeHtml(point.name)} · ${escapeHtml(point.boundary_answer)}</text></g>` : `<g class="prediction-lock"><rect x="260" y="381" width="200" height="31" rx="15" /><text x="360" y="402" text-anchor="middle">自转方向与界线名称待预测</text></g>`}
    </svg>
  `;
}

function renderMotionChoice(name, values) {
  return `<div class="motion-choice-grid">${values.map((value) => `<label><input type="radio" name="${name}" value="${value}" /> <span>${value}</span></label>`).join("")}</div>`;
}

function renderEarthMotionLab() {
  const view = getEarthMotionView();
  const point = getEarthMotionPoint(view);
  if (!view || !point) { app.innerHTML = `<section class="card empty">晨昏线实验数据尚未加载。</section>`; return; }
  state.earthMotionViewId = view.id;
  state.earthMotionPointId = point.id;
  const activeAttempt = getEarthMotionAttempt(state.activeEarthMotionAttemptId);
  if (activeAttempt) return renderEarthMotionResult(activeAttempt);
  app.innerHTML = `
    <div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(view.id)}-${escapeHtml(point.id)}</div>
    <h2 class="page-title">晨昏线与观察视角实验室</h2>
    <p class="page-subtitle">先确定“从哪里看”，再沿自转方向判断一个地点将进入白昼还是黑夜。</p>
    <div class="motion-view-tabs" aria-label="选择观察视角">
      ${catalog.earthMotionLab.views.map((item) => `<button class="${item.id === view.id ? "active" : ""}" data-action="set-earth-motion-view" data-view-id="${escapeHtml(item.id)}">${escapeHtml(item.short_name)}</button>`).join("")}
    </div>
    <section class="card motion-lab-card">
      <div class="motion-lab-layout">
        <div class="motion-model-panel">
          <div class="motion-model-head"><div><span class="pill orange">当前视角</span><h3>${escapeHtml(view.name)}</h3></div><span class="pill">${escapeHtml(point.name)}</span></div>
          ${renderEarthMotionDiagram(view, point)}
          <p class="motion-hint">${escapeHtml(view.view_hint)} 图中答案标注将在提交预测后出现。</p>
          ${view.points.length > 1 ? `<div class="motion-point-tabs" aria-label="选择晨昏线交点">${view.points.map((item) => `<button class="${item.id === point.id ? "active" : ""}" data-action="set-earth-motion-point" data-point-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`).join("")}</div>` : ""}
        </div>
        <form id="earth-motion-form" class="motion-prediction-panel">
          <div class="notice">先作答并写出判断链，再解锁自转箭头、昼夜标签和界线名称。</div>
          <fieldset><legend>1. 面向太阳的是哪一半？</legend>${renderMotionChoice("motion-sun-side", ["左半球", "右半球"])}</fieldset>
          <fieldset><legend>2. 从当前视角看，地球怎样自转？</legend>${renderMotionChoice("motion-rotation", ["顺时针", "逆时针", "自西向东"])}</fieldset>
          <fieldset><legend>3. ${escapeHtml(point.name)} 正在：</legend>${renderMotionChoice("motion-transition", ["进入白昼", "进入黑夜"])}</fieldset>
          <fieldset><legend>4. 该交界属于：</legend>${renderMotionChoice("motion-boundary", ["晨线", "昏线"])}</fieldset>
          <label class="field-label" for="motion-reasoning">写出判断链</label>
          <textarea id="motion-reasoning" name="motion-reasoning" placeholder="例如：先确定观察视角；再判断自转方向；沿运动方向看该点从哪一侧进入哪一侧；最后命名晨线或昏线。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交预测，播放判断链</button>
        </form>
      </div>
    </section>
  `;
}

function renderEarthMotionResult(attempt) {
  const view = getEarthMotionView(attempt.view_id);
  const point = getEarthMotionPoint(view, attempt.point_id);
  if (!view || !point) return;
  const checks = attempt.checks || {};
  app.innerHTML = `
    <div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
    <h2 class="page-title">把晨昏线还原成运动过程</h2>
    <p class="page-subtitle">本轮 ${attempt.score}/4。一次满分不是掌握，还需要家长确认和48小时后的换视角复测。</p>
    <section class="card motion-result-card">
      <div class="motion-result-layout">
        <div>${renderEarthMotionDiagram(view, point, true)}</div>
        <div>
          <div class="lab-check-grid">
            ${renderLabAnswerRow("受光半球", attempt.answers.sun_side, view.sun_facing_side, checks.sun_side)}
            ${renderLabAnswerRow("自转方向", attempt.answers.rotation, view.rotation_answer, checks.rotation)}
            ${renderLabAnswerRow("昼夜变化", attempt.answers.transition, point.transition_answer, checks.transition)}
            ${renderLabAnswerRow("界线名称", attempt.answers.boundary, point.boundary_answer, checks.boundary)}
          </div>
          <div class="answer-box ${attempt.score === 4 ? "correct" : "wrong"}"><strong>${escapeHtml(point.boundary_answer)}的判断链</strong><br/>${escapeHtml(point.explanation)}</div>
          <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>
          ${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div></div>` : `<div class="notice">四步均正确。请家长追问：如果换到另一极上空，为什么顺逆时针会改变？</div>`}
          <div class="btn-row"><button class="btn orange" data-action="next-earth-motion">换视角继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
        </div>
      </div>
    </section>
  `;
}

function getSolarSeasonDate(dateId = state.solarSeasonDateId) {
  return (catalog.solarSeasonLab?.dates || []).find((item) => item.id === dateId) || catalog.solarSeasonLab?.dates?.[0] || null;
}

function getSolarSeasonPlace(placeId = state.solarSeasonPlaceId) {
  return (catalog.solarSeasonLab?.places || []).find((item) => item.id === placeId) || catalog.solarSeasonLab?.places?.[0] || null;
}

function setSolarSeasonScenario(dateId, placeId) {
  const date = getSolarSeasonDate(dateId);
  const place = getSolarSeasonPlace(placeId);
  if (!date || !place) return;
  state.solarSeasonDateId = date.id;
  state.solarSeasonPlaceId = place.id;
  state.activeSolarSeasonAttemptId = null;
  saveState(); render();
}

function chooseSolarSeasonScenario(offset = 0) {
  const dates = catalog.solarSeasonLab?.dates || [];
  const places = catalog.solarSeasonLab?.places || [];
  const scenarios = dates.flatMap((date, dateIndex) => {
    const place = places[(dateIndex * 2 + 2) % Math.max(places.length, 1)];
    return place ? [{ date, place }] : [];
  });
  if (!scenarios.length) return null;
  const currentIndex = scenarios.findIndex(({ date, place }) => date.id === state.solarSeasonDateId && place.id === state.solarSeasonPlaceId);
  return scenarios[((currentIndex < 0 ? 0 : currentIndex) + offset + scenarios.length) % scenarios.length];
}

function solarSeasonMasteryStatus() {
  const reviewHours = catalog.solarSeasonLab?.review_after_hours || 48;
  const confirmedFull = [...state.solarSeasonAttempts]
    .filter((attempt) => attempt.score === 4 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: "需要两次不同日期情境满分并由家长确认。", mastered: false };
  const latest = confirmedFull[confirmedFull.length - 1];
  const earlier = [...confirmedFull].reverse().find((attempt) => attempt.date_id !== latest.date_id && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000);
  return earlier
    ? { label: "延迟复测通过", detail: `不同日期的两次确认已间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换日期复测", detail: `需换二分二至日情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderSolarSeasonLab() {
  const feature = window.OrangeCoach?.features?.solarSeason;
  const date = getSolarSeasonDate();
  const place = getSolarSeasonPlace();
  if (!feature || !date || !place) { app.innerHTML = `<section class="card empty">太阳季节实验数据尚未加载。</section>`; return; }
  state.solarSeasonDateId = date.id;
  state.solarSeasonPlaceId = place.id;
  const attempt = getSolarSeasonAttempt(state.activeSolarSeasonAttemptId);
  app.innerHTML = attempt
    ? feature.renderResult({ lab: catalog.solarSeasonLab, date: getSolarSeasonDate(attempt.date_id), place: getSolarSeasonPlace(attempt.place_id), attempt })
    : feature.renderLab({ lab: catalog.solarSeasonLab, date, place });
}

function render() {
  window.scrollTo(0, 0);
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.route === state.route));
  if (state.route === "retest") return renderRetest();
  if (state.route === "time-lab") return renderTimeLab();
  if (state.route === "earth-motion-lab") return renderEarthMotionLab();
  if (state.route === "solar-season-lab") return renderSolarSeasonLab();
  if (state.route === "train") return renderTrain();
  if (state.route === "projects") return renderProjects();
  if (state.route === "mastery") return renderMastery();
  if (state.route === "parent") return renderParent();
  return renderToday();
}

function renderToday() {
  const feature = window.OrangeCoach?.features?.home;
  if (!feature) { app.innerHTML = `<section class="card empty">首页功能未加载，请刷新页面。</section>`; return; }
  app.innerHTML = feature.renderToday({
    recommendation: getTodayRecommendation(),
    stats: [
      { value: completedToday(), label: "今日完成" },
      { value: state.attempts.length + state.retestAttempts.length + state.timeLabAttempts.length + state.earthMotionAttempts.length + state.solarSeasonAttempts.length, label: "学习证据" },
      { value: countPendingParentReviews(), label: "待家长确认" }
    ],
    recent: getRecentEvidence().slice(0, 3)
  });
}

function countPendingParentReviews() {
  return [...state.attempts, ...state.retestAttempts, ...state.timeLabAttempts, ...state.earthMotionAttempts, ...state.solarSeasonAttempts]
    .filter((attempt) => String(attempt.parent_review_status || "").startsWith("待")).length;
}

function projectStatus(project) {
  if (project.status_kind === "earth_motion") {
    const latest = latestEarthMotionAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.earthMotionAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下观察视角与晨昏线判断证据" };
  }
  if (project.status_kind === "time_lab") {
    const latest = latestTimeLabAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.timeLabAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下地方时、区时与日期判断证据" };
  }
  if (project.status_kind === "solar_season") {
    const latest = latestSolarSeasonAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.solarSeasonAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下直射点、昼长与正午太阳高度判断证据" };
  }
  if (project.status_kind === "diagnostic") {
    const latest = latestAttempts()[0];
    return latest
      ? { status_label: `${state.attempts.length} 条`, status_tone: latest.is_correct ? "green" : "orange", status_detail: `最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: `${catalog.questions.length} 道题已登记，作答前不显示答案` };
  }
  const latest = latestRetestAttempts()[0];
  return latest
    ? { status_label: `${state.retestAttempts.length} 次`, status_tone: latest.parent_review_status === "已掌握" ? "green" : "orange", status_detail: `最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
    : { status_label: "待建立", status_tone: "", status_detail: `${catalog.retests.length} 组延迟复测等待形成证据` };
}

function projectModels() {
  return [...catalog.projects]
    .sort((a, b) => a.order - b.order)
    .map((project) => ({ ...project, ...projectStatus(project) }));
}

function getTodayRecommendation() {
  const projects = projectModels();
  const byId = (id) => projects.find((project) => project.id === id);
  const latestMotion = latestEarthMotionAttempts()[0];
  const latestSolar = latestSolarSeasonAttempts()[0];
  const latestTime = latestTimeLabAttempts()[0];
  let project;
  let reason;
  if (!latestMotion) {
    project = byId("earth-motion-lab");
    reason = "先建立观察视角与自转方向的基础判断链，提交前不会显示运动箭头。";
  } else if (!latestSolar) {
    project = byId("solar-season-lab");
    reason = "已有晨昏线基础，继续把日期、太阳直射点和昼夜长短连成一条判断链。";
  } else if (!latestTime) {
    project = byId("time-zone-lab");
    reason = "已有地球运动记录，今天换到世界地图，用具体地点理解地方时与区时。";
  } else if (latestMotion.score < 4 || latestMotion.parent_review_status === "需再练") {
    project = byId("earth-motion-lab");
    reason = "最近一次晨昏线记录仍有步骤需要复盘，换视角再验证比继续看解析更有效。";
  } else if (latestSolar.score < 4 || latestSolar.parent_review_status === "需再练") {
    project = byId("solar-season-lab");
    reason = "最近一次太阳季节实验仍有候选错因，换日期和半球再次验证。";
  } else if (latestTime.score < 4 || latestTime.parent_review_status === "需再练") {
    project = byId("time-zone-lab");
    reason = "最近一次时区实验仍有候选错因，换经度和时刻检查能否迁移。";
  } else {
    project = byId("diagnostic-questions");
    reason = "三个互动实验都已有记录，继续用一道新题检查知识能否独立应用。";
  }
  return project ? { ...project, reason, status: project.status_detail } : null;
}

function evidenceTone(status) {
  if (["已确认", "已掌握"].includes(status)) return "green";
  if (status === "需教师复核") return "red";
  return "orange";
}

function getRecentEvidence() {
  const diagnostic = state.attempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: getQuestion(attempt.question_id)?.title || attempt.question_id,
    meta: `诊断题 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const timeLab = state.timeLabAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${longitudeLabel(attempt.longitude)} · 时区实验`,
    meta: `${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const motion = state.earthMotionAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${getEarthMotionView(attempt.view_id)?.name || attempt.view_id} · 晨昏线实验`,
    meta: `${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const solar = state.solarSeasonAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${getSolarSeasonDate(attempt.date_id)?.name || attempt.date_id} · ${getSolarSeasonPlace(attempt.place_id)?.name || attempt.place_id}`,
    meta: `太阳季节实验 · ${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const retests = state.retestAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: getRetest(attempt.retest_id)?.title || attempt.retest_id,
    meta: `延迟复测 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  return [...diagnostic, ...timeLab, ...motion, ...solar, ...retests]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
}

function renderProjects() {
  const feature = window.OrangeCoach?.features?.home;
  if (!feature) { app.innerHTML = `<section class="card empty">项目导航未加载，请刷新页面。</section>`; return; }
  app.innerHTML = feature.renderProjects({ projects: projectModels() });
}

function renderAttemptSummary(attempt) {
  const question = getQuestion(attempt.question_id);
  const topic = question ? getTopic(question.topic_id) : null;
  return `<div class="attempt-item"><div class="attempt-head"><strong>${escapeHtml(question?.title || attempt.question_id)}</strong><span class="pill ${attempt.is_correct ? "green" : "red"}">${attempt.is_correct ? "正确" : "待复盘"}</span></div><div class="topic-meta">${escapeHtml(topic?.name || "")} · ${formatDate(attempt.submitted_at)} · 家长：${escapeHtml(attempt.parent_review_status)}</div></div>`;
}

function renderTrain() {
  const question = getActiveQuestion();
  if (!question) { app.innerHTML = `<section class="card empty">暂无题目。</section>`; return; }
  state.currentQuestionId = question.id;
  const session = state.activeSession;
  if (session && session.questionId === question.id) return renderResult(question, session);
  app.innerHTML = `
    <div class="topic-meta">${escapeHtml(getTopic(question.topic_id)?.category || "")} · ${escapeHtml(getTopic(question.topic_id)?.name || "")} · ${escapeHtml(question.id)}</div>
    <h2 class="page-title">${escapeHtml(question.title)}</h2>
    <p class="page-subtitle">请先独立完成。没有写出理由，就暂时不算完成。</p>
    <section class="card">
      <div class="question-stem">${escapeHtml(question.stem)}</div>
      <form id="answer-form">
        <div class="option-list">${question.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option.id)}" /> <span><strong>${escapeHtml(option.id)}.</strong> ${escapeHtml(option.text)}</span></label>`).join("")}</div>
        <label class="field-label" for="reasoning">你为什么这样选？</label>
        <textarea id="reasoning" placeholder="写出你的判断链，例如：先判断……再根据……所以……"></textarea>
        <label class="field-label">你对答案的把握有多大？</label>
        <div class="confidence">${[1, 2, 3, 4, 5].map((value) => `<label><input type="radio" name="confidence" value="${value}" ${value === 3 ? "checked" : ""}/> ${value}</label>`).join("")}</div>
        <div class="btn-row"><button class="btn" type="submit">提交并查看诊断</button><button class="btn secondary" type="button" data-action="goto" data-route="today">暂不作答</button></div>
      </form>
    </section>
  `;
}

function renderResult(question, session) {
  const selected = question.options.find((option) => option.id === session.selectedOption);
  const correct = session.selectedOption === question.answer;
  const candidate = correct ? null : question.error_map[session.selectedOption];
  const prompt = makeAiPrompt(question, session, candidate);
  app.innerHTML = `
    <div class="topic-meta">${escapeHtml(question.id)} · ${escapeHtml(getTopic(question.topic_id)?.name || "")}</div>
    <h2 class="page-title">${correct ? "答对了，但还要看理由" : "这道题值得复盘"}</h2>
    <section class="card">
      <p><strong>你的选择：</strong>${escapeHtml(session.selectedOption)}. ${escapeHtml(selected?.text || "")}</p>
      <p><strong>你的理由：</strong></p><div class="quote">${escapeHtml(session.reasoning)}</div>
      <div class="answer-box ${correct ? "correct" : "wrong"}"><strong>${correct ? "结果：正确" : `结果：不正确，正确答案是 ${escapeHtml(question.answer)}`}</strong><br/>${escapeHtml(question.explanation)}</div>
      ${candidate ? `<div class="diagnosis"><strong>AI/题目给出的错因候选：${escapeHtml(candidate.tag)}</strong><br/>${escapeHtml(candidate.diagnosis)}<br/><br/><strong>追问：</strong>${escapeHtml(candidate.follow_up)}</div>` : `<div class="diagnosis"><strong>下一步：</strong>请用自己的话解释为什么不是另外三个选项，防止“碰巧答对”。</div>`}
    </section>
    <section class="card">
      <h3>把这道题交给 AI 诊断</h3>
      <p class="small">复制下面的提示词到 ChatGPT。AI 的结果不是最终结论，保存后还要由家长审核。</p>
      <textarea id="ai-prompt" readonly>${escapeHtml(prompt)}</textarea>
      <div class="btn-row"><button class="btn secondary" data-action="copy-ai">复制诊断提示词</button></div>
      <label class="field-label" for="ai-response">把 AI 返回的诊断粘贴回来（可选）</label>
      <textarea id="ai-response" placeholder="粘贴 AI 的诊断、追问和微任务"></textarea>
      <div class="btn-row"><button class="btn orange" data-action="save-attempt">保存，交给家长审核</button></div>
    </section>
  `;
}

function renderTimeLab() {
  const scenario = getTimeLabScenario();
  if (!scenario) { app.innerHTML = `<section class="card empty">时区实验数据尚未加载。</section>`; return; }
  const activeAttempt = getTimeLabAttempt(state.activeTimeLabAttemptId);
  if (activeAttempt) return renderTimeLabResult(scenario, activeAttempt);
  const longitude = scenario.starting_longitude;
  app.innerHTML = `
    <div class="topic-meta">自然地理 · 时区与地方时 · ${escapeHtml(scenario.id)}</div>
    <h2 class="page-title">时区实验室</h2>
    <p class="page-subtitle">先在地图上找到地点，再预测时间。选择经度不会显示答案，提交后才会看到三种时间如何联动。</p>
    <section class="card time-lab-card">
      <div class="lab-reference"><span>全球参考时刻</span><strong>${escapeHtml(scenario.utc_date)} UTC ${formatClock(scenario.utc_minutes)}</strong></div>
      <div class="lab-model-note">理论模型：地方时按经度每1°差4分钟；区时按最近的15°中央经线计算。不考虑均时差、夏令时和法定边界。</div>
      <div class="longitude-heading"><strong>选择目标地点或经度</strong><span>地图建立空间感，滑杆用于精确选择</span></div>
      ${renderWorldMap(longitude)}
      <div class="clock-grid locked-clocks" aria-label="提交预测后解锁的时间结果">
        <div><span>UTC</span><strong>${formatClock(scenario.utc_minutes)}</strong><small>${escapeHtml(scenario.utc_date)}</small></div>
        <div><span>地方时</span><strong>--:--</strong><small>提交后解锁</small></div>
        <div><span>理论区时</span><strong>--:--</strong><small>提交后解锁</small></div>
      </div>
      <form id="time-lab-form">
        <input type="hidden" name="scenario-id" value="${escapeHtml(scenario.id)}" />
        <label class="field-label">1. 目标经线位于0°经线的哪一侧？</label>
        <div class="prediction-options">
          ${["东经", "西经", "本初子午线"].map((value) => `<label><input type="radio" name="lab-relation" value="${value}" /> ${value}</label>`).join("")}
        </div>
        <div class="lab-answer-grid">
          <label><span>2. 目标经度的地方时（时：分）</span><span class="time-parts"><input name="lab-local-time-hour" class="time-input" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="时" autocomplete="off" aria-label="地方时小时" data-time-part /><span class="time-separator" aria-hidden="true">:</span><input name="lab-local-time-minute" class="time-input" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="分" autocomplete="off" aria-label="地方时分钟" data-time-part /></span></label>
          <label><span>3. 目标经度采用的理论区时（时：分）</span><span class="time-parts"><input name="lab-zone-time-hour" class="time-input" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="时" autocomplete="off" aria-label="理论区时小时" data-time-part /><span class="time-separator" aria-hidden="true">:</span><input name="lab-zone-time-minute" class="time-input" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="分" autocomplete="off" aria-label="理论区时分钟" data-time-part /></span></label>
        </div>
        <label class="field-label" for="lab-date-relation">4. 理论区时相对UTC所示日期是：</label>
        <select id="lab-date-relation" name="lab-date-relation">
          <option value="">请选择</option><option>前一天</option><option>同一天</option><option>后一天</option>
        </select>
        <label class="field-label" for="lab-reasoning">写出你的判断链</label>
        <textarea id="lab-reasoning" name="lab-reasoning" placeholder="例如：目标地在东；经度差×4分钟得到地方时；经度÷15°确定理论时区；最后检查是否跨0时。"></textarea>
        <div class="btn-row"><button class="btn orange" type="submit">提交预测，解锁联动</button><button class="btn secondary" type="button" data-action="goto" data-route="today">暂不作答</button></div>
      </form>
    </section>
  `;
}

function renderLabAnswerRow(label, userAnswer, correctAnswer, passed) {
  return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
}

function renderTimeLabResult(scenario, attempt) {
  const correct = attempt.correct_answers;
  const checks = attempt.checks || {};
  const localFormulaMinutes = Math.abs(attempt.longitude) * 4;
  app.innerHTML = `
    <div class="topic-meta">${escapeHtml(scenario.id)} · 已形成候选诊断</div>
    <h2 class="page-title">同一瞬间，三种时间各有任务</h2>
    <p class="page-subtitle">本轮 ${attempt.score}/4。分数只用于定位步骤，家长确认和延迟复测后才能判断掌握。</p>
    <section class="card time-lab-card">
      <div class="clock-grid result-clocks">
        <div><span>UTC · 全球参照</span><strong>${formatClock(scenario.utc_minutes)}</strong><small>${escapeHtml(scenario.utc_date)}</small></div>
        <div><span>${longitudeLabel(attempt.longitude)} · 地方时</span><strong>${escapeHtml(correct.local_time)}</strong><small>${escapeHtml(correct.local_date_relation)}</small></div>
        <div><span>${escapeHtml(correct.zone_name)} · 区时</span><strong>${escapeHtml(correct.zone_time)}</strong><small>${escapeHtml(correct.date_relation)}</small></div>
      </div>
      <div class="lab-formula-grid">
        <div><span>地方时</span><strong>UTC ${attempt.longitude >= 0 ? "+" : "−"} ${localFormulaMinutes}分钟</strong><small>${Math.abs(attempt.longitude)}° × 4分钟</small></div>
        <div><span>理论区时</span><strong>${escapeHtml(correct.zone_name)} · UTC${correct.zone_index >= 0 ? "+" : "−"}${Math.abs(correct.zone_index)}</strong><small>经度÷15°，取最近时区</small></div>
        <div><span>日期检查</span><strong>${escapeHtml(correct.date_relation)}</strong><small>换算后检查是否跨0时/24时</small></div>
      </div>
      <div class="lab-check-grid">
        ${renderLabAnswerRow("东西位置", attempt.answers.relation, correct.relation, checks.relation)}
        ${renderLabAnswerRow("地方时", attempt.answers.local_time, correct.local_time, checks.local_time)}
        ${renderLabAnswerRow("理论区时", attempt.answers.zone_time, correct.zone_time, checks.zone_time)}
        ${renderLabAnswerRow("区时日期", attempt.answers.date_relation, correct.date_relation, checks.date_relation)}
      </div>
      <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>
      ${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div></div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>仍需用自己的话解释地方时与区时为什么可能不同，并在延迟复测中再次验证。</div>`}
      <div class="btn-row"><button class="btn orange" data-action="next-time-lab">换一组继续预测</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
    </section>
  `;
}

function renderDatasetTable(dataset) {
  return `<div class="data-table-wrap"><table class="data-table"><caption>${escapeHtml(dataset.title)}</caption><thead><tr>${dataset.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${dataset.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderRetest() {
  const retest = getRetest(state.currentRetestId) || catalog.retests[0];
  if (!retest) { app.innerHTML = `<section class="card empty">暂无复测任务。</section>`; return; }
  state.currentRetestId = retest.id;
  const isTimeRetest = retest.source_topic_id === "physical.earth.time";
  app.innerHTML = `
    <div class="topic-meta">原创变式复测 · ${escapeHtml(retest.id)}</div>
    <h2 class="page-title">${escapeHtml(retest.title)}</h2>
    <p class="page-subtitle">${escapeHtml(retest.purpose)}</p>
    <section class="card">
      <div class="notice">${isTimeRetest ? "先写对象、差值、方向和日期，再完成解释。" : "先看变量、单位和时间尺度，再写总体趋势。"}提交前不显示评分点。</div>
      <p>${escapeHtml(retest.context)}</p>
      ${renderDatasetTable(retest.dataset)}
      <form id="retest-form">
        ${retest.questions.map((question, index) => `<div class="retest-question"><p><strong>${index + 1}. ${escapeHtml(question.prompt)}</strong> <span class="small">${question.max_points}分</span></p><textarea id="retest-answer-${escapeHtml(question.id)}" data-question-id="${escapeHtml(question.id)}" placeholder="按得分点分序作答"></textarea></div>`).join("")}
        <label class="field-label">你对这组答案的把握有多大？</label>
        <div class="confidence">${[1, 2, 3, 4, 5].map((value) => `<label><input type="radio" name="retest-confidence" value="${value}" ${value === 3 ? "checked" : ""}/> ${value}</label>`).join("")}</div>
        <div class="btn-row"><button class="btn" type="submit">提交，交给家长核对</button><button class="btn secondary" type="button" data-action="goto" data-route="mastery">暂不作答</button></div>
      </form>
    </section>
  `;
}

function renderMastery() {
  const latestLab = latestTimeLabAttempts()[0];
  const latestMotion = latestEarthMotionAttempts()[0];
  const latestSolar = latestSolarSeasonAttempts()[0];
  const motionMastery = earthMotionMasteryStatus();
  const solarMastery = solarSeasonMasteryStatus();
  app.innerHTML = `
    <h2 class="page-title">掌握与复测</h2>
    <p class="page-subtitle">百分比只是提示，不代表真正掌握。真正的证据来自延迟复测和能否讲清推理链。</p>
    <section class="card"><div class="topic-list">${catalog.topics.map((topic) => {
      const stats = topicStats(topic);
      return `<div class="topic-item"><div class="topic-head"><div><strong>${escapeHtml(topic.name)}</strong><div class="topic-meta">${escapeHtml(topic.category)} · ${stats.attempts.length ? `${stats.attempts.length} 次作答` : "尚未开始"}</div></div><span class="pill ${stats.ratio >= 70 ? "green" : stats.attempts.length ? "orange" : ""}">${stats.attempts.length ? `${stats.ratio}%` : "待建立"}</span></div><div class="progress"><span style="width:${stats.ratio}%"></span></div><div class="topic-meta">${escapeHtml(topic.description)}</div></div>`;
    }).join("")}</div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地球运动专项</span><h3>视角—方向—晨昏线</h3></div><span class="pill ${motionMastery.mastered ? "green" : "orange"}">${escapeHtml(motionMastery.label)}</span></div><p class="small">${latestMotion ? `最近实验：${escapeHtml(getEarthMotionView(latestMotion.view_id)?.name || latestMotion.view_id)} · ${latestMotion.score}/4 · ${escapeHtml(latestMotion.parent_review_status)} · ${formatDate(latestMotion.submitted_at)}` : "先完成一次晨昏线实验，留下观察视角和判断链。"}</p><p class="small">${escapeHtml(motionMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-earth-motion">进入晨昏线实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地球公转专项</span><h3>日期—直射点—昼长—太阳高度</h3></div><span class="pill ${solarMastery.mastered ? "green" : "orange"}">${escapeHtml(solarMastery.label)}</span></div><p class="small">${latestSolar ? `最近实验：${escapeHtml(getSolarSeasonDate(latestSolar.date_id)?.name || latestSolar.date_id)} · ${escapeHtml(getSolarSeasonPlace(latestSolar.place_id)?.name || latestSolar.place_id)} · ${latestSolar.score}/4 · ${escapeHtml(latestSolar.parent_review_status)} · ${formatDate(latestSolar.submitted_at)}` : "先完成一次太阳季节实验，留下直射点、昼长和正午太阳高度判断链。"}</p><p class="small">${escapeHtml(solarMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-solar-season">进入太阳季节实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">时区专项</span><h3>预测—观察—解释</h3></div>${latestLab ? `<span class="pill ${latestLab.score >= 3 ? "green" : "orange"}">${latestLab.score}/4</span>` : `<span class="pill">待开始</span>`}</div><p class="small">${latestLab ? `最近实验：${longitudeLabel(latestLab.longitude)} · ${escapeHtml(latestLab.parent_review_status)} · ${formatDate(latestLab.submitted_at)}` : "先完成一次时区实验，再进入延迟复测。"}</p><div class="btn-row"><button class="btn orange" data-action="start-time-lab">进入时区实验室</button><button class="btn secondary" data-action="start-time-diagnostic">做8题诊断</button></div></section>
    <section class="card"><h3>需要复盘的题</h3>${latestAttempts().filter((attempt) => !attempt.is_correct || attempt.parent_review_status !== "已确认").slice(0, 8).map(renderAttemptSummary).join("") || `<div class="empty">目前没有待复盘记录。</div>`}</section>
    ${catalog.retests.map((retest) => {
      const latestRetest = latestRetestAttempts().find((attempt) => attempt.retest_id === retest.id);
      const label = retest.source_topic_id === "physical.earth.time" ? "时区复测" : "图表专项";
      const intro = retest.source_topic_id === "physical.earth.time" ? "换经度、换时刻，检查三种时间与日期。" : "来自真实试卷第19题的换情境复测。";
      return `<section class="card"><div class="attempt-head"><div><span class="pill orange">${label}</span><h3>${escapeHtml(retest.title)}</h3></div>${latestRetest ? `<span class="pill ${latestRetest.parent_review_status === "已掌握" ? "green" : "orange"}">${escapeHtml(latestRetest.parent_review_status)}</span>` : ""}</div><p class="small">${latestRetest ? `上次得分：${latestRetest.score ?? "待核对"}/${retest.questions.reduce((sum, question) => sum + question.max_points, 0)} · ${latestRetest.next_due_at ? `下次建议 ${formatDate(latestRetest.next_due_at)}` : "等待家长审核"}` : intro}</p><div class="btn-row"><button class="btn orange" data-action="start-retest" data-retest-id="${escapeHtml(retest.id)}">开始复测</button></div></section>`;
    }).join("")}
  `;
}

function renderParent() {
  const attempts = latestAttempts();
  const retestAttempts = latestRetestAttempts();
  const timeLabAttempts = latestTimeLabAttempts();
  const earthMotionAttempts = latestEarthMotionAttempts();
  const solarSeasonAttempts = latestSolarSeasonAttempts();
  app.innerHTML = `
    <h2 class="page-title">家长审核页</h2>
    <p class="page-subtitle">只核验三件事：理由是否真实、诊断是否有证据、下一步是否可执行。</p>
    <div class="notice">家长不是每道题的讲解员，而是学习过程的质量审核员。连续 2–3 次同类错误，再考虑请老师校准。</div>
    <section class="card"><h3>真实试卷复盘</h3>${catalog.paperReviews.map(renderPaperReview).join("") || `<div class="empty">尚未录入试卷复盘。</div>`}</section>
    <section class="card"><h3>晨昏线实验审核</h3>${earthMotionAttempts.length ? `<div class="attempt-list">${earthMotionAttempts.map(renderParentEarthMotionAttempt).join("")}</div>` : `<div class="empty">橙子提交观察视角预测后，这里会出现判断链和候选错因。</div>`}</section>
    <section class="card"><h3>太阳季节实验审核</h3>${solarSeasonAttempts.length ? `<div class="attempt-list">${solarSeasonAttempts.map(renderParentSolarSeasonAttempt).join("")}</div>` : `<div class="empty">橙子提交直射点与昼长预测后，这里会出现四步判断证据。</div>`}</section>
    <section class="card"><h3>时区实验审核</h3>${timeLabAttempts.length ? `<div class="attempt-list">${timeLabAttempts.map(renderParentTimeLabAttempt).join("")}</div>` : `<div class="empty">橙子提交时区预测后，这里会出现步骤证据。</div>`}</section>
    <section class="card"><h3>专项复测审核</h3>${retestAttempts.length ? `<div class="attempt-list">${retestAttempts.map(renderParentRetestAttempt).join("")}</div>` : `<div class="empty">橙子提交专项复测后，这里会出现评分点。</div>`}</section>
    <section class="card"><h3>其他待审核记录</h3>${attempts.length ? `<div class="attempt-list">${attempts.map(renderParentAttempt).join("")}</div>` : `<div class="empty">橙子完成第一道题后，这里会出现审核记录。</div>`}</section>
    <section class="card"><div class="section-head"><div><span class="section-kicker">外部反馈</span><h3>教练批注</h3></div><span class="pill">${state.coachAnnotations.length} 条</span></div>${state.coachAnnotations.length ? `<div class="annotation-list">${[...state.coachAnnotations].reverse().map(renderCoachAnnotation).join("")}</div>` : `<div class="empty">导出学习档案并交给AI或教师批注，再导入后，批注会保存在这里。</div>`}</section>
    <section class="card data-management-card"><span class="section-kicker">可迁移学习档案</span><h3>导出、批注、再导入</h3><ol class="handoff-steps"><li>导出带精确时间戳的 JSON 学习档案；</li><li>把文件和批注说明一起交给 Codex、ChatGPT 或教师；</li><li>对方只追加 <code>coach_annotations</code>，再把文件导回本浏览器。</li></ol><div class="notice">原始作答不会因批注被覆盖。发送前请检查作答理由、家长备注等自由文本中是否含个人信息。</div>${state.lastAction ? `<p class="import-status">${escapeHtml(state.lastAction)}</p>` : ""}<div class="btn-row"><button class="btn orange" data-action="export-data">导出可批注学习档案</button><button class="btn secondary" data-action="copy-archive-guide">复制批注说明</button><label class="btn secondary" for="import-data">导入批注档案</label><input id="import-data" class="file-input" type="file" accept="application/json" data-action="import-data" /></div></section>
  `;
}

function renderCoachAnnotation(annotation) {
  const evidence = Array.isArray(annotation.evidence_refs) ? annotation.evidence_refs : [];
  return `<article class="annotation-item"><div class="attempt-head"><div><strong>${escapeHtml(annotation.scope || "学习进度批注")}</strong><div class="topic-meta">${escapeHtml(annotation.coach || "外部教练")} · ${formatDate(annotation.created_at)}</div></div><span class="pill ${annotation.status === "已确认" ? "green" : annotation.status === "需教师复核" ? "red" : "orange"}">${escapeHtml(annotation.status || "候选")}</span></div><p>${escapeHtml(annotation.observation || "未填写观察结论")}</p>${evidence.length ? `<div class="annotation-evidence">证据：${evidence.map((id) => `<code>${escapeHtml(id)}</code>`).join(" ")}</div>` : ""}<div class="next-step"><strong>下一步</strong><br/>${escapeHtml(annotation.next_step || "等待补充")}</div>${annotation.follow_up_at ? `<p class="small">建议复核：${formatDate(annotation.follow_up_at)}</p>` : ""}</article>`;
}

function makeArchiveAnnotationPrompt() {
  return `请批注我附上的“橙子地理教练”JSON学习档案。\n\n要求：\n1. 只根据档案中的作答、理由、家长审核和延迟复测证据判断；证据不足时明确写“证据不足”。\n2. 不修改 attempts、retest_attempts、time_lab_attempts、earth_motion_attempts、solar_season_attempts 等原始记录。\n3. 按 annotation_guide.expected_annotation_shape，把本次批注追加到 coach_annotations 数组。\n4. 区分“候选”“已确认”“需教师复核”，不把一次答对或一次满分当成掌握。\n5. next_step 给出一个可执行的微任务或延迟复测建议，并引用 evidence_refs。\n\n完成后请返回完整、可导入的 JSON 文件。`;
}

const ERROR_TAG_LABELS = {
  trend_generalization_missing: "趋势概括缺失",
  extreme_value_missing: "极值信息缺失",
  time_scale_mismatch: "时间尺度读错",
  answer_direction_error: "设问方向偏离",
  turning_point_missed: "转折点遗漏",
  causal_staging_missing: "分阶段因果链缺失",
  feedback_chain_incomplete: "反馈链不完整",
  "T-CONCEPT-REF": "统一参照与民用钟点混淆",
  "T-CONCEPT-LST-ZONE": "地方时与区时混淆",
  "T-LST-LON": "经度换算错误",
  "T-LST-DIR": "地方时方向错误",
  "T-ZONE-ID": "时区判断错误",
  "T-ZONE-DIR": "区时方向错误",
  "T-ZONE-RANGE": "时间段没有整体换算",
  "T-ZONE-STEP": "漏掉时区换算步骤",
  "T-DATE-CARRY": "日期进退遗漏",
  "T-DATE-IDL": "日界线方向错误",
  "T-DATE-OM": "0时经线条件错误",
  "T-ORDER": "计算顺序错误",
  "E-SUN-SIDE": "受光半球判断错误",
  "E-VIEW-ROTATION": "观察视角与自转方向对应错误",
  "E-TERM-TRANSITION": "没有沿自转方向判断昼夜变化",
  "E-TERM-NAME": "晨线、昏线命名对应错误",
  "S-DATE-DIRECT": "日期与太阳直射纬线对应错误",
  "S-HEMISPHERE-DAY": "直射半球与昼夜长短对应错误",
  "S-POLAR-RULE": "极昼极夜范围判断错误",
  "S-LATITUDE-PATTERN": "全球昼长的纬度变化方向错误",
  "S-NOON-ALTITUDE": "正午太阳高度计算错误"
};

function errorTagLabel(tag) { return ERROR_TAG_LABELS[tag] || tag; }

function renderPaperReview(review) {
  const question = review.reviewed_question;
  return `<article class="paper-review"><div class="attempt-head"><div><strong>${escapeHtml(review.title)}</strong><div class="topic-meta">${escapeHtml(review.scope)} · ${escapeHtml(review.id)}</div></div><span class="pill orange">${escapeHtml(question.diagnosis_status)}诊断</span></div><div class="score-pair"><div><span>卷面原始分</span><strong>${review.scores.raw.earned}/${review.scores.raw.max}</strong></div><div><span>标准分</span><strong>${review.scores.standard.earned}</strong></div></div><div class="notice">两种分数量尺不同，不混合计算。${escapeHtml(review.scores.standard.scale_note)}</div><h4>${escapeHtml(question.id)} · ${escapeHtml(question.title)} · ${question.earned_points}/${question.max_points}</h4><div class="diagnosis-list">${question.subquestions.map((item) => `<div class="diagnosis-item"><div class="attempt-head"><strong>${escapeHtml(item.id)}</strong><span class="pill red">${item.earned_points}/${item.max_points}</span></div><p class="small">${escapeHtml(item.answer_evidence)}</p><div>${item.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join(" ")}</div></div>`).join("")}</div><p class="small">${escapeHtml(review.source_note)}</p><div class="btn-row"><button class="btn orange" data-action="start-retest" data-retest-id="${escapeHtml(catalog.retests.find((item) => item.source_paper_review_id === review.id)?.id || "")}">开始第19题换情境复测</button></div></article>`;
}

function renderParentTimeLabAttempt(attempt) {
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${longitudeLabel(attempt.longitude)} · 时区实验</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · ${escapeHtml(attempt.scenario_id)}</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="lab-parent-summary"><span>地方时 <strong>${escapeHtml(correct.local_time)}</strong></span><span>${escapeHtml(correct.zone_name)} <strong>${escapeHtml(correct.zone_time)}</strong></span><span>日期 <strong>${escapeHtml(correct.date_relation)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个计算步骤均正确</strong><br/>请继续追问：为什么地方时和区时可能不同？</div>`}<label class="field-label" for="lab-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="lab-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="lab-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="lab-note-${escapeHtml(attempt.id)}" placeholder="例如：会算地方时，但区时仍按经度分钟计算">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-lab-review" data-attempt-id="${escapeHtml(attempt.id)}">保存实验审核</button></div></article>`;
}

function renderParentEarthMotionAttempt(attempt) {
  const view = getEarthMotionView(attempt.view_id);
  const point = getEarthMotionPoint(view, attempt.point_id);
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(view?.name || attempt.view_id)} · ${escapeHtml(point?.name || attempt.point_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 晨昏线实验</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="motion-parent-summary"><span>自转 <strong>${escapeHtml(attempt.correct_answers.rotation)}</strong></span><span>变化 <strong>${escapeHtml(attempt.correct_answers.transition)}</strong></span><span>界线 <strong>${escapeHtml(attempt.correct_answers.boundary)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：换到另一个极点上空，自转方向为什么会改变？</div>`}<label class="field-label" for="motion-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="motion-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="motion-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="motion-note-${escapeHtml(attempt.id)}" placeholder="例如：知道晨线定义，但切换南极视角后顺逆时针仍混淆">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-motion-review" data-attempt-id="${escapeHtml(attempt.id)}">保存实验审核</button></div></article>`;
}

function renderParentSolarSeasonAttempt(attempt) {
  const date = getSolarSeasonDate(attempt.date_id);
  const place = getSolarSeasonPlace(attempt.place_id);
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(date?.name || attempt.date_id)} · ${escapeHtml(place?.name || attempt.place_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 太阳直射点与昼夜长短</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="solar-parent-summary"><span>直射 <strong>${escapeHtml(correct.direct)}</strong></span><span>昼夜 <strong>${escapeHtml(correct.day_relation)}</strong></span><span>正午高度 <strong>${correct.noon_altitude}°</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：如果换到另一半球同纬度地点，哪些结论会改变？</div>`}<label class="field-label" for="solar-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="solar-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="solar-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="solar-note-${escapeHtml(attempt.id)}" placeholder="例如：能判断直射点，但不会把直射半球转化为全球昼长分布">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-solar-review" data-attempt-id="${escapeHtml(attempt.id)}">保存太阳季节审核</button></div></article>`;
}

function renderParentRetestAttempt(attempt) {
  const retest = getRetest(attempt.retest_id);
  if (!retest) return "";
  const matched = new Set(attempt.matched_rubric_ids || []);
  const total = retest.questions.reduce((sum, question) => sum + question.max_points, 0);
  return `<article class="attempt-item"><div class="attempt-head"><strong>${escapeHtml(retest.title)}</strong><span class="pill ${attempt.parent_review_status === "已掌握" ? "green" : attempt.parent_review_status === "需教师复核" ? "red" : "orange"}">${escapeHtml(attempt.parent_review_status)}</span></div><p class="small">${formatDate(attempt.submitted_at)} · 信心 ${attempt.confidence}/5 · 得分 ${attempt.score ?? "待核对"}/${total}</p>${retest.questions.map((question, index) => `<section class="rubric-review"><p><strong>${index + 1}. ${escapeHtml(question.prompt)}</strong></p><div class="quote">${escapeHtml(attempt.answers?.[question.id] || "")}</div><div class="rubric-list">${question.rubric_points.map((point) => `<label><input type="checkbox" id="rubric-${escapeHtml(attempt.id)}-${escapeHtml(point.id)}" ${matched.has(point.id) ? "checked" : ""}/> <span>${escapeHtml(point.text)}（${point.points}分）</span></label>`).join("")}</div></section>`).join("")}<label class="field-label" for="retest-verdict-${escapeHtml(attempt.id)}">家长结论</label><select id="retest-verdict-${escapeHtml(attempt.id)}"><option value="auto">按评分点自动判断</option><option ${attempt.parent_review_status === "已掌握" ? "selected" : ""}>已掌握</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="retest-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="retest-note-${escapeHtml(attempt.id)}" placeholder="例如：能看出转折，但原因没有分阶段">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-retest-review" data-attempt-id="${escapeHtml(attempt.id)}">保存复测审核</button></div>${attempt.next_due_at ? `<p class="small">下次建议复测：${formatDate(attempt.next_due_at)}</p>` : ""}</article>`;
}

function renderParentAttempt(attempt) {
  const question = getQuestion(attempt.question_id);
  const candidate = question?.error_map?.[attempt.selected_option];
  return `<article class="attempt-item"><div class="attempt-head"><strong>${escapeHtml(question?.title || attempt.question_id)}</strong><span class="pill ${attempt.is_correct ? "green" : "red"}">${attempt.is_correct ? "正确" : "错误"}</span></div><p class="small">${formatDate(attempt.submitted_at)} · 选择 ${escapeHtml(attempt.selected_option)} · 信心 ${attempt.confidence}/5</p><p><strong>橙子的理由</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>${candidate ? `<p><strong>候选错因：</strong>${escapeHtml(candidate.tag)}<br/><span class="small">${escapeHtml(candidate.diagnosis)}</span></p>` : ""}${attempt.ai_response ? `<p><strong>AI 返回</strong></p><div class="quote">${escapeHtml(attempt.ai_response)}</div>` : ""}<label class="field-label" for="verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再看" ? "selected" : ""}>需再看</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="note-${escapeHtml(attempt.id)}" placeholder="例如：能说出结论，但没有解释气压变化">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-review" data-attempt-id="${escapeHtml(attempt.id)}">保存审核</button></div></article>`;
}

function makeAiPrompt(question, session, candidate) {
  return `你是高中地理学习诊断助手，请帮助家长判断橙子的真实错因。\n\n【题目】\n${question.stem}\n${question.options.map((option) => `${option.id}. ${option.text}`).join("\n")}\n\n【正确答案】${question.answer}\n【橙子的选择】${session.selectedOption}\n【橙子的理由】${session.reasoning}\n【自评信心】${session.confidence}/5\n【题库提供的候选错因】${candidate?.tag || "答对，检查是否只是猜对"}\n\n请按以下顺序输出：\n1. 仅根据橙子的理由，判断最可能的错误环节；如果证据不足，明确写“证据不足”。\n2. 给出一个不超过两句的纠正解释，不要堆砌术语。\n3. 提出两个追问，先检查推理链，不要直接让她背答案。\n4. 给出一个 5 分钟内可以完成的微任务。\n5. 标注：家长可确认 / 需要更多证据 / 建议教师复核。\n不要把一次答题表现写成稳定能力结论。`;
}

function newId() { return `ATT-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`; }

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

document.addEventListener("click", async (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === "select-map-longitude") {
    const rect = actionTarget.getBoundingClientRect();
    const longitude = ((event.clientX - rect.left) / rect.width) * 360 - 180;
    updateLabLongitudeSelection(longitude);
    return;
  }
  if (action === "select-place") {
    updateLabLongitudeSelection(actionTarget.dataset.longitude);
    return;
  }
  if (action === "set-earth-motion-view") {
    setEarthMotionScenario(actionTarget.dataset.viewId, null);
    return;
  }
  if (action === "set-earth-motion-point") {
    setEarthMotionScenario(state.earthMotionViewId, actionTarget.dataset.pointId);
    return;
  }
  if (action === "set-solar-date") {
    setSolarSeasonScenario(actionTarget.dataset.dateId, state.solarSeasonPlaceId);
    return;
  }
  if (action === "set-solar-place") {
    setSolarSeasonScenario(state.solarSeasonDateId, actionTarget.dataset.placeId);
    return;
  }
  if (action === "goto") {
    state.route = actionTarget.dataset.route;
    saveState(); render();
  }
  if (action === "start-next") {
    state.currentQuestionId = chooseNextQuestion()?.id || null;
    state.activeSession = null;
    state.route = "train";
    saveState(); render();
  }
  if (action === "start-time-diagnostic") {
    state.currentQuestionId = chooseNextQuestionForTopic("physical.earth.time")?.id || null;
    state.activeSession = null;
    state.route = "train";
    saveState(); render();
  }
  if (action === "start-time-lab") {
    state.timeLabScenarioIndex = state.timeLabAttempts.length % Math.max(catalog.timeLab?.scenarios?.length || 1, 1);
    state.activeTimeLabAttemptId = null;
    state.route = "time-lab";
    saveState(); render();
  }
  if (action === "start-earth-motion") {
    const scenarios = (catalog.earthMotionLab?.views || []).flatMap((view) => view.points.map((point) => ({ view, point })));
    const scenario = scenarios[state.earthMotionAttempts.length % Math.max(scenarios.length, 1)];
    if (!scenario) return;
    state.earthMotionViewId = scenario.view.id;
    state.earthMotionPointId = scenario.point.id;
    state.activeEarthMotionAttemptId = null;
    state.route = "earth-motion-lab";
    saveState(); render();
  }
  if (action === "start-solar-season") {
    const dates = catalog.solarSeasonLab?.dates || [];
    const places = catalog.solarSeasonLab?.places || [];
    if (!dates.length || !places.length) return;
    const date = dates[state.solarSeasonAttempts.length % dates.length];
    const place = places[(state.solarSeasonAttempts.length * 2 + 2) % places.length];
    state.solarSeasonDateId = date.id;
    state.solarSeasonPlaceId = place.id;
    state.activeSolarSeasonAttemptId = null;
    state.route = "solar-season-lab";
    saveState(); render();
  }
  if (action === "next-time-lab") {
    state.timeLabScenarioIndex = (state.timeLabScenarioIndex + 1) % Math.max(catalog.timeLab?.scenarios?.length || 1, 1);
    state.activeTimeLabAttemptId = null;
    state.route = "time-lab";
    saveState(); render();
  }
  if (action === "next-earth-motion") {
    const next = chooseEarthMotionScenario(1);
    if (!next) return;
    state.earthMotionViewId = next.view.id;
    state.earthMotionPointId = next.point.id;
    state.activeEarthMotionAttemptId = null;
    state.route = "earth-motion-lab";
    saveState(); render();
  }
  if (action === "next-solar-season") {
    const next = chooseSolarSeasonScenario(1);
    if (!next) return;
    state.solarSeasonDateId = next.date.id;
    state.solarSeasonPlaceId = next.place.id;
    state.activeSolarSeasonAttemptId = null;
    state.route = "solar-season-lab";
    saveState(); render();
  }
  if (action === "start-retest") {
    const retestId = actionTarget.dataset.retestId;
    if (!getRetest(retestId)) return;
    state.currentRetestId = retestId;
    state.activeRetestSession = null;
    state.route = "retest";
    saveState(); render();
  }
  if (action === "copy-ai") {
    const ok = await copyText(document.querySelector("#ai-prompt")?.value || "");
    actionTarget.textContent = ok ? "已复制" : "复制失败，请长按文本复制";
    setTimeout(() => { actionTarget.textContent = "复制诊断提示词"; }, 1800);
  }
  if (action === "copy-archive-guide") {
    const ok = await copyText(makeArchiveAnnotationPrompt());
    actionTarget.textContent = ok ? "批注说明已复制" : "复制失败，请查看导出档案内说明";
    setTimeout(() => { actionTarget.textContent = "复制批注说明"; }, 1800);
  }
  if (action === "save-attempt") saveAttempt();
  if (action === "save-review") saveReview(actionTarget.dataset.attemptId);
  if (action === "save-lab-review") saveLabReview(actionTarget.dataset.attemptId);
  if (action === "save-motion-review") saveEarthMotionReview(actionTarget.dataset.attemptId);
  if (action === "save-solar-review") saveSolarSeasonReview(actionTarget.dataset.attemptId);
  if (action === "save-retest-review") saveRetestReview(actionTarget.dataset.attemptId);
  if (action === "export-data") exportData();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "solar-season-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.solarSeason;
    const date = getSolarSeasonDate();
    const place = getSolarSeasonPlace();
    if (!feature || !date || !place) return;
    const form = new FormData(event.target);
    const altitudeRaw = String(form.get("solar-noon-altitude") || "").trim();
    const answers = {
      direct: form.get("solar-direct") || "",
      day_relation: form.get("solar-day-relation") || "",
      north_pattern: form.get("solar-north-pattern") || "",
      noon_altitude: altitudeRaw === "" ? null : Number(altitudeRaw)
    };
    const reasoning = String(form.get("solar-reasoning") || "").trim();
    if (!answers.direct || !answers.day_relation || !answers.north_pattern || answers.noon_altitude == null || !Number.isFinite(answers.noon_altitude) || !reasoning) {
      return alert("请完成四项预测并写出判断链，再解锁光照结果。");
    }
    const correctAnswers = feature.calculate(date, place);
    const checks = {
      direct: answers.direct === correctAnswers.direct,
      day_relation: answers.day_relation === correctAnswers.day_relation,
      north_pattern: answers.north_pattern === correctAnswers.north_pattern,
      noon_altitude: answers.noon_altitude === correctAnswers.noon_altitude
    };
    const errorTags = [];
    if (!checks.direct) errorTags.push("S-DATE-DIRECT");
    if (!checks.day_relation) errorTags.push(["极昼", "极夜"].includes(correctAnswers.day_relation) || ["极昼", "极夜"].includes(answers.day_relation) ? "S-POLAR-RULE" : "S-HEMISPHERE-DAY");
    if (!checks.north_pattern) errorTags.push("S-LATITUDE-PATTERN");
    if (!checks.noon_altitude) errorTags.push("S-NOON-ALTITUDE");
    const attempt = {
      schema_version: "0.7.0", id: newId(), date_id: date.id, place_id: place.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.solarSeasonAttempts.push(attempt);
    state.activeSolarSeasonAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "earth-motion-form") {
    event.preventDefault();
    const view = getEarthMotionView();
    const point = getEarthMotionPoint(view);
    if (!view || !point) return;
    const form = new FormData(event.target);
    const answers = {
      sun_side: form.get("motion-sun-side") || "",
      rotation: form.get("motion-rotation") || "",
      transition: form.get("motion-transition") || "",
      boundary: form.get("motion-boundary") || ""
    };
    const reasoning = String(form.get("motion-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer) || !reasoning) {
      return alert("请完成四项预测并写出判断链，再解锁运动过程。");
    }
    const checks = {
      sun_side: answers.sun_side === view.sun_facing_side,
      rotation: answers.rotation === view.rotation_answer,
      transition: answers.transition === point.transition_answer,
      boundary: answers.boundary === point.boundary_answer
    };
    const errorTags = [];
    if (!checks.sun_side) errorTags.push("E-SUN-SIDE");
    if (!checks.rotation) errorTags.push("E-VIEW-ROTATION");
    if (!checks.transition) errorTags.push("E-TERM-TRANSITION");
    if (!checks.boundary) errorTags.push("E-TERM-NAME");
    const attempt = {
      schema_version: "0.5.0", id: newId(), view_id: view.id, point_id: point.id,
      answers, correct_answers: {
        sun_side: view.sun_facing_side,
        rotation: view.rotation_answer,
        transition: point.transition_answer,
        boundary: point.boundary_answer
      },
      checks, score: Object.values(checks).filter(Boolean).length,
      error_tags: errorTags, reasoning, submitted_at: new Date().toISOString(),
      parent_review_status: "待家长确认", parent_note: ""
    };
    state.earthMotionAttempts.push(attempt);
    state.activeEarthMotionAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "time-lab-form") {
    event.preventDefault();
    const scenario = getTimeLabScenario();
    if (!scenario) return;
    const form = new FormData(event.target);
    const longitude = Number(document.querySelector("#lab-longitude")?.value);
    const answers = {
      relation: form.get("lab-relation") || "",
      local_time: readTimeParts(form, "lab-local-time"),
      zone_time: readTimeParts(form, "lab-zone-time"),
      date_relation: form.get("lab-date-relation") || ""
    };
    const reasoning = String(form.get("lab-reasoning") || "").trim();
    if (!answers.relation || !answers.local_time || !answers.zone_time || !answers.date_relation || !reasoning) {
      return alert("请完成四项预测并写出判断链，再解锁联动结果。时间的小时和分钟请分别填写，例如11和44。");
    }
    const correctAnswers = calculateTimeLabAnswers(scenario, longitude);
    const checks = {
      relation: answers.relation === correctAnswers.relation,
      local_time: answers.local_time === correctAnswers.local_time,
      zone_time: answers.zone_time === correctAnswers.zone_time,
      date_relation: answers.date_relation === correctAnswers.date_relation
    };
    const errorTags = [];
    if (!checks.relation) errorTags.push("T-LST-DIR");
    if (!checks.local_time) errorTags.push("T-LST-LON");
    if (!checks.zone_time) errorTags.push("T-ZONE-ID");
    if (!checks.date_relation) errorTags.push("T-DATE-CARRY");
    const attempt = {
      schema_version: "0.3.0", id: newId(), scenario_id: scenario.id, longitude,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.timeLabAttempts.push(attempt);
    state.activeTimeLabAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "retest-form") {
    event.preventDefault();
    const retest = getRetest(state.currentRetestId);
    if (!retest) return;
    const answers = Object.fromEntries(retest.questions.map((question) => [question.id, document.querySelector(`#retest-answer-${CSS.escape(question.id)}`)?.value.trim() || ""]));
    if (Object.values(answers).some((answer) => !answer)) return alert("请先完成所有小问，再交给家长核对。");
    const form = new FormData(event.target);
    state.retestAttempts.push({
      id: newId(), retest_id: retest.id, answers, confidence: Number(form.get("retest-confidence")),
      submitted_at: new Date().toISOString(), matched_rubric_ids: [], score: null,
      parent_review_status: "待家长确认", parent_note: "", next_due_at: null
    });
    state.activeRetestSession = null;
    state.currentRetestId = null;
    state.route = "parent";
    saveState(); render();
    return;
  }
  if (event.target.id !== "answer-form") return;
  event.preventDefault();
  const form = new FormData(event.target);
  const selectedOption = form.get("answer");
  const reasoning = document.querySelector("#reasoning")?.value.trim();
  const confidence = Number(form.get("confidence"));
  if (!selectedOption || !reasoning) return alert("请先选择答案，并写出你的判断理由。");
  state.activeSession = { questionId: state.currentQuestionId, selectedOption, reasoning, confidence, submittedAt: new Date().toISOString() };
  saveState(); render();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-time-part]")) {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 2);
    return;
  }
  if (event.target.id !== "lab-longitude") return;
  updateLabLongitudeSelection(event.target.value);
});

document.addEventListener("change", async (event) => {
  if (event.target.dataset.action !== "import-data") return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!["0.1.0", "0.2.0", "0.3.0"].includes(imported.version) || !Array.isArray(imported.attempts)) throw new Error("版本不匹配");
    const normalized = normalizeState(imported);
    const localRecordCount = state.attempts.length + state.retestAttempts.length + state.timeLabAttempts.length + state.earthMotionAttempts.length + state.solarSeasonAttempts.length;
    const isAnnotatedArchive = ["0.6.0", COACH_CONFIG.EXPORT_SCHEMA_VERSION].includes(imported.export_schema_version) && Array.isArray(imported.coach_annotations);
    if (isAnnotatedArchive && localRecordCount > 0) {
      const mergeResult = window.OrangeCoach?.features?.learningExport?.mergeAnnotatedArchive(state, normalized);
      if (!mergeResult?.ok) throw new Error(mergeResult?.reason || "批注档案与当前记录不一致");
      state.coachAnnotations = mergeResult.coachAnnotations;
      state.lastAction = `已导入批注：新增 ${mergeResult.added} 条，原始学习记录保持不变`;
    } else {
      state.version = normalized.version;
      state.attempts = normalized.attempts;
      state.retestAttempts = normalized.retestAttempts;
      state.timeLabAttempts = normalized.timeLabAttempts;
      state.earthMotionAttempts = normalized.earthMotionAttempts;
      state.solarSeasonAttempts = normalized.solarSeasonAttempts;
      state.coachAnnotations = normalized.coachAnnotations;
      state.lastAction = `已导入学习档案：${state.coachAnnotations.length} 条教练批注`;
    }
    saveState(); render();
  } catch (error) { alert(`导入失败：${error.message}`); }
});

function saveAttempt() {
  const question = getActiveQuestion();
  const session = state.activeSession;
  if (!question || !session) return;
  const candidate = session.selectedOption === question.answer ? null : question.error_map[session.selectedOption];
  state.attempts.push({
    id: newId(), question_id: question.id, selected_option: session.selectedOption, reasoning: session.reasoning,
    confidence: session.confidence, is_correct: session.selectedOption === question.answer,
    error_tag_candidate: candidate?.tag || "答对，仍需检查是否理解", ai_response: document.querySelector("#ai-response")?.value.trim() || "",
    parent_review_status: "待家长确认", parent_note: "", submitted_at: session.submittedAt
  });
  state.activeSession = null;
  state.route = "parent";
  state.currentQuestionId = null;
  saveState(); render();
}

function saveReview(id) {
  const attempt = state.attempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveLabReview(id) {
  const attempt = state.timeLabAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#lab-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#lab-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveEarthMotionReview(id) {
  const attempt = state.earthMotionAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#motion-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#motion-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveSolarSeasonReview(id) {
  const attempt = state.solarSeasonAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#solar-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#solar-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function saveRetestReview(id) {
  const attempt = state.retestAttempts.find((item) => item.id === id);
  const retest = getRetest(attempt?.retest_id);
  if (!attempt || !retest) return;
  const rubricPoints = retest.questions.flatMap((question) => question.rubric_points);
  const matched = rubricPoints.filter((point) => document.getElementById(`rubric-${id}-${point.id}`)?.checked);
  const score = matched.reduce((sum, point) => sum + point.points, 0);
  const matchedIds = matched.map((point) => point.id);
  const requiredMet = retest.pass_rule.required_rubric_ids.every((requiredId) => matchedIds.includes(requiredId));
  const selected = document.querySelector(`#retest-verdict-${CSS.escape(id)}`)?.value || "auto";
  const automaticStatus = score >= retest.pass_rule.min_points && requiredMet ? "已掌握" : "需再练";
  attempt.matched_rubric_ids = matchedIds;
  attempt.score = score;
  attempt.parent_review_status = selected === "auto" ? automaticStatus : selected;
  attempt.parent_note = document.querySelector(`#retest-note-${CSS.escape(id)}`)?.value.trim() || "";
  attempt.next_due_at = attempt.parent_review_status === "已掌握" ? addDaysIso(5) : attempt.parent_review_status === "需再练" ? addDaysIso(2) : null;
  saveState(); render();
}

function exportData() {
  const feature = window.OrangeCoach?.features?.learningExport;
  if (!feature) return alert("学习档案功能未加载，请刷新后重试。");
  const now = new Date();
  const packet = feature.buildPacket({ state, context: { topics: catalog.topics, questions: catalog.questions }, now, config: COACH_CONFIG });
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = feature.exportFilename(now); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  state.lastAction = `已导出：${link.download}`;
  saveState();
}

async function init() {
  try {
    const [topics, questions, paperReviews, retests, projectCatalog, timeLab, earthMotionLab, solarSeasonLab] = await Promise.all([
      fetch(`./data/topics.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/questions.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/paper_reviews.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/retests.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/learning_projects.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/time_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/earth_motion_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/solar_season_lab.json?v=${ASSET_VERSION}`).then((response) => response.json())
    ]);
    catalog = { topics, questions, paperReviews, retests, projects: projectCatalog.projects || [], timeLab, earthMotionLab, solarSeasonLab };
    render();
  } catch (error) {
    app.innerHTML = `<section class="card"><h2>项目启动失败</h2><p>请通过本地服务器打开，而不是直接双击 index.html。</p><div class="quote">${escapeHtml(error.message)}</div></section>`;
  }
}

init();
