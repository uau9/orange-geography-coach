const STORAGE_KEY = "orange-geography-coach:v0.1";
const COACH_CONFIG = window.OrangeCoach?.config || { APP_VERSION: "0.27.1", ASSET_VERSION: "0.27.1", EXPORT_SCHEMA_VERSION: "0.25.0", STUDENT_ALIAS: "橙子" };
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
let catalog = { topics: [], questions: [], paperReviews: [], retests: [], projects: [], curriculum: null, regionReview: null, timeLab: null, earthMotionLab: null, solarSeasonLab: null, solarPathLab: null, annualSunLab: null, orbitSpeedLab: null, terminatorLinkLab: null, rotationSpeedLab: null, dateRangeLab: null, axialTiltLab: null, celestialScaleLab: null, habitabilityLab: null, solarActivityLab: null, moonPhaseLab: null, eclipseLab: null, tideLab: null, coriolisLab: null, frontWeatherLab: null, cycloneSystemLab: null, atmosphereLabs: null };

function defaultState() {
  return {
    version: "0.3.0",
    route: "today",
    currentQuestionId: null,
    diagnosticFilter: "all",
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
    activeSolarPathAttemptId: null,
    solarPathDateId: "june-solstice",
    solarPathPlaceId: "guangzhou",
    activeAnnualSunAttemptId: null,
    annualSunCheckpointId: "early-may",
    annualSunPlaceId: "beijing",
    activeOrbitSpeedAttemptId: null,
    orbitSpeedCheckpointId: "early-january",
    orbitSpeedHemisphereId: "north",
    activeTerminatorLinkAttemptId: null,
    terminatorLinkScenarioIndex: 0,
    activeRotationSpeedAttemptId: null,
    rotationSpeedScenarioIndex: 0,
    activeDateRangeAttemptId: null,
    dateRangeScenarioIndex: 0,
    activeAxialTiltAttemptId: null,
    axialTiltScenarioIndex: 0,
    activeCelestialScaleAttemptId: null,
    celestialScaleScenarioIndex: 0,
    activeHabitabilityAttemptId: null,
    habitabilityScenarioIndex: 0,
    activeSolarActivityAttemptId: null,
    solarActivityScenarioIndex: 0,
    activeMoonPhaseAttemptId: null,
    moonPhaseScenarioIndex: 0,
    activeEclipseAttemptId: null,
    eclipseScenarioIndex: 0,
    activeTideAttemptId: null,
    tideScenarioIndex: 0,
    activeCoriolisAttemptId: null,
    coriolisScenarioIndex: 0,
    activeFrontWeatherAttemptId: null,
    frontWeatherScenarioIndex: 0,
    activeCycloneSystemAttemptId: null,
    cycloneSystemScenarioIndex: 0,
    activeAtmosphereLabId: null,
    activeAtmosphereAttemptId: null,
    atmosphereScenarioIndex: 0,
    attempts: [],
    retestAttempts: [],
    timeLabAttempts: [],
    earthMotionAttempts: [],
    solarSeasonAttempts: [],
    solarPathAttempts: [],
    annualSunAttempts: [],
    orbitSpeedAttempts: [],
    terminatorLinkAttempts: [],
    rotationSpeedAttempts: [],
    dateRangeAttempts: [],
    axialTiltAttempts: [],
    celestialScaleAttempts: [],
    habitabilityAttempts: [],
    solarActivityAttempts: [],
    moonPhaseAttempts: [],
    eclipseAttempts: [],
    tideAttempts: [],
    coriolisAttempts: [],
    frontWeatherAttempts: [],
    cycloneSystemAttempts: [],
    atmosphereReasoningAttempts: [],
    coachAnnotations: [],
    lastAction: ""
  };
}

function normalizeState(parsed) {
  const normalized = { ...defaultState(), ...parsed, version: "0.3.0" };
  normalized.diagnosticFilter = ["all", "unseen", "review", "answered"].includes(parsed?.diagnosticFilter) ? parsed.diagnosticFilter : "all";
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
  normalized.solarPathAttempts = Array.isArray(parsed?.solarPathAttempts)
    ? parsed.solarPathAttempts
    : Array.isArray(parsed?.solar_path_attempts)
      ? parsed.solar_path_attempts
      : [];
  normalized.annualSunAttempts = Array.isArray(parsed?.annualSunAttempts)
    ? parsed.annualSunAttempts
    : Array.isArray(parsed?.annual_sun_attempts)
      ? parsed.annual_sun_attempts
      : [];
  normalized.orbitSpeedAttempts = Array.isArray(parsed?.orbitSpeedAttempts)
    ? parsed.orbitSpeedAttempts
    : Array.isArray(parsed?.orbit_speed_attempts)
      ? parsed.orbit_speed_attempts
      : [];
  normalized.terminatorLinkAttempts = Array.isArray(parsed?.terminatorLinkAttempts)
    ? parsed.terminatorLinkAttempts
    : Array.isArray(parsed?.terminator_link_attempts)
      ? parsed.terminator_link_attempts
      : [];
  normalized.rotationSpeedAttempts = Array.isArray(parsed?.rotationSpeedAttempts)
    ? parsed.rotationSpeedAttempts
    : Array.isArray(parsed?.rotation_speed_attempts)
      ? parsed.rotation_speed_attempts
      : [];
  normalized.dateRangeAttempts = Array.isArray(parsed?.dateRangeAttempts) ? parsed.dateRangeAttempts : Array.isArray(parsed?.date_range_attempts) ? parsed.date_range_attempts : [];
  normalized.axialTiltAttempts = Array.isArray(parsed?.axialTiltAttempts) ? parsed.axialTiltAttempts : Array.isArray(parsed?.axial_tilt_attempts) ? parsed.axial_tilt_attempts : [];
  normalized.celestialScaleAttempts = Array.isArray(parsed?.celestialScaleAttempts) ? parsed.celestialScaleAttempts : Array.isArray(parsed?.celestial_scale_attempts) ? parsed.celestial_scale_attempts : [];
  normalized.habitabilityAttempts = Array.isArray(parsed?.habitabilityAttempts) ? parsed.habitabilityAttempts : Array.isArray(parsed?.habitability_attempts) ? parsed.habitability_attempts : [];
  normalized.solarActivityAttempts = Array.isArray(parsed?.solarActivityAttempts) ? parsed.solarActivityAttempts : Array.isArray(parsed?.solar_activity_attempts) ? parsed.solar_activity_attempts : [];
  normalized.moonPhaseAttempts = Array.isArray(parsed?.moonPhaseAttempts) ? parsed.moonPhaseAttempts : Array.isArray(parsed?.moon_phase_attempts) ? parsed.moon_phase_attempts : [];
  normalized.eclipseAttempts = Array.isArray(parsed?.eclipseAttempts) ? parsed.eclipseAttempts : Array.isArray(parsed?.eclipse_attempts) ? parsed.eclipse_attempts : [];
  normalized.tideAttempts = Array.isArray(parsed?.tideAttempts) ? parsed.tideAttempts : Array.isArray(parsed?.tide_attempts) ? parsed.tide_attempts : [];
  normalized.coriolisAttempts = Array.isArray(parsed?.coriolisAttempts) ? parsed.coriolisAttempts : Array.isArray(parsed?.coriolis_attempts) ? parsed.coriolis_attempts : [];
  normalized.frontWeatherAttempts = Array.isArray(parsed?.frontWeatherAttempts) ? parsed.frontWeatherAttempts : Array.isArray(parsed?.front_weather_attempts) ? parsed.front_weather_attempts : [];
  normalized.cycloneSystemAttempts = Array.isArray(parsed?.cycloneSystemAttempts) ? parsed.cycloneSystemAttempts : Array.isArray(parsed?.cyclone_system_attempts) ? parsed.cyclone_system_attempts : [];
  normalized.atmosphereReasoningAttempts = Array.isArray(parsed?.atmosphereReasoningAttempts) ? parsed.atmosphereReasoningAttempts : Array.isArray(parsed?.atmosphere_reasoning_attempts) ? parsed.atmosphere_reasoning_attempts : [];
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

function optionalReasoning(value) {
  return escapeHtml(String(value || "").trim() || "未填写（选填）");
}

function getTopic(id) { return catalog.topics.find((topic) => topic.id === id); }
function getQuestion(id) { return catalog.questions.find((question) => question.id === id); }
function getRetest(id) { return catalog.retests.find((retest) => retest.id === id); }
function getTimeLabAttempt(id) { return state.timeLabAttempts.find((attempt) => attempt.id === id); }
function getEarthMotionAttempt(id) { return state.earthMotionAttempts.find((attempt) => attempt.id === id); }
function getSolarSeasonAttempt(id) { return state.solarSeasonAttempts.find((attempt) => attempt.id === id); }
function getSolarPathAttempt(id) { return state.solarPathAttempts.find((attempt) => attempt.id === id); }
function getAnnualSunAttempt(id) { return state.annualSunAttempts.find((attempt) => attempt.id === id); }
function getOrbitSpeedAttempt(id) { return state.orbitSpeedAttempts.find((attempt) => attempt.id === id); }
function getTerminatorLinkAttempt(id) { return state.terminatorLinkAttempts.find((attempt) => attempt.id === id); }
function getRotationSpeedAttempt(id) { return state.rotationSpeedAttempts.find((attempt) => attempt.id === id); }
function getDateRangeAttempt(id) { return state.dateRangeAttempts.find((attempt) => attempt.id === id); }
function getAxialTiltAttempt(id) { return state.axialTiltAttempts.find((attempt) => attempt.id === id); }
function getCelestialScaleAttempt(id) { return state.celestialScaleAttempts.find((attempt) => attempt.id === id); }
function getHabitabilityAttempt(id) { return state.habitabilityAttempts.find((attempt) => attempt.id === id); }
function getSolarActivityAttempt(id) { return state.solarActivityAttempts.find((attempt) => attempt.id === id); }
function getMoonPhaseAttempt(id) { return state.moonPhaseAttempts.find((attempt) => attempt.id === id); }
function getEclipseAttempt(id) { return state.eclipseAttempts.find((attempt) => attempt.id === id); }
function getTideAttempt(id) { return state.tideAttempts.find((attempt) => attempt.id === id); }
function getCoriolisAttempt(id) { return state.coriolisAttempts.find((attempt) => attempt.id === id); }
function getFrontWeatherAttempt(id) { return state.frontWeatherAttempts.find((attempt) => attempt.id === id); }
function getCycloneSystemAttempt(id) { return state.cycloneSystemAttempts.find((attempt) => attempt.id === id); }
function getAtmosphereAttempt(id) { return state.atmosphereReasoningAttempts.find((attempt) => attempt.id === id); }
function getActiveQuestion() { return getQuestion(state.currentQuestionId) || chooseNextQuestion(); }
function activeCurriculumQuestionIds() {
  return (catalog.curriculum?.books || []).flatMap((book) => (book.chapters || [])
    .filter((chapter) => chapter.status === "active")
    .flatMap((chapter) => (chapter.sections || []).flatMap((section) => section.question_ids || [])));
}
function curriculumQuestionIds() {
  const curriculumIds = [...(catalog.curriculum?.books || [])]
    .sort((a, b) => a.order - b.order)
    .flatMap((book) => [...(book.chapters || [])]
      .sort((a, b) => a.order - b.order)
      .flatMap((chapter) => [...(chapter.sections || [])]
        .sort((a, b) => a.order - b.order)
        .flatMap((section) => section.question_ids || [])));
  const supplementalIds = catalog.curriculum?.supplemental?.question_ids || [];
  const listed = new Set([...curriculumIds, ...supplementalIds]);
  return [...curriculumIds, ...supplementalIds, ...catalog.questions.map((question) => question.id).filter((id) => !listed.has(id))];
}
function chooseNextCatalogQuestion(currentQuestionId) {
  const orderedIds = curriculumQuestionIds();
  const currentIndex = orderedIds.indexOf(currentQuestionId);
  return currentIndex >= 0 ? getQuestion(orderedIds[currentIndex + 1]) || chooseNextQuestion() : chooseNextQuestion();
}
function chooseNextQuestion() {
  const attempted = new Set(state.attempts.map((attempt) => attempt.question_id));
  const activeUnseen = activeCurriculumQuestionIds().map(getQuestion).find((question) => question && !attempted.has(question.id));
  if (activeUnseen) return activeUnseen;
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
function latestSolarPathAttempts() { return [...state.solarPathAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestAnnualSunAttempts() { return [...state.annualSunAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestOrbitSpeedAttempts() { return [...state.orbitSpeedAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestTerminatorLinkAttempts() { return [...state.terminatorLinkAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestRotationSpeedAttempts() { return [...state.rotationSpeedAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestDateRangeAttempts() { return [...state.dateRangeAttempts].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)); }
function latestAxialTiltAttempts() { return [...state.axialTiltAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestCelestialScaleAttempts() { return [...state.celestialScaleAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestHabitabilityAttempts() { return [...state.habitabilityAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestSolarActivityAttempts() { return [...state.solarActivityAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestMoonPhaseAttempts() { return [...state.moonPhaseAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestEclipseAttempts() { return [...state.eclipseAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestTideAttempts() { return [...state.tideAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestCoriolisAttempts() { return [...state.coriolisAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestFrontWeatherAttempts() { return [...state.frontWeatherAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestCycloneSystemAttempts() { return [...state.cycloneSystemAttempts].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function latestAtmosphereAttempts(labId = null) { return [...state.atmosphereReasoningAttempts].filter((attempt) => !labId || attempt.lab_id === labId).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)); }
function completedToday() {
  const today = new Date().toDateString();
  return [...state.attempts, ...state.retestAttempts, ...state.timeLabAttempts, ...state.earthMotionAttempts, ...state.solarSeasonAttempts, ...state.solarPathAttempts, ...state.annualSunAttempts, ...state.orbitSpeedAttempts, ...state.terminatorLinkAttempts, ...state.rotationSpeedAttempts, ...state.dateRangeAttempts, ...state.axialTiltAttempts, ...state.celestialScaleAttempts, ...state.habitabilityAttempts, ...state.solarActivityAttempts, ...state.moonPhaseAttempts, ...state.eclipseAttempts, ...state.tideAttempts, ...state.coriolisAttempts, ...state.frontWeatherAttempts, ...state.cycloneSystemAttempts, ...state.atmosphereReasoningAttempts]
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
  const scenario = getTimeLabScenario();
  if (scenario) {
    const preview = calculateTimeLabAnswers(scenario, longitude);
    const localClock = document.querySelector("#lab-preview-local");
    const zoneClock = document.querySelector("#lab-preview-zone");
    const zoneName = document.querySelector("#lab-preview-zone-name");
    if (localClock) localClock.textContent = preview.local_time;
    if (zoneClock) zoneClock.textContent = preview.zone_time;
    if (zoneName) zoneName.textContent = preview.zone_name;
  }
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
          ${renderEarthMotionDiagram(view, point, true)}
          <p class="motion-hint">${escapeHtml(view.view_hint)} 运动箭头、昼夜标签和界线名称默认可见。</p>
          ${view.points.length > 1 ? `<div class="motion-point-tabs" aria-label="选择晨昏线交点">${view.points.map((item) => `<button class="${item.id === point.id ? "active" : ""}" data-action="set-earth-motion-point" data-point-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`).join("")}</div>` : ""}
        </div>
        <form id="earth-motion-form" class="motion-prediction-panel">
          <div class="notice">四项预测需完成；图示始终可见，判断链可选填。</div>
          <fieldset><legend>1. 面向太阳的是哪一半？</legend>${renderMotionChoice("motion-sun-side", ["左半球", "右半球"])}</fieldset>
          <fieldset><legend>2. 从当前视角看，地球怎样自转？</legend>${renderMotionChoice("motion-rotation", ["顺时针", "逆时针", "自西向东"])}</fieldset>
          <fieldset><legend>3. ${escapeHtml(point.name)} 正在：</legend>${renderMotionChoice("motion-transition", ["进入白昼", "进入黑夜"])}</fieldset>
          <fieldset><legend>4. 该交界属于：</legend>${renderMotionChoice("motion-boundary", ["晨线", "昏线"])}</fieldset>
          <label class="field-label" for="motion-reasoning">判断链（选填）</label>
          <textarea id="motion-reasoning" name="motion-reasoning" placeholder="例如：先确定观察视角；再判断自转方向；沿运动方向看该点从哪一侧进入哪一侧；最后命名晨线或昏线。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交预测</button>
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
          <p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>
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

function getSolarPathDate(dateId = state.solarPathDateId) {
  return (catalog.solarPathLab?.dates || []).find((item) => item.id === dateId) || catalog.solarPathLab?.dates?.[0] || null;
}

function getSolarPathPlace(placeId = state.solarPathPlaceId) {
  return (catalog.solarPathLab?.places || []).find((item) => item.id === placeId) || catalog.solarPathLab?.places?.[0] || null;
}

function setSolarPathScenario(dateId, placeId) {
  const date = getSolarPathDate(dateId);
  const place = getSolarPathPlace(placeId);
  if (!date || !place) return;
  state.solarPathDateId = date.id;
  state.solarPathPlaceId = place.id;
  state.activeSolarPathAttemptId = null;
  saveState(); render();
}

function chooseSolarPathScenario(offset = 0) {
  const dates = catalog.solarPathLab?.dates || [];
  const places = catalog.solarPathLab?.places || [];
  const scenarios = dates.flatMap((date, dateIndex) => {
    const place = places[(dateIndex * 2 + 1) % Math.max(places.length, 1)];
    return place ? [{ date, place }] : [];
  });
  if (!scenarios.length) return null;
  const currentIndex = scenarios.findIndex(({ date, place }) => date.id === state.solarPathDateId && place.id === state.solarPathPlaceId);
  return scenarios[((currentIndex < 0 ? 0 : currentIndex) + offset + scenarios.length) % scenarios.length];
}

function solarPathMasteryStatus() {
  const reviewHours = catalog.solarPathLab?.review_after_hours || 48;
  const confirmedFull = [...state.solarPathAttempts]
    .filter((attempt) => attempt.score === 4 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: "需要两次不同日期情境满分并由家长确认。", mastered: false };
  const latest = confirmedFull[confirmedFull.length - 1];
  const earlier = [...confirmedFull].reverse().find((attempt) => attempt.date_id !== latest.date_id && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000);
  return earlier
    ? { label: "延迟复测通过", detail: `不同日期的两次确认已间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换日期复测", detail: `需要换日期，且与满分确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderSolarPathLab() {
  const feature = window.OrangeCoach?.features?.solarPath;
  const date = getSolarPathDate();
  const place = getSolarPathPlace();
  if (!feature || !date || !place) { app.innerHTML = `<section class="card empty">太阳视运动实验数据尚未加载。</section>`; return; }
  state.solarPathDateId = date.id;
  state.solarPathPlaceId = place.id;
  const attempt = getSolarPathAttempt(state.activeSolarPathAttemptId);
  app.innerHTML = attempt
    ? feature.renderResult({ lab: catalog.solarPathLab, date: getSolarPathDate(attempt.date_id), place: getSolarPathPlace(attempt.place_id), attempt })
    : feature.renderLab({ lab: catalog.solarPathLab, date, place });
}

function getAnnualSunCheckpoint(checkpointId = state.annualSunCheckpointId) {
  return (catalog.annualSunLab?.checkpoints || []).find((item) => item.id === checkpointId) || catalog.annualSunLab?.checkpoints?.[0] || null;
}

function getAnnualSunPlace(placeId = state.annualSunPlaceId) {
  return (catalog.annualSunLab?.places || []).find((item) => item.id === placeId) || catalog.annualSunLab?.places?.[0] || null;
}

function setAnnualSunScenario(checkpointId, placeId) {
  const checkpoint = getAnnualSunCheckpoint(checkpointId);
  const place = getAnnualSunPlace(placeId);
  if (!checkpoint || !place) return;
  state.annualSunCheckpointId = checkpoint.id;
  state.annualSunPlaceId = place.id;
  state.activeAnnualSunAttemptId = null;
  saveState(); render();
}

function chooseAnnualSunScenario(offset = 0) {
  const checkpoints = catalog.annualSunLab?.checkpoints || [];
  const places = catalog.annualSunLab?.places || [];
  const scenarios = checkpoints.map((checkpoint, index) => ({ checkpoint, place: places[index % Math.max(places.length, 1)] })).filter((item) => item.place);
  if (!scenarios.length) return null;
  const currentIndex = scenarios.findIndex(({ checkpoint, place }) => checkpoint.id === state.annualSunCheckpointId && place.id === state.annualSunPlaceId);
  return scenarios[((currentIndex < 0 ? 0 : currentIndex) + offset + scenarios.length) % scenarios.length];
}

function annualSunMasteryStatus() {
  const reviewHours = catalog.annualSunLab?.review_after_hours || 48;
  const confirmedFull = [...state.annualSunAttempts]
    .filter((attempt) => attempt.score === 4 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: `需要两次移动方向相反、相隔至少${reviewHours}小时的满分记录并由家长确认。`, mastered: false };
  const directionGroup = (attempt) => ["向北移动", "南界折返向北"].includes(attempt.correct_answers?.migration) ? "north" : "south";
  const latest = confirmedFull[confirmedFull.length - 1];
  const earlier = [...confirmedFull].reverse().find((attempt) => directionGroup(attempt) !== directionGroup(latest) && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000);
  return earlier
    ? { label: "延迟复测通过", detail: `向北与向南移动情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待反向复测", detail: `需要换到相反移动方向，并与确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderAnnualSunLab() {
  const feature = window.OrangeCoach?.features?.annualSun;
  const checkpoint = getAnnualSunCheckpoint();
  const place = getAnnualSunPlace();
  if (!feature || !checkpoint || !place) { app.innerHTML = `<section class="card empty">周年回归实验数据尚未加载。</section>`; return; }
  state.annualSunCheckpointId = checkpoint.id;
  state.annualSunPlaceId = place.id;
  const attempt = getAnnualSunAttempt(state.activeAnnualSunAttemptId);
  app.innerHTML = attempt
    ? feature.renderResult({ lab: catalog.annualSunLab, checkpoint: getAnnualSunCheckpoint(attempt.checkpoint_id), place: getAnnualSunPlace(attempt.place_id), attempt })
    : feature.renderLab({ lab: catalog.annualSunLab, checkpoint, place });
}

function getOrbitSpeedCheckpoint(checkpointId = state.orbitSpeedCheckpointId) {
  return (catalog.orbitSpeedLab?.checkpoints || []).find((item) => item.id === checkpointId) || catalog.orbitSpeedLab?.checkpoints?.[0] || null;
}

function getOrbitSpeedHemisphere(hemisphereId = state.orbitSpeedHemisphereId) {
  return (catalog.orbitSpeedLab?.hemispheres || []).find((item) => item.id === hemisphereId) || catalog.orbitSpeedLab?.hemispheres?.[0] || null;
}

function setOrbitSpeedScenario(checkpointId, hemisphereId) {
  const checkpoint = getOrbitSpeedCheckpoint(checkpointId);
  const hemisphere = getOrbitSpeedHemisphere(hemisphereId);
  if (!checkpoint || !hemisphere) return;
  state.orbitSpeedCheckpointId = checkpoint.id;
  state.orbitSpeedHemisphereId = hemisphere.id;
  state.activeOrbitSpeedAttemptId = null;
  saveState(); render();
}

function orbitSpeedScenarios() {
  return (catalog.orbitSpeedLab?.scenarios || []).map((scenario) => ({
    checkpoint: getOrbitSpeedCheckpoint(scenario.checkpoint_id),
    hemisphere: getOrbitSpeedHemisphere(scenario.hemisphere_id)
  })).filter((scenario) => scenario.checkpoint && scenario.hemisphere);
}

function chooseOrbitSpeedScenario(offset = 0) {
  const scenarios = orbitSpeedScenarios();
  if (!scenarios.length) return null;
  const currentIndex = scenarios.findIndex(({ checkpoint, hemisphere }) => checkpoint.id === state.orbitSpeedCheckpointId && hemisphere.id === state.orbitSpeedHemisphereId);
  return scenarios[((currentIndex < 0 ? 0 : currentIndex) + offset + scenarios.length) % scenarios.length];
}

function orbitSpeedMasteryStatus() {
  const reviewHours = catalog.orbitSpeedLab?.review_after_hours || 48;
  const confirmedFull = [...state.orbitSpeedAttempts]
    .filter((attempt) => attempt.score === 4 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  const group = (attempt) => attempt.checkpoint_id === "early-january" ? "perihelion" : attempt.checkpoint_id === "early-july" ? "aphelion" : "transition";
  const usable = confirmedFull.filter((attempt) => group(attempt) !== "transition");
  if (usable.length < 2) return { label: "待验证", detail: `需要在近日点与远日点、不同半球情境中分别满分，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = usable[usable.length - 1];
  const earlier = [...usable].reverse().find((attempt) => group(attempt) !== group(latest) && attempt.hemisphere_id !== latest.hemisphere_id && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000);
  return earlier
    ? { label: "延迟复测通过", detail: `近日点、远日点与南北半球均完成换情境验证，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待对照复测", detail: `还需换到另一极点位置和另一半球，并与确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderOrbitSpeedLab() {
  const feature = window.OrangeCoach?.features?.orbitSpeed;
  const checkpoint = getOrbitSpeedCheckpoint();
  const hemisphere = getOrbitSpeedHemisphere();
  if (!feature || !checkpoint || !hemisphere) { app.innerHTML = `<section class="card empty">公转轨道与速度实验数据尚未加载。</section>`; return; }
  state.orbitSpeedCheckpointId = checkpoint.id;
  state.orbitSpeedHemisphereId = hemisphere.id;
  const attempt = getOrbitSpeedAttempt(state.activeOrbitSpeedAttemptId);
  app.innerHTML = attempt
    ? feature.renderResult({ lab: catalog.orbitSpeedLab, checkpoint: getOrbitSpeedCheckpoint(attempt.checkpoint_id), hemisphere: getOrbitSpeedHemisphere(attempt.hemisphere_id), attempt })
    : feature.renderLab({ lab: catalog.orbitSpeedLab, checkpoint, hemisphere });
}

function getTerminatorLinkScenario(scenarioId = null) {
  const scenarios = catalog.terminatorLinkLab?.scenarios || [];
  if (!scenarios.length) return null;
  if (scenarioId) return scenarios.find((scenario) => scenario.id === scenarioId) || scenarios[0];
  return scenarios[state.terminatorLinkScenarioIndex % scenarios.length];
}

function getTerminatorLinkDate(dateId) {
  return (catalog.terminatorLinkLab?.dates || []).find((date) => date.id === dateId) || null;
}

function getTerminatorLinkPlace(placeId) {
  return (catalog.terminatorLinkLab?.places || []).find((place) => place.id === placeId) || null;
}

function terminatorLinkMasteryStatus() {
  const reviewHours = catalog.terminatorLinkLab?.review_after_hours || 48;
  const confirmedFull = [...state.terminatorLinkAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: `需要不同日期、不同状态类型的两次满分记录，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const statusGroup = (attempt) => ["晨线", "昏线"].includes(attempt.correct_answers?.status) ? "line" : "area";
  const latest = confirmedFull[confirmedFull.length - 1];
  const latestScenario = getTerminatorLinkScenario(latest.scenario_id);
  const earlier = [...confirmedFull].reverse().find((attempt) => {
    const scenario = getTerminatorLinkScenario(attempt.scenario_id);
    return scenario?.date_id !== latestScenario?.date_id
      && statusGroup(attempt) !== statusGroup(latest)
      && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000;
  });
  return earlier
    ? { label: "延迟复测通过", detail: `不同日期的晨昏线与昼夜区情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换情境复测", detail: `还需更换日期，并在晨昏线与昼夜区之间切换，间隔至少${reviewHours}小时。`, mastered: false };
}

function renderTerminatorLinkLab() {
  const feature = window.OrangeCoach?.features?.terminatorLink;
  const scenario = getTerminatorLinkScenario();
  const date = getTerminatorLinkDate(scenario?.date_id);
  const place = getTerminatorLinkPlace(scenario?.place_id);
  if (!feature || !scenario || !date || !place) { app.innerHTML = `<section class="card empty">晨昏线综合联动实验数据尚未加载。</section>`; return; }
  const attempt = getTerminatorLinkAttempt(state.activeTerminatorLinkAttemptId);
  if (attempt) {
    const attemptScenario = getTerminatorLinkScenario(attempt.scenario_id);
    app.innerHTML = feature.renderResult({
      lab: catalog.terminatorLinkLab,
      scenario: attemptScenario,
      date: getTerminatorLinkDate(attemptScenario.date_id),
      place: getTerminatorLinkPlace(attemptScenario.place_id),
      attempt
    });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.terminatorLinkLab, date, place, scenario, scenarioIndex: state.terminatorLinkScenarioIndex % catalog.terminatorLinkLab.scenarios.length });
}

function getRotationSpeedScenario(scenarioId = null) {
  const scenarios = catalog.rotationSpeedLab?.scenarios || [];
  if (!scenarios.length) return null;
  if (scenarioId) return scenarios.find((scenario) => scenario.id === scenarioId) || scenarios[0];
  return scenarios[state.rotationSpeedScenarioIndex % scenarios.length];
}

function getRotationSpeedPlace(placeId) {
  return (catalog.rotationSpeedLab?.places || []).find((place) => place.id === placeId) || null;
}

function rotationSpeedMasteryStatus() {
  const reviewHours = catalog.rotationSpeedLab?.review_after_hours || 48;
  const confirmedFull = [...state.rotationSpeedAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmedFull.length < 2) return { label: "待验证", detail: `需要低纬与高纬两次满分记录，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmedFull[confirmedFull.length - 1];
  const latestScenario = getRotationSpeedScenario(latest.scenario_id);
  const latestPlace = getRotationSpeedPlace(latestScenario?.place_id);
  const earlier = [...confirmedFull].reverse().find((attempt) => {
    const scenario = getRotationSpeedScenario(attempt.scenario_id);
    const place = getRotationSpeedPlace(scenario?.place_id);
    return new Set([latestPlace?.band, place?.band]).has("low")
      && new Set([latestPlace?.band, place?.band]).has("high")
      && scenario?.duration_hours !== latestScenario?.duration_hours
      && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 60 * 60 * 1000;
  });
  return earlier
    ? { label: "延迟复测通过", detail: `低纬、高纬和不同观察时长均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待跨纬度复测", detail: `还需在低纬与高纬之间换情境、换时长，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderRotationSpeedLab() {
  const feature = window.OrangeCoach?.features?.rotationSpeed;
  const scenario = getRotationSpeedScenario();
  const place = getRotationSpeedPlace(scenario?.place_id);
  if (!feature || !scenario || !place) { app.innerHTML = `<section class="card empty">地球自转速度实验数据尚未加载。</section>`; return; }
  const attempt = getRotationSpeedAttempt(state.activeRotationSpeedAttemptId);
  if (attempt) {
    const attemptScenario = getRotationSpeedScenario(attempt.scenario_id);
    app.innerHTML = feature.renderResult({ lab: catalog.rotationSpeedLab, scenario: attemptScenario, place: getRotationSpeedPlace(attemptScenario.place_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.rotationSpeedLab, place, scenario, scenarioIndex: state.rotationSpeedScenarioIndex % catalog.rotationSpeedLab.scenarios.length });
}
function getDateRangeScenario(id=null){const a=catalog.dateRangeLab?.scenarios||[];if(!a.length)return null;return id?a.find(x=>x.id===id)||a[0]:a[state.dateRangeScenarioIndex%a.length];}
function dateRangeMasteryStatus(){const h=catalog.dateRangeLab?.review_after_hours||48,a=[...state.dateRangeAttempts].filter(x=>x.score===5&&x.parent_review_status==="已确认").sort((x,y)=>new Date(x.submitted_at)-new Date(y.submitted_at));if(a.length<2)return{label:"待验证",detail:`需要一个日期与两个日期情境各满分一次，间隔至少${h}小时并由家长确认。`,mastered:false};const l=a.at(-1),e=[...a].reverse().find(x=>x.correct_answers?.date_count!==l.correct_answers?.date_count&&new Date(l.submitted_at)-new Date(x.submitted_at)>=h*3600000);return e?{label:"延迟复测通过",detail:`一个日期与两个日期情境均通过，且间隔至少${h}小时。`,mastered:true}:{label:"等待换日期数量复测",detail:`还需更换全球日期数量并间隔至少${h}小时。`,mastered:false};}
function renderDateRangeLab(){const f=window.OrangeCoach?.features?.dateRange,s=getDateRangeScenario();if(!f||!s){app.innerHTML=`<section class="card empty">全球日期实验数据尚未加载。</section>`;return}const a=getDateRangeAttempt(state.activeDateRangeAttemptId);if(a){const x=getDateRangeScenario(a.scenario_id);app.innerHTML=f.renderResult({lab:catalog.dateRangeLab,scenario:x,attempt:a});return}app.innerHTML=f.renderLab({lab:catalog.dateRangeLab,scenario:s,scenarioIndex:state.dateRangeScenarioIndex%catalog.dateRangeLab.scenarios.length});}

function getAxialTiltScenario(id = null) {
  const scenarios = catalog.axialTiltLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.axialTiltScenarioIndex % scenarios.length];
}

function axialTiltMasteryStatus() {
  const reviewHours = catalog.axialTiltLab?.review_after_hours || 48;
  const current = catalog.axialTiltLab?.facts?.current_tilt_deg || 23.5;
  const confirmed = [...state.axialTiltAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要低于和高于当前交角的两种情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const latestSide = Math.sign(latest.correct_answers?.tilt_deg - current);
  const earlier = [...confirmed].reverse().find((attempt) => Math.sign(attempt.correct_answers?.tilt_deg - current) === -latestSide && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `交角增大与减小两类情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待反向变化复测", detail: `还需切换到交角${latestSide > 0 ? "减小" : "增大"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderAxialTiltLab() {
  const feature = window.OrangeCoach?.features?.axialTilt;
  const scenario = getAxialTiltScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">黄赤交角实验数据尚未加载。</section>`; return; }
  const attempt = getAxialTiltAttempt(state.activeAxialTiltAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.axialTiltLab, scenario: getAxialTiltScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.axialTiltLab, scenario, scenarioIndex: state.axialTiltScenarioIndex % catalog.axialTiltLab.scenarios.length });
}

function getCelestialScaleScenario(id = null) {
  const scenarios = catalog.celestialScaleLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.celestialScaleScenarioIndex % scenarios.length];
}

function celestialScaleMasteryStatus() {
  const reviewHours = catalog.celestialScaleLab?.review_after_hours || 48;
  const inner = new Set(["earth-moon", "solar-system"]);
  const confirmed = [...state.celestialScaleAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要内层与外层尺度情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const latestIsInner = inner.has(latest.target_level_id);
  const earlier = [...confirmed].reverse().find((attempt) => inner.has(attempt.target_level_id) !== latestIsInner && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `地月/太阳系与银河系/宇宙两类尺度均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待跨尺度复测", detail: `还需切换到${latestIsInner ? "银河系或可观测宇宙" : "地月系或太阳系"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderCelestialScaleLab() {
  const feature = window.OrangeCoach?.features?.celestialScale;
  const scenario = getCelestialScaleScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">天体系统尺度实验数据尚未加载。</section>`; return; }
  const attempt = getCelestialScaleAttempt(state.activeCelestialScaleAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.celestialScaleLab, scenario: getCelestialScaleScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.celestialScaleLab, scenario, scenarioIndex: state.celestialScaleScenarioIndex % catalog.celestialScaleLab.scenarios.length });
}

function getHabitabilityScenario(id = null) {
  const scenarios = catalog.habitabilityLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.habitabilityScenarioIndex % scenarios.length];
}

function habitabilityMasteryStatus() {
  const reviewHours = catalog.habitabilityLab?.review_after_hours || 48;
  const confirmed = [...state.habitabilityAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要同辐射与不同辐射两类对照各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const latestCategory = getHabitabilityScenario(latest.scenario_id)?.pair_category;
  const earlier = [...confirmed].reverse().find((attempt) => getHabitabilityScenario(attempt.scenario_id)?.pair_category !== latestCategory && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `同辐射对照与不同辐射对照均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换变量复测", detail: `还需切换到${latestCategory === "same_solar" ? "不同太阳辐射" : "近似相同太阳辐射"}的对照组，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderHabitabilityLab() {
  const feature = window.OrangeCoach?.features?.habitability;
  const scenario = getHabitabilityScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">地球宜居条件实验数据尚未加载。</section>`; return; }
  const attempt = getHabitabilityAttempt(state.activeHabitabilityAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.habitabilityLab, scenario: getHabitabilityScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.habitabilityLab, scenario, scenarioIndex: state.habitabilityScenarioIndex % catalog.habitabilityLab.scenarios.length });
}

function getSolarActivityScenario(id = null) {
  const scenarios = catalog.solarActivityLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.solarActivityScenarioIndex % scenarios.length];
}

function solarActivityMasteryStatus() {
  const reviewHours = catalog.solarActivityLab?.review_after_hours || 48;
  const confirmed = [...state.solarActivityAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认" && ["radiation", "plasma"].includes(attempt.category))
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要电磁辐射与磁化等离子体两类情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.category !== latest.category && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `耀斑快速响应与CME延迟响应两类情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换载体复测", detail: `还需切换到${latest.category === "radiation" ? "CME磁化等离子体" : "耀斑电磁辐射"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderSolarActivityLab() {
  const feature = window.OrangeCoach?.features?.solarActivity;
  const scenario = getSolarActivityScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">太阳活动实验数据尚未加载。</section>`; return; }
  const attempt = getSolarActivityAttempt(state.activeSolarActivityAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.solarActivityLab, scenario: getSolarActivityScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.solarActivityLab, scenario, scenarioIndex: state.solarActivityScenarioIndex % catalog.solarActivityLab.scenarios.length });
}

function getMoonPhaseScenario(id = null) {
  const scenarios = catalog.moonPhaseLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.moonPhaseScenarioIndex % scenarios.length];
}

function getMoonPhase(id) {
  return window.OrangeCoach?.features?.moonPhase?.getPhase(catalog.moonPhaseLab, id);
}

function moonPhaseMasteryStatus() {
  const reviewHours = catalog.moonPhaseLab?.review_after_hours || 48;
  const confirmed = [...state.moonPhaseAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认" && ["waxing", "waning"].includes(attempt.category))
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要渐盈与渐亏两类情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.category !== latest.category && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `渐盈与渐亏情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换盈亏复测", detail: `还需切换到${latest.category === "waxing" ? "渐亏" : "渐盈"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderMoonPhaseLab() {
  const feature = window.OrangeCoach?.features?.moonPhase;
  const scenario = getMoonPhaseScenario();
  const phase = getMoonPhase(scenario?.phase_id);
  if (!feature || !scenario || !phase) { app.innerHTML = `<section class="card empty">月相实验数据尚未加载。</section>`; return; }
  const attempt = getMoonPhaseAttempt(state.activeMoonPhaseAttemptId);
  if (attempt) {
    const attemptScenario = getMoonPhaseScenario(attempt.scenario_id);
    app.innerHTML = feature.renderResult({ lab: catalog.moonPhaseLab, scenario: attemptScenario, phase: getMoonPhase(attempt.phase_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.moonPhaseLab, scenario, phase, scenarioIndex: state.moonPhaseScenarioIndex % catalog.moonPhaseLab.scenarios.length });
}

function getEclipseScenario(id = null) {
  const scenarios = catalog.eclipseLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.eclipseScenarioIndex % scenarios.length];
}

function getEclipseCase(id) {
  return window.OrangeCoach?.features?.eclipse?.getCase(catalog.eclipseLab, id);
}

function eclipseMasteryStatus() {
  const reviewHours = catalog.eclipseLab?.review_after_hours || 48;
  const confirmed = [...state.eclipseAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认" && ["solar", "lunar"].includes(attempt.family))
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要日食与月食情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.family !== latest.family && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `日食与月食情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换食类复测", detail: `还需切换到${latest.family === "solar" ? "月食" : "日食"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderEclipseLab() {
  const feature = window.OrangeCoach?.features?.eclipse;
  const scenario = getEclipseScenario();
  const item = getEclipseCase(scenario?.case_id);
  if (!feature || !scenario || !item) { app.innerHTML = `<section class="card empty">日月食实验数据尚未加载。</section>`; return; }
  const attempt = getEclipseAttempt(state.activeEclipseAttemptId);
  if (attempt) {
    const attemptScenario = getEclipseScenario(attempt.scenario_id);
    app.innerHTML = feature.renderResult({ lab: catalog.eclipseLab, scenario: attemptScenario, item: getEclipseCase(attempt.case_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.eclipseLab, scenario, item, scenarioIndex: state.eclipseScenarioIndex % catalog.eclipseLab.scenarios.length });
}

function getTideScenario(id = null) {
  const scenarios = catalog.tideLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.tideScenarioIndex % scenarios.length];
}

function getTideCase(id) {
  return window.OrangeCoach?.features?.tide?.getCase(catalog.tideLab, id);
}

function tideMasteryStatus() {
  const reviewHours = catalog.tideLab?.review_after_hours || 48;
  const confirmed = [...state.tideAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认" && ["spring", "neap"].includes(attempt.category))
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要大潮与小潮情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.category !== latest.category && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `大潮与小潮情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换潮型复测", detail: `还需切换到${latest.category === "spring" ? "小潮" : "大潮"}情境，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderTideLab() {
  const feature = window.OrangeCoach?.features?.tide;
  const scenario = getTideScenario();
  const item = getTideCase(scenario?.case_id);
  if (!feature || !scenario || !item) { app.innerHTML = `<section class="card empty">潮汐实验数据尚未加载。</section>`; return; }
  const attempt = getTideAttempt(state.activeTideAttemptId);
  if (attempt) {
    const attemptScenario = getTideScenario(attempt.scenario_id);
    app.innerHTML = feature.renderResult({ lab: catalog.tideLab, scenario: attemptScenario, item: getTideCase(attempt.case_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.tideLab, scenario, item, scenarioIndex: state.tideScenarioIndex % catalog.tideLab.scenarios.length });
}

function getCoriolisScenario(id = null) {
  const scenarios = catalog.coriolisLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.coriolisScenarioIndex % scenarios.length];
}

function coriolisMasteryStatus() {
  const reviewHours = catalog.coriolisLab?.review_after_hours || 48;
  const confirmed = [...state.coriolisAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认" && ["北半球", "南半球"].includes(attempt.hemisphere))
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要南北半球不同运动方向各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.hemisphere !== latest.hemisphere && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `南北半球换方向情境均通过，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换半球复测", detail: `还需换到另一半球，并间隔至少${reviewHours}小时。`, mastered: false };
}

function renderCoriolisLab() {
  const feature = window.OrangeCoach?.features?.coriolis;
  const scenario = getCoriolisScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">地转偏向力实验数据尚未加载。</section>`; return; }
  const attempt = getCoriolisAttempt(state.activeCoriolisAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.coriolisLab, scenario: getCoriolisScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.coriolisLab, scenario, scenarioIndex: state.coriolisScenarioIndex % catalog.coriolisLab.scenarios.length });
}

function getFrontWeatherScenario(id = null) {
  const scenarios = catalog.frontWeatherLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.frontWeatherScenarioIndex % scenarios.length];
}

function frontWeatherMasteryStatus() {
  const reviewHours = catalog.frontWeatherLab?.review_after_hours || 48;
  const confirmed = [...state.frontWeatherAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要两种不同锋面情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.front_type !== latest.front_type && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `不同锋型均完成五步判断，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换锋型复测", detail: `还需换一种锋型，并与确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderFrontWeatherLab() {
  const feature = window.OrangeCoach?.features?.frontWeather;
  const scenario = getFrontWeatherScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">锋面天气实验数据尚未加载。</section>`; return; }
  const attempt = getFrontWeatherAttempt(state.activeFrontWeatherAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.frontWeatherLab, scenario: getFrontWeatherScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.frontWeatherLab, scenario, scenarioIndex: state.frontWeatherScenarioIndex % catalog.frontWeatherLab.scenarios.length });
}

function getCycloneSystemScenario(id = null) {
  const scenarios = catalog.cycloneSystemLab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.cycloneSystemScenarioIndex % scenarios.length];
}

function cycloneSystemMasteryStatus() {
  const reviewHours = catalog.cycloneSystemLab?.review_after_hours || 48;
  const confirmed = [...state.cycloneSystemAttempts]
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要换半球并切换高低压系统满分复测，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.system_family !== latest.system_family && attempt.hemisphere !== latest.hemisphere && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `已跨半球、跨高低压系统完成复测，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待换系统复测", detail: `还需同时更换半球和高低压类型，并与确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderCycloneSystemLab() {
  const feature = window.OrangeCoach?.features?.cycloneSystem;
  const scenario = getCycloneSystemScenario();
  if (!feature || !scenario) { app.innerHTML = `<section class="card empty">气旋反气旋实验数据尚未加载。</section>`; return; }
  const attempt = getCycloneSystemAttempt(state.activeCycloneSystemAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab: catalog.cycloneSystemLab, scenario: getCycloneSystemScenario(attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab: catalog.cycloneSystemLab, scenario, scenarioIndex: state.cycloneSystemScenarioIndex % catalog.cycloneSystemLab.scenarios.length });
}

function getAtmosphereLab(id = state.activeAtmosphereLabId) {
  return (catalog.atmosphereLabs?.labs || []).find((lab) => lab.id === id) || null;
}

function getAtmosphereScenario(lab = getAtmosphereLab(), id = null) {
  const scenarios = lab?.scenarios || [];
  if (!scenarios.length) return null;
  return id ? scenarios.find((scenario) => scenario.id === id) || scenarios[0] : scenarios[state.atmosphereScenarioIndex % scenarios.length];
}

function atmosphereMasteryStatus(labId) {
  const reviewHours = catalog.atmosphereLabs?.review_after_hours || 48;
  const confirmed = latestAtmosphereAttempts(labId)
    .filter((attempt) => attempt.score === 5 && attempt.parent_review_status === "已确认")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  if (confirmed.length < 2) return { label: "待验证", detail: `需要两个对照情境各满分一次，间隔至少${reviewHours}小时并由家长确认。`, mastered: false };
  const latest = confirmed.at(-1);
  const earlier = [...confirmed].reverse().find((attempt) => attempt.contrast_key !== latest.contrast_key && new Date(latest.submitted_at) - new Date(attempt.submitted_at) >= reviewHours * 3600000);
  return earlier
    ? { label: "延迟复测通过", detail: `已完成不同类型情境的五步判断，且间隔至少${reviewHours}小时。`, mastered: true }
    : { label: "等待对照复测", detail: `还需更换气压成因、季节或气候类型，并与确认记录间隔至少${reviewHours}小时。`, mastered: false };
}

function renderAtmosphereLab() {
  const feature = window.OrangeCoach?.features?.atmosphereReasoning;
  const lab = getAtmosphereLab();
  const scenario = getAtmosphereScenario(lab);
  if (!feature || !lab || !scenario) { app.innerHTML = `<section class="card empty">大气运动实验数据尚未加载。</section>`; return; }
  const attempt = getAtmosphereAttempt(state.activeAtmosphereAttemptId);
  if (attempt) {
    app.innerHTML = feature.renderResult({ lab, scenario: getAtmosphereScenario(lab, attempt.scenario_id), attempt });
    return;
  }
  app.innerHTML = feature.renderLab({ lab, scenario, scenarioIndex: state.atmosphereScenarioIndex % lab.scenarios.length });
}

function renderRegionReview() {
  const feature = window.OrangeCoach?.features?.regionReview;
  const module = catalog.regionReview;
  if (!feature || !module) {
    app.innerHTML = `<section class="card empty">区域发展复习模块尚未加载。</section>`;
    return;
  }
  const diagnosticAttempts = latestAttempts();
  const retestAttempts = latestRetestAttempts();
  const days = module.days.map((day) => {
    const dayQuestions = day.question_ids.map(getQuestion).filter(Boolean).map((question) => ({
      ...question,
      attempt: diagnosticAttempts.find((attempt) => attempt.question_id === question.id) || null
    }));
    return {
      ...day,
      questions: dayQuestions,
      completed: dayQuestions.filter((question) => question.attempt).length,
      total: dayQuestions.length
    };
  });
  const retests = module.delayed_retest_ids.map(getRetest).filter(Boolean).map((retest) => ({
    ...retest,
    attempt: retestAttempts.find((attempt) => attempt.retest_id === retest.id) || null,
    source_label: [retest.source_meta?.origin, retest.source_meta?.section].filter(Boolean).join(" · ") || retest.source,
    review_label: `建议间隔${retest.review_after_days?.[0] || 2}天`
  }));
  app.innerHTML = feature.render({ module, days, retests });
}

function render() {
  window.scrollTo(0, 0);
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    const isDiagnosticRoute = ["train", "diagnostic-catalog"].includes(state.route);
    const isProjectRoute = state.route === "region-review";
    button.classList.toggle("active", button.dataset.route === state.route || (button.dataset.route === "train" && isDiagnosticRoute) || (button.dataset.route === "projects" && isProjectRoute));
  });
  if (state.route === "region-review") return renderRegionReview();
  if (state.route === "retest") return renderRetest();
  if (state.route === "time-lab") return renderTimeLab();
  if (state.route === "earth-motion-lab") return renderEarthMotionLab();
  if (state.route === "solar-season-lab") return renderSolarSeasonLab();
  if (state.route === "solar-path-lab") return renderSolarPathLab();
  if (state.route === "annual-sun-lab") return renderAnnualSunLab();
  if (state.route === "orbit-speed-lab") return renderOrbitSpeedLab();
  if (state.route === "terminator-link-lab") return renderTerminatorLinkLab();
  if (state.route === "rotation-speed-lab") return renderRotationSpeedLab();
  if (state.route === "date-range-lab") return renderDateRangeLab();
  if (state.route === "axial-tilt-lab") return renderAxialTiltLab();
  if (state.route === "celestial-scale-lab") return renderCelestialScaleLab();
  if (state.route === "habitability-lab") return renderHabitabilityLab();
  if (state.route === "solar-activity-lab") return renderSolarActivityLab();
  if (state.route === "moon-phase-lab") return renderMoonPhaseLab();
  if (state.route === "eclipse-lab") return renderEclipseLab();
  if (state.route === "tide-lab") return renderTideLab();
  if (state.route === "coriolis-lab") return renderCoriolisLab();
  if (state.route === "front-weather-lab") return renderFrontWeatherLab();
  if (state.route === "cyclone-system-lab") return renderCycloneSystemLab();
  if (state.route === "atmosphere-lab") return renderAtmosphereLab();
  if (state.route === "diagnostic-catalog") return renderDiagnosticCatalog();
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
      { value: state.attempts.length + state.retestAttempts.length + state.timeLabAttempts.length + state.earthMotionAttempts.length + state.solarSeasonAttempts.length + state.solarPathAttempts.length + state.annualSunAttempts.length + state.orbitSpeedAttempts.length + state.terminatorLinkAttempts.length + state.rotationSpeedAttempts.length + state.dateRangeAttempts.length + state.axialTiltAttempts.length + state.celestialScaleAttempts.length + state.habitabilityAttempts.length + state.solarActivityAttempts.length + state.moonPhaseAttempts.length + state.eclipseAttempts.length + state.tideAttempts.length + state.coriolisAttempts.length + state.frontWeatherAttempts.length + state.cycloneSystemAttempts.length + state.atmosphereReasoningAttempts.length, label: "学习证据" },
      { value: countPendingParentReviews(), label: "待家长确认" }
    ],
    recent: getRecentEvidence().slice(0, 3)
  });
}

function countPendingParentReviews() {
  return [...state.attempts, ...state.retestAttempts, ...state.timeLabAttempts, ...state.earthMotionAttempts, ...state.solarSeasonAttempts, ...state.solarPathAttempts, ...state.annualSunAttempts, ...state.orbitSpeedAttempts, ...state.terminatorLinkAttempts, ...state.rotationSpeedAttempts, ...state.dateRangeAttempts, ...state.axialTiltAttempts, ...state.celestialScaleAttempts, ...state.habitabilityAttempts, ...state.solarActivityAttempts, ...state.moonPhaseAttempts, ...state.eclipseAttempts, ...state.tideAttempts, ...state.coriolisAttempts, ...state.frontWeatherAttempts, ...state.cycloneSystemAttempts, ...state.atmosphereReasoningAttempts]
    .filter((attempt) => String(attempt.parent_review_status || "").startsWith("待")).length;
}

function projectStatus(project) {
  if (project.id === "region-development-review") {
    const questionIds = (catalog.regionReview?.days || []).flatMap((day) => day.question_ids || []);
    const answered = new Set(state.attempts.filter((attempt) => questionIds.includes(attempt.question_id)).map((attempt) => attempt.question_id));
    const confirmed = new Set(state.attempts.filter((attempt) => questionIds.includes(attempt.question_id) && attempt.parent_review_status === "已确认").map((attempt) => attempt.question_id));
    return answered.size
      ? { status_label: `${answered.size}/${questionIds.length}`, status_tone: confirmed.size === questionIds.length ? "green" : "orange", status_detail: `${confirmed.size} 道已由家长确认 · 复测另行安排` }
      : { status_label: "待开始", status_tone: "", status_detail: "14天阅读 · 28道资料包诊断题 · 2组资料包复测" };
  }
  if (project.status_kind === "atmosphere_reasoning") {
    const attempts = latestAtmosphereAttempts(project.id);
    const latest = attempts[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${attempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下该实验的五步判断证据" };
  }
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
  if (project.status_kind === "solar_path") {
    const latest = latestSolarPathAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.solarPathAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下日出日落、正午太阳与影子方向证据" };
  }
  if (project.status_kind === "annual_sun") {
    const latest = latestAnnualSunAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.annualSunAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下直射纬度、移动方向和趋势判断证据" };
  }
  if (project.status_kind === "orbit_speed") {
    const latest = latestOrbitSpeedAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/4`, status_tone: latest.score === 4 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.orbitSpeedAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下轨道远近、公转速度与季节成因判断证据" };
  }
  if (project.status_kind === "terminator_link") {
    const latest = latestTerminatorLinkAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.terminatorLinkAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下直射经线、地方时、昼长与晨昏状态联动证据" };
  }
  if (project.status_kind === "rotation_speed") {
    const latest = latestRotationSpeedAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.rotationSpeedAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下角速度、线速度与纬线弧长判断证据" };
  }
  if(project.status_kind==="date_range"){const l=latestDateRangeAttempts()[0];return l?{status_label:`${l.score}/5`,status_tone:l.score===5&&l.parent_review_status==="已确认"?"green":"orange",status_detail:`${state.dateRangeAttempts.length} 次实验 · 最近 ${formatDate(l.submitted_at)} · ${l.parent_review_status}`}:{status_label:"待开始",status_tone:"",status_detail:"尚未留下0时经线、日期占比与日界线判断证据"};}
  if (project.status_kind === "axial_tilt") {
    const latest = latestAxialTiltAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.axialTiltAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下回归线、极圈与五带变化判断证据" };
  }
  if (project.status_kind === "celestial_scale") {
    const latest = latestCelestialScaleAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.celestialScaleAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下系统层级、尺度单位与银河系位置判断证据" };
  }
  if (project.status_kind === "habitability") {
    const latest = latestHabitabilityAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.habitabilityAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下太阳辐射、大气、温度、液态水与证据边界判断" };
  }
  if (project.status_kind === "solar_activity") {
    const latest = latestSolarActivityAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.solarActivityAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下太阳源现象、传播载体、到达时标与空间天气影响证据" };
  }
  if (project.status_kind === "moon_phase") {
    const latest = latestMoonPhaseAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.moonPhaseAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下日地月位置、亮面、盈亏变化与可见时段证据" };
  }
  if (project.status_kind === "eclipse") {
    const latest = latestEclipseAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.eclipseAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下月相交点、影区、食象与可见范围判断证据" };
  }
  if (project.status_kind === "tide") {
    const latest = latestTideAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.tideAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下月相几何、潮型、潮差、周期与局地边界判断证据" };
  }
  if (project.status_kind === "coriolis") {
    const latest = latestCoriolisAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.coriolisAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下半球规则、相对偏向与地图方位判断证据" };
  }
  if (project.status_kind === "front_weather") {
    const latest = latestFrontWeatherAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.frontWeatherAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下锋型、主动气团、降水位置与过境天气判断证据" };
  }
  if (project.status_kind === "cyclone_system") {
    const latest = latestCycloneSystemAttempts()[0];
    return latest
      ? { status_label: `${latest.score}/5`, status_tone: latest.score === 5 && latest.parent_review_status === "已确认" ? "green" : "orange", status_detail: `${state.cycloneSystemAttempts.length} 次实验 · 最近 ${formatDate(latest.submitted_at)} · ${latest.parent_review_status}` }
      : { status_label: "待开始", status_tone: "", status_detail: "尚未留下高低压、旋转方向、垂直运动与阴晴判断证据" };
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

function curriculumStatusModel(status) {
  if (status === "active") return { label: "学习中", tone: "orange" };
  if (status === "available") return { label: "已配置", tone: "green" };
  if (status === "planned") return { label: "即将学习", tone: "orange" };
  return { label: "目录已登记", tone: "" };
}

function projectNavigationModel() {
  const projects = projectModels();
  const byId = new Map(projects.map((project) => [project.id, project]));
  const assigned = new Set();
  const pickProjects = (ids = []) => ids.map((id) => byId.get(id)).filter(Boolean).map((project) => {
    assigned.add(project.id);
    return project;
  });
  const curriculum = catalog.curriculum;
  if (!curriculum) return { projects, utilities: [], books: [], supplemental: null };
  const utilities = pickProjects(curriculum.utility_project_ids);
  const books = [...(curriculum.books || [])].sort((a, b) => a.order - b.order).map((book) => ({
    ...book,
    chapters: [...book.chapters].sort((a, b) => a.order - b.order).map((chapter) => ({
      ...chapter,
      status_model: curriculumStatusModel(chapter.status),
      sections: [...chapter.sections].sort((a, b) => a.order - b.order).map((section) => ({ ...section, projects: pickProjects(section.project_ids) }))
    }))
  }));
  const supplementalProjects = pickProjects(curriculum.supplemental?.project_ids);
  const unassigned = projects.filter((project) => !assigned.has(project.id));
  return {
    projects,
    utilities,
    books,
    supplemental: curriculum.supplemental ? { ...curriculum.supplemental, projects: [...supplementalProjects, ...unassigned] } : null
  };
}

function getTodayRecommendation() {
  const projects = projectModels();
  const byId = (id) => projects.find((project) => project.id === id);
  const latestMotion = latestEarthMotionAttempts()[0];
  const latestSolar = latestSolarSeasonAttempts()[0];
  const latestAnnual = latestAnnualSunAttempts()[0];
  const latestOrbit = latestOrbitSpeedAttempts()[0];
  const latestLink = latestTerminatorLinkAttempts()[0];
  const latestRotation = latestRotationSpeedAttempts()[0];
  const latestAxialTilt = latestAxialTiltAttempts()[0];
  const latestCelestialScale = latestCelestialScaleAttempts()[0];
  const latestHabitability = latestHabitabilityAttempts()[0];
  const latestSolarActivity = latestSolarActivityAttempts()[0];
  const latestMoonPhase = latestMoonPhaseAttempts()[0];
  const latestEclipse = latestEclipseAttempts()[0];
  const latestTide = latestTideAttempts()[0];
  const latestCoriolis = latestCoriolisAttempts()[0];
  const latestFrontWeather = latestFrontWeatherAttempts()[0];
  const latestCycloneSystem = latestCycloneSystemAttempts()[0];
  const latestGlobalCirculation = latestAtmosphereAttempts("global-circulation-lab")[0];
  const latestMonsoonSystem = latestAtmosphereAttempts("monsoon-system-lab")[0];
  const latestClimateControl = latestAtmosphereAttempts("climate-control-lab")[0];
  const latestClimateGraph = latestAtmosphereAttempts("climate-graph-lab")[0];
  const latestOrographicRain = latestAtmosphereAttempts("orographic-rain-lab")[0];
  const latestDateRange = latestDateRangeAttempts()[0];
  const latestPath = latestSolarPathAttempts()[0];
  const latestTime = latestTimeLabAttempts()[0];
  let project;
  let reason;
  const attemptedQuestionIds = new Set(state.attempts.map((attempt) => attempt.question_id));
  const hasActiveUnseen = activeCurriculumQuestionIds().some((id) => !attemptedQuestionIds.has(id));
  if (hasActiveUnseen) {
    project = byId("diagnostic-questions");
    reason = "第三章正在学习：先用一道常见天气系统诊断题定位薄弱环节，再进入对应实验室。";
  } else if (!latestFrontWeather) {
    project = byId("front-weather-lab");
    reason = "第三章第一节：把主动气团、暖空气抬升、降水位置和过境变化连成一条链。";
  } else if (!latestCycloneSystem) {
    project = byId("cyclone-system-lab");
    reason = "第三章第一节：继续把高低压、辐合辐散、半球旋转和阴晴天气连起来。";
  } else if (!latestGlobalCirculation) {
    project = byId("global-circulation-lab");
    reason = "第三章第二节：从受热差异开始，连续推导气压带、风带和季节移动。";
  } else if (!latestMonsoonSystem) {
    project = byId("monsoon-system-lab");
    reason = "第三章第二节：把海陆冷暖、气压中心和东亚南亚季风连成一条因果链。";
  } else if (!latestClimateControl) {
    project = byId("climate-control-lab");
    reason = "第三章第三节：从气压带风带控制推导降水季节、气候类型和自然景观。";
  } else if (!latestClimateGraph) {
    project = byId("climate-graph-lab");
    reason = "第三章第三节：先描述气温和降水图形证据，再判断气候类型与成因。";
  } else if (!latestOrographicRain) {
    project = byId("orographic-rain-lab");
    reason = "第三章问题研究：核对水汽来源、迎风坡抬升、雨影和工程可行性边界。";
  } else if (!latestMotion) {
    project = byId("earth-motion-lab");
    reason = "先用默认可见的运动箭头建立观察视角与自转方向，再完成四项预测。";
  } else if (!latestSolar) {
    project = byId("solar-season-lab");
    reason = "已有晨昏线基础，继续把日期、太阳直射点和昼夜长短连成一条判断链。";
  } else if (!latestCoriolis) {
    project = byId("coriolis-lab");
    reason = "教材第一章补漏：用图示把北右南左、相对左右和地图方位连起来。";
  } else if (!latestAnnual) {
    project = byId("annual-sun-lab");
    reason = "四个节气已经会判断，继续补齐节气之间直射点的移动方向和趋势。";
  } else if (!latestOrbit) {
    project = byId("orbit-speed-lab");
    reason = "已有周年变化基础，继续区分公转轨道远近、速度变化和四季成因。";
  } else if (!latestLink) {
    project = byId("terminator-link-lab");
    reason = "已有晨昏线、昼长和地方时基础，继续把五个分散判断放进同一张全球昼夜图。";
  } else if (!latestRotation) {
    project = byId("rotation-speed-lab");
    reason = "已有自转方向与地方时基础，继续比较不同纬度的角速度、线速度和运动距离。";
  } else if (!latestAxialTilt) {
    project = byId("axial-tilt-lab");
    reason = "已有直射点与极昼极夜基础，继续用黄赤交角同时推导回归线、极圈和五带宽度。";
  } else if (!latestCelestialScale) {
    project = byId("celestial-scale-lab");
    reason = "已有地球运动局部模型，继续把地球放回地月系、太阳系、银河系和可观测宇宙的层级坐标。";
  } else if (!latestHabitability) {
    project = byId("habitability-lab");
    reason = "已有地球宇宙位置基础，继续用行星对照拆开日距、大气、温度和液态水条件。";
  } else if (!latestSolarActivity) {
    project = byId("solar-activity-lab");
    reason = "已有宜居条件的多变量判断基础，继续按载体和时标拆开太阳活动对地球的不同影响。";
  } else if (!latestMoonPhase) {
    project = byId("moon-phase-lab");
    reason = "已有地月系位置基础，继续把日地月相对位置、月面亮暗和一天中的可见时段连成一条链。";
  } else if (!latestEclipse) {
    project = byId("eclipse-lab");
    reason = "已有月相与轨道倾角基础，继续把交点、影锥、食象和地表可见范围连成一条证据链。";
  } else if (!latestTide) {
    project = byId("tide-lab");
    reason = "已有月相位置基础，继续把日月引潮方向、大潮小潮、潮差周期和当地预报边界连成一条链。";
  } else if(!latestDateRange){project=byId("date-range-lab");reason="已有地方时基础，继续用0时经线和180°经线划分全球日期范围。";
  } else if (!latestPath) {
    project = byId("solar-path-lab");
    reason = "已有太阳直射点基础，继续把它转化成日出、正午、日落和影子的具体天空轨迹。";
  } else if (!latestTime) {
    project = byId("time-zone-lab");
    reason = "已有地球运动记录，今天换到世界地图，用具体地点理解地方时与区时。";
  } else if (latestMotion.score < 4 || latestMotion.parent_review_status === "需再练") {
    project = byId("earth-motion-lab");
    reason = "最近一次晨昏线记录仍有步骤需要复盘，换视角再验证比继续看解析更有效。";
  } else if (latestSolar.score < 4 || latestSolar.parent_review_status === "需再练") {
    project = byId("solar-season-lab");
    reason = "最近一次太阳季节实验仍有候选错因，换日期和半球再次验证。";
  } else if (latestAnnual.score < 4 || latestAnnual.parent_review_status === "需再练") {
    project = byId("annual-sun-lab");
    reason = "最近一次周年回归记录仍有候选错因，换到相反移动方向再次验证。";
  } else if (latestOrbit.score < 4 || latestOrbit.parent_review_status === "需再练") {
    project = byId("orbit-speed-lab");
    reason = "最近一次轨道速度实验仍有候选错因，换近日点/远日点和半球再次验证。";
  } else if (latestLink.score < 5 || latestLink.parent_review_status === "需再练") {
    project = byId("terminator-link-lab");
    reason = "最近一次晨昏线综合记录仍有候选错因，换日期、地点和状态类型再次验证。";
  } else if (latestRotation.score < 5 || latestRotation.parent_review_status === "需再练") {
    project = byId("rotation-speed-lab");
    reason = "最近一次自转速度记录仍有候选错因，换到另一纬度带和观察时长再次验证。";
  } else if (latestAxialTilt.score < 5 || latestAxialTilt.parent_review_status === "需再练") {
    project = byId("axial-tilt-lab");
    reason = "最近一次黄赤交角记录仍有候选错因，换到交角增大或减小的反向情境再次验证。";
  } else if (latestCelestialScale.score < 5 || latestCelestialScale.parent_review_status === "需再练") {
    project = byId("celestial-scale-lab");
    reason = "最近一次宇宙尺度记录仍有候选错因，换到内层或外层系统重新建立包含关系。";
  } else if (latestHabitability.score < 5 || latestHabitability.parent_review_status === "需再练") {
    project = byId("habitability-lab");
    reason = "最近一次宜居条件记录仍有候选错因，换成同辐射或不同辐射对照，检查是否仍在用单一因素解释。";
  } else if (latestSolarActivity.score < 5 || latestSolarActivity.parent_review_status === "需再练") {
    project = byId("solar-activity-lab");
    reason = "最近一次太阳活动记录仍有候选错因，换耀斑或CME情境，重新比较传播载体和到达时标。";
  } else if (latestMoonPhase.score < 5 || latestMoonPhase.parent_review_status === "需再练") {
    project = byId("moon-phase-lab");
    reason = "最近一次月相记录仍有候选错因，换到盈亏相反的轨道位置，重新连接亮面和可见时段。";
  } else if (latestEclipse.score < 5 || latestEclipse.parent_review_status === "需再练") {
    project = byId("eclipse-lab");
    reason = "最近一次日月食记录仍有候选错因，换日食或月食情境，重新区分影区与可见范围。";
  } else if (latestTide.score < 5 || latestTide.parent_review_status === "需再练") {
    project = byId("tide-lab");
    reason = "最近一次潮汐记录仍有候选错因，换大潮或小潮情境，重新连接月相、潮差和局地边界。";
  } else if(latestDateRange.score<5||latestDateRange.parent_review_status==="需再练"){project=byId("date-range-lab");reason="最近一次全球日期记录仍有候选错因，换UTC时刻和跨线方向再次验证。";
  } else if (latestPath.score < 4 || latestPath.parent_review_status === "需再练") {
    project = byId("solar-path-lab");
    reason = "最近一次太阳视运动记录仍有候选错因，换日期和地点再走一遍天空轨迹。";
  } else if (latestTime.score < 4 || latestTime.parent_review_status === "需再练") {
    project = byId("time-zone-lab");
    reason = "最近一次时区实验仍有候选错因，换经度和时刻检查能否迁移。";
  } else {
    project = byId("diagnostic-questions");
    reason = "十八个互动实验都已有记录，继续用一道新题检查知识能否独立应用。";
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
  const solarPath = state.solarPathAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${getSolarPathDate(attempt.date_id)?.name || attempt.date_id} · ${getSolarPathPlace(attempt.place_id)?.name || attempt.place_id}`,
    meta: `太阳视运动实验 · ${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const annualSun = state.annualSunAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${getAnnualSunCheckpoint(attempt.checkpoint_id)?.name || attempt.checkpoint_id} · ${getAnnualSunPlace(attempt.place_id)?.name || attempt.place_id}`,
    meta: `周年回归实验 · ${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const orbitSpeed = state.orbitSpeedAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: `${getOrbitSpeedCheckpoint(attempt.checkpoint_id)?.name || attempt.checkpoint_id} · ${getOrbitSpeedHemisphere(attempt.hemisphere_id)?.name || attempt.hemisphere_id}`,
    meta: `公转轨道与速度实验 · ${attempt.score}/4 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  const terminatorLink = state.terminatorLinkAttempts.map((attempt) => {
    const scenario = getTerminatorLinkScenario(attempt.scenario_id);
    return {
      submitted_at: attempt.submitted_at,
      title: `${getTerminatorLinkDate(scenario?.date_id)?.name || scenario?.date_id || attempt.scenario_id} · ${getTerminatorLinkPlace(scenario?.place_id)?.name || scenario?.place_id || "目标地"}`,
      meta: `晨昏线综合联动 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`,
      status: attempt.parent_review_status,
      tone: evidenceTone(attempt.parent_review_status)
    };
  });
  const rotationSpeed = state.rotationSpeedAttempts.map((attempt) => {
    const scenario = getRotationSpeedScenario(attempt.scenario_id);
    const place = getRotationSpeedPlace(scenario?.place_id);
    return {
      submitted_at: attempt.submitted_at,
      title: `${place?.name || scenario?.place_id || attempt.scenario_id} · ${Math.abs(place?.latitude || 0)}°${(place?.latitude || 0) >= 0 ? "N" : "S"}`,
      meta: `地球自转速度 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`,
      status: attempt.parent_review_status,
      tone: evidenceTone(attempt.parent_review_status)
    };
  });
  const dateRange=state.dateRangeAttempts.map(a=>({submitted_at:a.submitted_at,title:`${a.scenario_id} · 全球日期范围`,meta:`全球日期实验 · ${a.score}/5 · ${formatDate(a.submitted_at)}`,status:a.parent_review_status,tone:evidenceTone(a.parent_review_status)}));
  const axialTilt = state.axialTiltAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${attempt.correct_answers?.tilt_deg ?? "?"}° · 黄赤交角变化`, meta: `黄赤交角实验 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const celestialScale = state.celestialScaleAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${window.OrangeCoach?.features?.celestialScale?.getLevel(catalog.celestialScaleLab, attempt.target_level_id)?.name || attempt.target_level_id} · 宇宙位置`, meta: `天体系统尺度实验 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const habitability = state.habitabilityAttempts.map((attempt) => {
    const scenario = getHabitabilityScenario(attempt.scenario_id);
    const bodyA = window.OrangeCoach?.features?.habitability?.getBody(catalog.habitabilityLab, scenario?.body_a);
    const bodyB = window.OrangeCoach?.features?.habitability?.getBody(catalog.habitabilityLab, scenario?.body_b);
    return { submitted_at: attempt.submitted_at, title: `${bodyA?.name || scenario?.body_a} vs ${bodyB?.name || scenario?.body_b}`, meta: `地球宜居条件对照 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) };
  });
  const solarActivity = state.solarActivityAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getSolarActivityScenario(attempt.scenario_id)?.headline || attempt.scenario_id}`, meta: `太阳活动证据判读 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const moonPhase = state.moonPhaseAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getMoonPhase(attempt.phase_id)?.name || attempt.phase_id}`, meta: `月相位置与可见时段 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const eclipse = state.eclipseAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getEclipseCase(attempt.case_id)?.name || attempt.case_id}`, meta: `日月食几何与可见范围 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const tide = state.tideAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getTideCase(attempt.case_id)?.name || attempt.case_id}`, meta: `潮汐周期与月相 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const coriolis = state.coriolisAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getCoriolisScenario(attempt.scenario_id)?.name || attempt.scenario_id}`, meta: `地转偏向力 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const frontWeather = state.frontWeatherAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getFrontWeatherScenario(attempt.scenario_id)?.name || attempt.scenario_id}`, meta: `锋面天气 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const cycloneSystem = state.cycloneSystemAttempts.map((attempt) => ({ submitted_at: attempt.submitted_at, title: `${getCycloneSystemScenario(attempt.scenario_id)?.name || attempt.scenario_id}`, meta: `气旋与反气旋 · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) }));
  const atmosphereReasoning = state.atmosphereReasoningAttempts.map((attempt) => {
    const lab = getAtmosphereLab(attempt.lab_id);
    const scenario = getAtmosphereScenario(lab, attempt.scenario_id);
    return { submitted_at: attempt.submitted_at, title: scenario?.name || attempt.scenario_id, meta: `${lab?.title || "大气运动实验"} · ${attempt.score}/5 · ${formatDate(attempt.submitted_at)}`, status: attempt.parent_review_status, tone: evidenceTone(attempt.parent_review_status) };
  });
  const retests = state.retestAttempts.map((attempt) => ({
    submitted_at: attempt.submitted_at,
    title: getRetest(attempt.retest_id)?.title || attempt.retest_id,
    meta: `延迟复测 · ${formatDate(attempt.submitted_at)}`,
    status: attempt.parent_review_status,
    tone: evidenceTone(attempt.parent_review_status)
  }));
  return [...diagnostic, ...timeLab, ...motion, ...solar, ...solarPath, ...annualSun, ...orbitSpeed, ...terminatorLink, ...rotationSpeed, ...axialTilt, ...celestialScale, ...habitability, ...solarActivity, ...moonPhase, ...eclipse, ...tide, ...coriolis, ...frontWeather, ...cycloneSystem, ...atmosphereReasoning, ...dateRange, ...retests]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
}

function renderProjects() {
  const feature = window.OrangeCoach?.features?.home;
  if (!feature) { app.innerHTML = `<section class="card empty">项目导航未加载，请刷新页面。</section>`; return; }
  app.innerHTML = feature.renderProjects(projectNavigationModel());
}

function renderAttemptSummary(attempt) {
  const question = getQuestion(attempt.question_id);
  const topic = question ? getTopic(question.topic_id) : null;
  return `<div class="attempt-item"><div class="attempt-head"><strong>${escapeHtml(question?.title || attempt.question_id)}</strong><span class="pill ${attempt.is_correct ? "green" : "red"}">${attempt.is_correct ? "正确" : "待复盘"}</span></div><div class="topic-meta">${escapeHtml(topic?.name || "")} · ${formatDate(attempt.submitted_at)} · 家长：${escapeHtml(attempt.parent_review_status)}</div></div>`;
}

function diagnosticQuestionModels() {
  const latestByQuestion = new Map();
  for (const attempt of latestAttempts()) {
    if (!latestByQuestion.has(attempt.question_id)) latestByQuestion.set(attempt.question_id, attempt);
  }
  return catalog.questions.map((question, index) => {
    const latest = latestByQuestion.get(question.id) || null;
    let status = { kind: "unseen", label: "未作答", tone: "" };
    if (latest && !latest.is_correct) status = { kind: "review", label: "待复盘", tone: "red" };
    if (latest?.is_correct && latest.parent_review_status === "已确认") status = { kind: "confirmed", label: "已确认", tone: "green" };
    if (latest?.is_correct && latest.parent_review_status !== "已确认") status = { kind: "answered", label: "答对·待确认", tone: "orange" };
    return { question, index, latest, ...status };
  });
}

function renderDiagnosticCatalog() {
  const models = diagnosticQuestionModels();
  const filter = ["all", "unseen", "review", "answered"].includes(state.diagnosticFilter) ? state.diagnosticFilter : "all";
  const filters = [
    { id: "all", label: "全部" },
    { id: "unseen", label: "未作答" },
    { id: "review", label: "待复盘" },
    { id: "answered", label: "已作答" }
  ];
  const matchesFilter = (model) => filter === "all"
    || (filter === "unseen" && !model.latest)
    || (filter === "review" && model.kind === "review")
    || (filter === "answered" && Boolean(model.latest));
  const visibleModels = models.filter(matchesFilter);
  const answeredCount = models.filter((model) => model.latest).length;
  const reviewCount = models.filter((model) => model.kind === "review").length;
  const unseenCount = models.length - answeredCount;
  const hasUnseen = unseenCount > 0;
  const next = chooseNextQuestion();
  const currentQuestionId = state.currentQuestionId;
  const byQuestionId = new Map(models.map((model) => [model.question.id, model]));
  const visibleIds = new Set(visibleModels.map((model) => model.question.id));
  const renderQuestionRows = (questionIds = []) => questionIds
    .map((id) => byQuestionId.get(id))
    .filter((model) => model && visibleIds.has(model.question.id))
    .map((model) => `
      <button class="diagnostic-question-row ${model.question.id === currentQuestionId ? "current" : ""}" data-action="start-question" data-question-id="${escapeHtml(model.question.id)}" ${model.question.id === currentQuestionId ? 'data-current-question="true" aria-current="true"' : ""} aria-label="打开第 ${model.index + 1} 题：${escapeHtml(model.question.title)}">
        <span class="diagnostic-question-copy"><span class="diagnostic-question-code">第 ${model.index + 1} 题 · ${escapeHtml(model.question.id)}</span><strong>${escapeHtml(model.question.title)}</strong></span>
        <span class="pill ${escapeHtml(model.tone)}">${escapeHtml(model.label)}</span>
      </button>`).join("");
  const curriculumBooks = [...(catalog.curriculum?.books || [])].sort((a, b) => a.order - b.order).map((book) => `
    <section class="curriculum-book-block">
      <div class="curriculum-book-heading"><div><span class="section-kicker">教材目录</span><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.publisher)}</p></div></div>
      <div class="curriculum-chapter-list">
        ${[...book.chapters].sort((a, b) => a.order - b.order).map((chapter) => {
          const questionIds = chapter.sections.flatMap((section) => section.question_ids);
          const visibleCount = questionIds.filter((id) => visibleIds.has(id)).length;
          const status = curriculumStatusModel(chapter.status);
          const containsCurrent = Boolean(currentQuestionId && questionIds.includes(currentQuestionId));
          return `
            <details class="curriculum-chapter" ${containsCurrent ? "open" : ""}>
              <summary><span><small>第${chapter.number}章</small><strong>${escapeHtml(chapter.title)}</strong></span><span class="curriculum-summary-meta"><span class="pill ${status.tone}">${status.label}</span><span class="pill">${questionIds.length ? `${visibleCount}/${questionIds.length} 道` : "0 道"}</span></span></summary>
              <div class="curriculum-chapter-body">
                ${[...chapter.sections].sort((a, b) => a.order - b.order).map((section) => {
                  const rows = renderQuestionRows(section.question_ids);
                  const sectionContainsCurrent = Boolean(currentQuestionId && section.question_ids.includes(currentQuestionId));
                  return `<details class="curriculum-section diagnostic-section" ${sectionContainsCurrent ? "open" : ""}><summary class="curriculum-section-heading"><span>第${section.number}节</span><strong>${escapeHtml(section.title)}</strong><small>${section.question_ids.length} 道已登记</small></summary><div class="diagnostic-section-body">${rows ? `<div class="diagnostic-question-list">${rows}</div>` : `<div class="curriculum-empty">当前${section.question_ids.length ? "筛选下无题目" : "尚未登记题目"}。</div>`}</div></details>`;
                }).join("")}
                <div class="curriculum-research"><span>问题研究</span>${escapeHtml(chapter.research_task)}</div>
              </div>
            </details>`;
        }).join("")}
      </div>
    </section>`).join("");
  const supplemental = catalog.curriculum?.supplemental;
  const supplementalRows = supplemental ? renderQuestionRows(supplemental.question_ids) : "";
  const supplementalContainsCurrent = Boolean(currentQuestionId && supplemental?.question_ids.includes(currentQuestionId));
  const supplementalGroup = supplemental ? `
    <details class="curriculum-chapter supplemental-chapter" ${supplementalContainsCurrent ? "open" : ""}>
      <summary><span><small>教材外与跨章</small><strong>${escapeHtml(supplemental.title)}</strong></span><span class="pill">${supplemental.question_ids.filter((id) => visibleIds.has(id)).length}/${supplemental.question_ids.length} 道</span></summary>
      <div class="curriculum-chapter-body"><p class="small">${escapeHtml(supplemental.description)}</p>${supplementalRows ? `<div class="diagnostic-question-list">${supplementalRows}</div>` : `<div class="curriculum-empty">当前筛选下无题目。</div>`}</div>
    </details>` : "";

  app.innerHTML = `
    <div class="diagnostic-catalog-heading">
      <div><span class="section-kicker">知识点诊断</span><h2 class="page-title">题目目录</h2></div>
      <button class="btn orange" data-action="start-next">继续推荐题</button>
    </div>
    <p class="page-subtitle">按“教材册—章—节”查看题目，再用作答状态筛选。目录不展示正确答案或解析；“已作答”只表示留下记录，不等于已掌握。</p>
    <section class="stat-grid diagnostic-stat-grid" aria-label="诊断题进度">
      <div class="stat"><strong>${models.length}</strong><span>总题量</span></div>
      <div class="stat"><strong>${answeredCount}</strong><span>已作答</span></div>
      <div class="stat"><strong>${reviewCount}</strong><span>待复盘</span></div>
      <div class="stat"><strong>${unseenCount}</strong><span>未作答</span></div>
    </section>
    <section class="card compact-card diagnostic-recommendation">
      <div><span class="section-kicker">自动推荐</span><h3>${escapeHtml(next?.title || "暂无题目")}</h3></div>
      <p class="small">依据：${hasUnseen ? "未作答题优先" : "全部已作答，优先安排当前表现较弱的题目"}。</p>
    </section>
    <div class="diagnostic-filter-bar" role="group" aria-label="筛选诊断题">
      ${filters.map((item) => `<button class="${item.id === filter ? "active" : ""}" data-action="set-diagnostic-filter" data-filter="${item.id}" aria-pressed="${item.id === filter}">${item.label}</button>`).join("")}
    </div>
    ${curriculumBooks}
    ${supplementalGroup}
  `;
  if (currentQuestionId) requestAnimationFrame(() => document.querySelector('[data-current-question="true"]')?.scrollIntoView({ block: "center" }));
}

function renderTrain() {
  const question = getActiveQuestion();
  if (!question) { app.innerHTML = `<section class="card empty">暂无题目。</section>`; return; }
  state.currentQuestionId = question.id;
  const session = state.activeSession;
  if (session && session.questionId === question.id) return renderResult(question, session);
  app.innerHTML = `
    <div class="question-page-heading">
      <div><div class="topic-meta">${escapeHtml(getTopic(question.topic_id)?.category || "")} · ${escapeHtml(getTopic(question.topic_id)?.name || "")} · ${escapeHtml(question.id)}</div><h2 class="page-title">${escapeHtml(question.title)}</h2></div>
      <button class="btn secondary" data-action="open-diagnostic-catalog">题目目录</button>
    </div>
    <p class="page-subtitle">请先独立选择答案。理由可选填，留空也可以提交。</p>
    <section class="card">
      ${question.source_image ? `<figure class="source-question-figure"><a href="${escapeHtml(question.source_image)}" target="_blank" rel="noopener"><img src="${escapeHtml(question.source_image)}" alt="${escapeHtml(question.source_image_alt || "源题配图")}" /></a><figcaption>资料包精选源题配图 · 点按查看原尺寸</figcaption></figure>` : ""}
      <div class="question-stem">${escapeHtml(question.stem)}</div>
      ${question.dataset ? renderDatasetTable(question.dataset) : ""}
      <div class="question-source-note">题源：${escapeHtml(question.source)}</div>
      <form id="answer-form">
        <div class="option-list">${question.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option.id)}" /> <span><strong>${escapeHtml(option.id)}.</strong> ${escapeHtml(option.text)}</span></label>`).join("")}</div>
        <label class="field-label" for="reasoning">选择理由（选填）</label>
        <textarea id="reasoning" placeholder="可选：简单记录判断依据，留空不影响提交。"></textarea>
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
    <div class="question-page-heading">
      <div><div class="topic-meta">${escapeHtml(question.id)} · ${escapeHtml(getTopic(question.topic_id)?.name || "")}</div><h2 class="page-title">${correct ? "答对了，继续核对关键点" : "这道题值得复盘"}</h2></div>
      <button class="btn secondary" data-action="open-diagnostic-catalog">题目目录</button>
    </div>
    <section class="card">
      ${question.source_image ? `<figure class="source-question-figure"><a href="${escapeHtml(question.source_image)}" target="_blank" rel="noopener"><img src="${escapeHtml(question.source_image)}" alt="${escapeHtml(question.source_image_alt || "源题配图")}" /></a><figcaption>资料包精选源题配图 · 点按查看原尺寸</figcaption></figure>` : ""}
      <div class="question-stem">${escapeHtml(question.stem)}</div>
      ${question.dataset ? renderDatasetTable(question.dataset) : ""}
      <div class="result-option-list" aria-label="原题选项（作答后对照）">${question.options.map((option) => {
        const isSelected = option.id === session.selectedOption;
        const isCorrect = option.id === question.answer;
        return `<div class="result-option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""}"><strong>${escapeHtml(option.id)}.</strong><span>${escapeHtml(option.text)}</span>${isSelected ? '<em>你的选择</em>' : ""}${isCorrect ? '<em>正确答案</em>' : ""}</div>`;
      }).join("")}</div>
      <p><strong>你的选择：</strong>${escapeHtml(session.selectedOption)}. ${escapeHtml(selected?.text || "")}</p>
      <p><strong>你的理由（选填）：</strong></p><div class="quote">${optionalReasoning(session.reasoning)}</div>
      <div class="answer-box ${correct ? "correct" : "wrong"}"><strong>${correct ? "结果：正确" : `结果：不正确，正确答案是 ${escapeHtml(question.answer)}`}</strong><br/>${escapeHtml(question.explanation)}</div>
      ${candidate ? `<div class="diagnosis"><strong>AI/题目给出的错因候选：${escapeHtml(candidate.tag)}</strong><br/>${escapeHtml(candidate.diagnosis)}<br/><br/><strong>追问：</strong>${escapeHtml(candidate.follow_up)}</div>` : `<div class="diagnosis"><strong>下一步：</strong>请用自己的话解释为什么不是另外三个选项，防止“碰巧答对”。</div>`}
      <div class="btn-row"><button class="btn orange" data-action="continue-question">保存并继续下一题</button><button class="btn secondary" data-action="open-diagnostic-catalog">回到当前题目录位置</button></div>
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
  const preview = calculateTimeLabAnswers(scenario, longitude);
  app.innerHTML = `
    <div class="topic-meta">自然地理 · 时区与地方时 · ${escapeHtml(scenario.id)}</div>
    <h2 class="page-title">时区实验室</h2>
    <p class="page-subtitle">在地图上选择经度，三种时间会立即联动；可一边观察模型一边完成预测。</p>
    <section class="card time-lab-card">
      <div class="lab-reference"><span>全球参考时刻</span><strong>${escapeHtml(scenario.utc_date)} UTC ${formatClock(scenario.utc_minutes)}</strong></div>
      <div class="lab-model-note">理论模型：地方时按经度每1°差4分钟；区时按最近的15°中央经线计算。不考虑均时差、夏令时和法定边界。</div>
      <div class="longitude-heading"><strong>选择目标地点或经度</strong><span>地图建立空间感，滑杆用于精确选择</span></div>
      ${renderWorldMap(longitude)}
      <div class="clock-grid result-clocks" aria-label="随经度实时联动的时间结果">
        <div><span>UTC</span><strong>${formatClock(scenario.utc_minutes)}</strong><small>${escapeHtml(scenario.utc_date)}</small></div>
        <div><span>地方时</span><strong id="lab-preview-local">${escapeHtml(preview.local_time)}</strong><small>随经度更新</small></div>
        <div><span>理论区时</span><strong id="lab-preview-zone">${escapeHtml(preview.zone_time)}</strong><small id="lab-preview-zone-name">${escapeHtml(preview.zone_name)}</small></div>
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
        <label class="field-label" for="lab-reasoning">判断链（选填）</label>
        <textarea id="lab-reasoning" name="lab-reasoning" placeholder="例如：目标地在东；经度差×4分钟得到地方时；经度÷15°确定理论时区；最后检查是否跨0时。"></textarea>
        <div class="btn-row"><button class="btn orange" type="submit">提交预测</button><button class="btn secondary" type="button" data-action="goto" data-route="today">暂不作答</button></div>
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
      <p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>
      ${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div></div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>仍需用自己的话解释地方时与区时为什么可能不同，并在延迟复测中再次验证。</div>`}
      <div class="btn-row"><button class="btn orange" data-action="next-time-lab">换一组继续预测</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
    </section>
  `;
}

function renderDatasetTable(dataset) {
  return `<div class="data-table-wrap"><table class="data-table"><caption>${escapeHtml(dataset.title)}</caption><thead><tr>${dataset.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${dataset.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderSourceFigures(images = []) {
  if (!images.length) return "";
  return `<div class="source-figure-grid">${images.map((item, index) => `<figure class="source-question-figure"><a href="${escapeHtml(item.src)}" target="_blank" rel="noopener"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || `源题配图${index + 1}`)}" /></a><figcaption>资料包源题配图${images.length > 1 ? ` ${index + 1}` : ""} · 点按查看原尺寸</figcaption></figure>`).join("")}</div>`;
}

function renderRetest() {
  const retest = getRetest(state.currentRetestId) || catalog.retests[0];
  if (!retest) { app.innerHTML = `<section class="card empty">暂无复测任务。</section>`; return; }
  state.currentRetestId = retest.id;
  const isTimeRetest = retest.source_topic_id === "physical.earth.time";
  const isRegionRetest = retest.source_topic_id === "regional.development";
  app.innerHTML = `
    <div class="topic-meta">资料包原题复测 · ${escapeHtml(retest.id)}</div>
    <h2 class="page-title">${escapeHtml(retest.title)}</h2>
    <p class="page-subtitle">${escapeHtml(retest.purpose)}</p>
    <section class="card">
      <div class="notice">${isTimeRetest ? "先写对象、差值、方向和日期，再完成解释。" : isRegionRetest ? "先把图、表和文字材料对应到区域要素，再组织因果链。" : "先看变量、单位和时间尺度，再写总体趋势。"}提交前不显示评分点。</div>
      <p>${escapeHtml(retest.context)}</p>
      ${renderSourceFigures(retest.source_images || [])}
      ${renderDatasetTable(retest.dataset)}
      <div class="question-source-note">题源：${escapeHtml(retest.source_meta?.resource || retest.source)}${retest.source_meta?.section ? ` · ${escapeHtml(retest.source_meta.section)}` : ""}</div>
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
  const latestPath = latestSolarPathAttempts()[0];
  const latestAnnual = latestAnnualSunAttempts()[0];
  const latestOrbit = latestOrbitSpeedAttempts()[0];
  const latestLink = latestTerminatorLinkAttempts()[0];
  const latestRotation = latestRotationSpeedAttempts()[0];
  const latestAxialTilt = latestAxialTiltAttempts()[0];
  const latestCelestialScale = latestCelestialScaleAttempts()[0];
  const latestHabitability = latestHabitabilityAttempts()[0];
  const latestSolarActivity = latestSolarActivityAttempts()[0];
  const latestMoonPhase = latestMoonPhaseAttempts()[0];
  const latestEclipse = latestEclipseAttempts()[0];
  const latestTide = latestTideAttempts()[0];
  const latestCoriolis = latestCoriolisAttempts()[0];
  const latestFrontWeather = latestFrontWeatherAttempts()[0];
  const latestCycloneSystem = latestCycloneSystemAttempts()[0];
  const latestDateRange = latestDateRangeAttempts()[0];
  const motionMastery = earthMotionMasteryStatus();
  const solarMastery = solarSeasonMasteryStatus();
  const pathMastery = solarPathMasteryStatus();
  const annualMastery = annualSunMasteryStatus();
  const orbitMastery = orbitSpeedMasteryStatus();
  const linkMastery = terminatorLinkMasteryStatus();
  const rotationMastery = rotationSpeedMasteryStatus();
  const axialMastery = axialTiltMasteryStatus();
  const celestialMastery = celestialScaleMasteryStatus();
  const habitabilityMastery = habitabilityMasteryStatus();
  const solarActivityMastery = solarActivityMasteryStatus();
  const moonPhaseMastery = moonPhaseMasteryStatus();
  const eclipseMastery = eclipseMasteryStatus();
  const tideMastery = tideMasteryStatus();
  const coriolisMastery = coriolisMasteryStatus();
  const frontWeatherMastery = frontWeatherMasteryStatus();
  const cycloneSystemMastery = cycloneSystemMasteryStatus();
  const dateRangeMastery = dateRangeMasteryStatus();
  const atmosphereMasteryCards = (catalog.atmosphereLabs?.labs || []).map((lab) => {
    const latest = latestAtmosphereAttempts(lab.id)[0];
    const mastery = atmosphereMasteryStatus(lab.id);
    const sectionLabel = lab.section_id?.endsWith("s03") ? "第三章第三节" : "第三章第二节";
    const latestScenario = latest ? getAtmosphereScenario(lab, latest.scenario_id) : null;
    return `<section class="card"><div class="attempt-head"><div><span class="pill orange">${sectionLabel}</span><h3>${escapeHtml(lab.title)}</h3></div><span class="pill ${mastery.mastered ? "green" : "orange"}">${escapeHtml(mastery.label)}</span></div><p class="small">${latest ? `最近实验：${escapeHtml(latestScenario?.name || latest.scenario_id)} · ${latest.score}/5 · ${escapeHtml(latest.parent_review_status)} · ${formatDate(latest.submitted_at)}` : `先完成一次${escapeHtml(lab.title)}，留下五步判断证据。`}</p><p class="small">${escapeHtml(mastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-atmosphere-lab" data-route="${escapeHtml(lab.id)}">进入实验室</button></div></section>`;
  }).join("");
  app.innerHTML = `
    <h2 class="page-title">掌握与复测</h2>
    <p class="page-subtitle">百分比只是提示，不代表真正掌握。真正的证据来自延迟复测和能否讲清推理链。</p>
    <section class="card"><div class="topic-list">${catalog.topics.map((topic) => {
      const stats = topicStats(topic);
      return `<div class="topic-item"><div class="topic-head"><div><strong>${escapeHtml(topic.name)}</strong><div class="topic-meta">${escapeHtml(topic.category)} · ${stats.attempts.length ? `${stats.attempts.length} 次作答` : "尚未开始"}</div></div><span class="pill ${stats.ratio >= 70 ? "green" : stats.attempts.length ? "orange" : ""}">${stats.attempts.length ? `${stats.ratio}%` : "待建立"}</span></div><div class="progress"><span style="width:${stats.ratio}%"></span></div><div class="topic-meta">${escapeHtml(topic.description)}</div></div>`;
    }).join("")}</div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">第三章第一节</span><h3>锋型—抬升—降水—过境天气</h3></div><span class="pill ${frontWeatherMastery.mastered ? "green" : "orange"}">${escapeHtml(frontWeatherMastery.label)}</span></div><p class="small">${latestFrontWeather ? `最近实验：${escapeHtml(getFrontWeatherScenario(latestFrontWeather.scenario_id)?.name || latestFrontWeather.scenario_id)} · ${latestFrontWeather.score}/5 · ${escapeHtml(latestFrontWeather.parent_review_status)} · ${formatDate(latestFrontWeather.submitted_at)}` : "先完成一次锋面天气实验，留下五步结构判断证据。"}</p><p class="small">${escapeHtml(frontWeatherMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-front-weather">进入锋面天气实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">第三章第一节</span><h3>高低压—旋转—垂直运动—阴晴</h3></div><span class="pill ${cycloneSystemMastery.mastered ? "green" : "orange"}">${escapeHtml(cycloneSystemMastery.label)}</span></div><p class="small">${latestCycloneSystem ? `最近实验：${escapeHtml(getCycloneSystemScenario(latestCycloneSystem.scenario_id)?.name || latestCycloneSystem.scenario_id)} · ${latestCycloneSystem.score}/5 · ${escapeHtml(latestCycloneSystem.parent_review_status)} · ${formatDate(latestCycloneSystem.submitted_at)}` : "先完成一次气旋反气旋实验，留下五步环流判断证据。"}</p><p class="small">${escapeHtml(cycloneSystemMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-cyclone-system">进入气旋反气旋实验室</button></div></section>
    ${atmosphereMasteryCards}
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地球运动专项</span><h3>视角—方向—晨昏线</h3></div><span class="pill ${motionMastery.mastered ? "green" : "orange"}">${escapeHtml(motionMastery.label)}</span></div><p class="small">${latestMotion ? `最近实验：${escapeHtml(getEarthMotionView(latestMotion.view_id)?.name || latestMotion.view_id)} · ${latestMotion.score}/4 · ${escapeHtml(latestMotion.parent_review_status)} · ${formatDate(latestMotion.submitted_at)}` : "先完成一次晨昏线实验，留下观察视角和判断链。"}</p><p class="small">${escapeHtml(motionMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-earth-motion">进入晨昏线实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地转偏向力专项</span><h3>半球—相对左右—地图方位</h3></div><span class="pill ${coriolisMastery.mastered ? "green" : "orange"}">${escapeHtml(coriolisMastery.label)}</span></div><p class="small">${latestCoriolis ? `最近实验：${escapeHtml(getCoriolisScenario(latestCoriolis.scenario_id)?.name || latestCoriolis.scenario_id)} · ${latestCoriolis.score}/5 · ${escapeHtml(latestCoriolis.parent_review_status)} · ${formatDate(latestCoriolis.submitted_at)}` : "先完成一次地转偏向力实验，建立北右南左与方位转换。"}</p><p class="small">${escapeHtml(coriolisMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-coriolis">进入地转偏向力实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地球公转专项</span><h3>日期—直射点—昼长—太阳高度</h3></div><span class="pill ${solarMastery.mastered ? "green" : "orange"}">${escapeHtml(solarMastery.label)}</span></div><p class="small">${latestSolar ? `最近实验：${escapeHtml(getSolarSeasonDate(latestSolar.date_id)?.name || latestSolar.date_id)} · ${escapeHtml(getSolarSeasonPlace(latestSolar.place_id)?.name || latestSolar.place_id)} · ${latestSolar.score}/4 · ${escapeHtml(latestSolar.parent_review_status)} · ${formatDate(latestSolar.submitted_at)}` : "先完成一次太阳季节实验，留下直射点、昼长和正午太阳高度判断链。"}</p><p class="small">${escapeHtml(solarMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-solar-season">进入太阳季节实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">周年回归专项</span><h3>日期位置—直射纬度—移动方向—变化趋势</h3></div><span class="pill ${annualMastery.mastered ? "green" : "orange"}">${escapeHtml(annualMastery.label)}</span></div><p class="small">${latestAnnual ? `最近实验：${escapeHtml(getAnnualSunCheckpoint(latestAnnual.checkpoint_id)?.name || latestAnnual.checkpoint_id)} · ${escapeHtml(getAnnualSunPlace(latestAnnual.place_id)?.name || latestAnnual.place_id)} · ${latestAnnual.score}/4 · ${escapeHtml(latestAnnual.parent_review_status)} · ${formatDate(latestAnnual.submitted_at)}` : "先完成一次周年回归实验，留下直射纬度、移动方向和趋势判断链。"}</p><p class="small">${escapeHtml(annualMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-annual-sun">进入周年回归实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">公转速度专项</span><h3>轨道位置—日地距离—公转速度—四季成因</h3></div><span class="pill ${orbitMastery.mastered ? "green" : "orange"}">${escapeHtml(orbitMastery.label)}</span></div><p class="small">${latestOrbit ? `最近实验：${escapeHtml(getOrbitSpeedCheckpoint(latestOrbit.checkpoint_id)?.name || latestOrbit.checkpoint_id)} · ${escapeHtml(getOrbitSpeedHemisphere(latestOrbit.hemisphere_id)?.name || latestOrbit.hemisphere_id)} · ${latestOrbit.score}/4 · ${escapeHtml(latestOrbit.parent_review_status)} · ${formatDate(latestOrbit.submitted_at)}` : "先完成一次公转轨道实验，留下远近、快慢和季节成因判断链。"}</p><p class="small">${escapeHtml(orbitMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-orbit-speed">进入公转轨道实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">晨昏线综合专项</span><h3>直射经线—地方时—昼长—晨昏状态—极昼极夜</h3></div><span class="pill ${linkMastery.mastered ? "green" : "orange"}">${escapeHtml(linkMastery.label)}</span></div><p class="small">${latestLink ? `最近实验：${escapeHtml(getTerminatorLinkScenario(latestLink.scenario_id)?.id || latestLink.scenario_id)} · ${latestLink.score}/5 · ${escapeHtml(latestLink.parent_review_status)} · ${formatDate(latestLink.submitted_at)}` : "先完成一次全球晨昏线联动实验，留下五步综合判断链。"}</p><p class="small">${escapeHtml(linkMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-terminator-link">进入晨昏线综合实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">自转速度专项</span><h3>自转周期—角速度—纬线圈—线速度—运动距离</h3></div><span class="pill ${rotationMastery.mastered ? "green" : "orange"}">${escapeHtml(rotationMastery.label)}</span></div><p class="small">${latestRotation ? `最近实验：${escapeHtml(getRotationSpeedPlace(getRotationSpeedScenario(latestRotation.scenario_id)?.place_id)?.name || latestRotation.scenario_id)} · ${latestRotation.score}/5 · ${escapeHtml(latestRotation.parent_review_status)} · ${formatDate(latestRotation.submitted_at)}` : "先完成一次自转速度实验，留下角速度、线速度与弧长判断链。"}</p><p class="small">${escapeHtml(rotationMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-rotation-speed">进入自转速度实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">黄赤交角专项</span><h3>交角—回归线—极圈—五带宽度</h3></div><span class="pill ${axialMastery.mastered ? "green" : "orange"}">${escapeHtml(axialMastery.label)}</span></div><p class="small">${latestAxialTilt ? `最近实验：ε=${latestAxialTilt.correct_answers?.tilt_deg}° · ${latestAxialTilt.score}/5 · ${escapeHtml(latestAxialTilt.parent_review_status)} · ${formatDate(latestAxialTilt.submitted_at)}` : "先完成一次黄赤交角实验，留下回归线、极圈和五带宽度判断链。"}</p><p class="small">${escapeHtml(axialMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-axial-tilt">进入黄赤交角实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">宇宙位置专项</span><h3>系统层级—尺度单位—银河系位置</h3></div><span class="pill ${celestialMastery.mastered ? "green" : "orange"}">${escapeHtml(celestialMastery.label)}</span></div><p class="small">${latestCelestialScale ? `最近实验：${escapeHtml(latestCelestialScale.target_level_id)} · ${latestCelestialScale.score}/5 · ${escapeHtml(latestCelestialScale.parent_review_status)} · ${formatDate(latestCelestialScale.submitted_at)}` : "先完成一次天体系统尺度实验，留下包含关系、尺度单位和宇宙位置判断链。"}</p><p class="small">${escapeHtml(celestialMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-celestial-scale">进入宇宙尺度实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">地球宜居专项</span><h3>太阳辐射—大气—温度—液态水—证据边界</h3></div><span class="pill ${habitabilityMastery.mastered ? "green" : "orange"}">${escapeHtml(habitabilityMastery.label)}</span></div><p class="small">${latestHabitability ? `最近实验：${escapeHtml(latestHabitability.scenario_id)} · ${latestHabitability.score}/5 · ${escapeHtml(latestHabitability.parent_review_status)} · ${formatDate(latestHabitability.submitted_at)}` : "先完成一次行星对照实验，留下多变量宜居条件判断链。"}</p><p class="small">${escapeHtml(habitabilityMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-habitability">进入宜居条件实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">太阳活动专项</span><h3>太阳源—传播载体—到达时标—地球响应</h3></div><span class="pill ${solarActivityMastery.mastered ? "green" : "orange"}">${escapeHtml(solarActivityMastery.label)}</span></div><p class="small">${latestSolarActivity ? `最近实验：${escapeHtml(latestSolarActivity.scenario_id)} · ${latestSolarActivity.score}/5 · ${escapeHtml(latestSolarActivity.parent_review_status)} · ${formatDate(latestSolarActivity.submitted_at)}` : "先完成一次太阳活动实验，留下现象、载体、时标和影响判断链。"}</p><p class="small">${escapeHtml(solarActivityMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-solar-activity">进入太阳活动实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">月相专项</span><h3>日地月位置—亮面—盈亏—可见时段</h3></div><span class="pill ${moonPhaseMastery.mastered ? "green" : "orange"}">${escapeHtml(moonPhaseMastery.label)}</span></div><p class="small">${latestMoonPhase ? `最近实验：${escapeHtml(getMoonPhase(latestMoonPhase.phase_id)?.name || latestMoonPhase.phase_id)} · ${latestMoonPhase.score}/5 · ${escapeHtml(latestMoonPhase.parent_review_status)} · ${formatDate(latestMoonPhase.submitted_at)}` : "先完成一次月相实验，留下相对位置、亮面、盈亏和可见时段判断链。"}</p><p class="small">${escapeHtml(moonPhaseMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-moon-phase">进入月相实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">日月食专项</span><h3>月相交点—影锥—食象—可见范围</h3></div><span class="pill ${eclipseMastery.mastered ? "green" : "orange"}">${escapeHtml(eclipseMastery.label)}</span></div><p class="small">${latestEclipse ? `最近实验：${escapeHtml(getEclipseCase(latestEclipse.case_id)?.name || latestEclipse.case_id)} · ${latestEclipse.score}/5 · ${escapeHtml(latestEclipse.parent_review_status)} · ${formatDate(latestEclipse.submitted_at)}` : "先完成一次日月食实验，留下位置、影区、食象与可见范围判断链。"}</p><p class="small">${escapeHtml(eclipseMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-eclipse">进入日月食实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">潮汐周期专项</span><h3>月相几何—引潮叠加—潮差—周期—局地边界</h3></div><span class="pill ${tideMastery.mastered ? "green" : "orange"}">${escapeHtml(tideMastery.label)}</span></div><p class="small">${latestTide ? `最近实验：${escapeHtml(getTideCase(latestTide.case_id)?.name || latestTide.case_id)} · ${latestTide.score}/5 · ${escapeHtml(latestTide.parent_review_status)} · ${formatDate(latestTide.submitted_at)}` : "先完成一次潮汐实验，留下月相、潮型、潮差、周期与证据边界判断链。"}</p><p class="small">${escapeHtml(tideMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-tide">进入潮汐实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">全球日期专项</span><h3>UTC—0时经线—日期带占比—日界线</h3></div><span class="pill ${dateRangeMastery.mastered ? "green" : "orange"}">${escapeHtml(dateRangeMastery.label)}</span></div><p class="small">${latestDateRange ? `最近实验：${escapeHtml(latestDateRange.scenario_id)} · ${latestDateRange.score}/5 · ${escapeHtml(latestDateRange.parent_review_status)} · ${formatDate(latestDateRange.submitted_at)}` : "先完成一次全球日期范围实验，留下0时经线、日期占比和跨线判断链。"}</p><p class="small">${escapeHtml(dateRangeMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-date-range">进入全球日期实验室</button></div></section>
    <section class="card"><div class="attempt-head"><div><span class="pill orange">太阳视运动专项</span><h3>直射点—日出日落—正午方位—影子</h3></div><span class="pill ${pathMastery.mastered ? "green" : "orange"}">${escapeHtml(pathMastery.label)}</span></div><p class="small">${latestPath ? `最近实验：${escapeHtml(getSolarPathDate(latestPath.date_id)?.name || latestPath.date_id)} · ${escapeHtml(getSolarPathPlace(latestPath.place_id)?.name || latestPath.place_id)} · ${latestPath.score}/4 · ${escapeHtml(latestPath.parent_review_status)} · ${formatDate(latestPath.submitted_at)}` : "先完成一次太阳视运动实验，留下日出、正午、日落和影子方向判断链。"}</p><p class="small">${escapeHtml(pathMastery.detail)}</p><div class="btn-row"><button class="btn orange" data-action="start-solar-path">进入太阳视运动实验室</button></div></section>
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
  const solarPathAttempts = latestSolarPathAttempts();
  const annualSunAttempts = latestAnnualSunAttempts();
  const orbitSpeedAttempts = latestOrbitSpeedAttempts();
  const terminatorLinkAttempts = latestTerminatorLinkAttempts();
  const rotationSpeedAttempts = latestRotationSpeedAttempts();
  const dateRangeAttempts = latestDateRangeAttempts();
  const axialTiltAttempts = latestAxialTiltAttempts();
  const celestialScaleAttempts = latestCelestialScaleAttempts();
  const habitabilityAttempts = latestHabitabilityAttempts();
  const solarActivityAttempts = latestSolarActivityAttempts();
  const moonPhaseAttempts = latestMoonPhaseAttempts();
  const eclipseAttempts = latestEclipseAttempts();
  const tideAttempts = latestTideAttempts();
  const coriolisAttempts = latestCoriolisAttempts();
  const frontWeatherAttempts = latestFrontWeatherAttempts();
  const cycloneSystemAttempts = latestCycloneSystemAttempts();
  const atmosphereReasoningAttempts = latestAtmosphereAttempts();
  app.innerHTML = `
    <h2 class="page-title">家长审核页</h2>
    <p class="page-subtitle">只核验三件事：理由是否真实、诊断是否有证据、下一步是否可执行。</p>
    <div class="notice">家长不是每道题的讲解员，而是学习过程的质量审核员。连续 2–3 次同类错误，再考虑请老师校准。</div>
    <section class="card"><h3>真实试卷复盘</h3>${catalog.paperReviews.map(renderPaperReview).join("") || `<div class="empty">尚未录入试卷复盘。</div>`}</section>
    <section class="card"><h3>晨昏线实验审核</h3>${earthMotionAttempts.length ? `<div class="attempt-list">${earthMotionAttempts.map(renderParentEarthMotionAttempt).join("")}</div>` : `<div class="empty">橙子提交观察视角预测后，这里会出现判断链和候选错因。</div>`}</section>
    <section class="card"><h3>地转偏向力实验审核</h3>${coriolisAttempts.length ? `<div class="attempt-list">${coriolisAttempts.map(renderParentCoriolisAttempt).join("")}</div>` : `<div class="empty">橙子提交半球、相对偏向与地图方位预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>锋面天气实验审核</h3>${frontWeatherAttempts.length ? `<div class="attempt-list">${frontWeatherAttempts.map(renderParentFrontWeatherAttempt).join("")}</div>` : `<div class="empty">橙子提交锋型、主动气团、抬升、降水位置与天气变化后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>气旋与反气旋实验审核</h3>${cycloneSystemAttempts.length ? `<div class="attempt-list">${cycloneSystemAttempts.map(renderParentCycloneSystemAttempt).join("")}</div>` : `<div class="empty">橙子提交气压中心、水平气流、旋转、垂直运动与阴晴后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>大气环流、气候与地形雨实验审核</h3>${atmosphereReasoningAttempts.length ? `<div class="attempt-list">${atmosphereReasoningAttempts.map(renderParentAtmosphereAttempt).join("")}</div>` : `<div class="empty">橙子提交三圈环流、季风、气候成因、气候图或地形雨五步判断后，这里会出现审核证据。</div>`}</section>
    <section class="card"><h3>太阳季节实验审核</h3>${solarSeasonAttempts.length ? `<div class="attempt-list">${solarSeasonAttempts.map(renderParentSolarSeasonAttempt).join("")}</div>` : `<div class="empty">橙子提交直射点与昼长预测后，这里会出现四步判断证据。</div>`}</section>
    <section class="card"><h3>周年回归实验审核</h3>${annualSunAttempts.length ? `<div class="attempt-list">${annualSunAttempts.map(renderParentAnnualSunAttempt).join("")}</div>` : `<div class="empty">橙子提交直射点移动与趋势预测后，这里会出现四步判断证据。</div>`}</section>
    <section class="card"><h3>公转轨道与速度实验审核</h3>${orbitSpeedAttempts.length ? `<div class="attempt-list">${orbitSpeedAttempts.map(renderParentOrbitSpeedAttempt).join("")}</div>` : `<div class="empty">橙子提交轨道远近、速度、半球季节与成因预测后，这里会出现判断证据。</div>`}</section>
    <section class="card"><h3>晨昏线综合联动实验审核</h3>${terminatorLinkAttempts.length ? `<div class="attempt-list">${terminatorLinkAttempts.map(renderParentTerminatorLinkAttempt).join("")}</div>` : `<div class="empty">橙子提交直射经线、地方时、昼长、晨昏状态与极昼极夜预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>地球自转速度实验审核</h3>${rotationSpeedAttempts.length ? `<div class="attempt-list">${rotationSpeedAttempts.map(renderParentRotationSpeedAttempt).join("")}</div>` : `<div class="empty">橙子提交角速度、线速度、转角与纬线弧长预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>黄赤交角与五带实验审核</h3>${axialTiltAttempts.length ? `<div class="attempt-list">${axialTiltAttempts.map(renderParentAxialTiltAttempt).join("")}</div>` : `<div class="empty">橙子提交回归线、极圈、热带和温带宽度预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>天体系统尺度与宇宙位置审核</h3>${celestialScaleAttempts.length ? `<div class="attempt-list">${celestialScaleAttempts.map(renderParentCelestialScaleAttempt).join("")}</div>` : `<div class="empty">橙子提交系统顺序、尺度单位、银河系位置与读图规则后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>地球宜居条件对照审核</h3>${habitabilityAttempts.length ? `<div class="attempt-list">${habitabilityAttempts.map(renderParentHabitabilityAttempt).join("")}</div>` : `<div class="empty">橙子提交太阳辐射、大气、温度、液态水与证据边界预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>太阳活动证据判读审核</h3>${solarActivityAttempts.length ? `<div class="attempt-list">${solarActivityAttempts.map(renderParentSolarActivityAttempt).join("")}</div>` : `<div class="empty">橙子提交太阳源现象、传播载体、到达时标、地球影响与证据边界预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>月相位置与可见时段审核</h3>${moonPhaseAttempts.length ? `<div class="attempt-list">${moonPhaseAttempts.map(renderParentMoonPhaseAttempt).join("")}</div>` : `<div class="empty">橙子提交月相、可见亮面、盈亏变化、中天时刻与证据边界预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>日月食几何与可见范围审核</h3>${eclipseAttempts.length ? `<div class="attempt-list">${eclipseAttempts.map(renderParentEclipseAttempt).join("")}</div>` : `<div class="empty">橙子提交月相交点、关键影区、食象、可见范围与证据边界预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>潮汐周期与月相审核</h3>${tideAttempts.length ? `<div class="attempt-list">${tideAttempts.map(renderParentTideAttempt).join("")}</div>` : `<div class="empty">橙子提交月相几何、潮型、潮差、周期与局地边界预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>全球日期范围实验审核</h3>${dateRangeAttempts.length ? `<div class="attempt-list">${dateRangeAttempts.map(renderParentDateRangeAttempt).join("")}</div>` : `<div class="empty">橙子提交0时经线、日期占比、日期数量与跨日界线预测后，这里会出现五步判断证据。</div>`}</section>
    <section class="card"><h3>太阳视运动实验审核</h3>${solarPathAttempts.length ? `<div class="attempt-list">${solarPathAttempts.map(renderParentSolarPathAttempt).join("")}</div>` : `<div class="empty">橙子提交日出日落与影子预测后，这里会出现四步判断证据。</div>`}</section>
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
  return `请批注我附上的“橙子地理教练”JSON学习档案。\n\n要求：\n1. 只根据档案中的作答、理由、家长审核和延迟复测证据判断；证据不足时明确写“证据不足”。\n2. 不修改 attempts、retest_attempts、time_lab_attempts、earth_motion_attempts、solar_season_attempts、solar_path_attempts、annual_sun_attempts、orbit_speed_attempts、terminator_link_attempts、rotation_speed_attempts、date_range_attempts、axial_tilt_attempts、celestial_scale_attempts、habitability_attempts、solar_activity_attempts、moon_phase_attempts、eclipse_attempts、tide_attempts、coriolis_attempts、front_weather_attempts、cyclone_system_attempts、atmosphere_reasoning_attempts 等原始记录。\n3. 按 annotation_guide.expected_annotation_shape，把本次批注追加到 coach_annotations 数组。\n4. 区分“候选”“已确认”“需教师复核”，不把一次答对或一次满分当成掌握。\n5. next_step 给出一个可执行的微任务或延迟复测建议，并引用 evidence_refs。\n\n完成后请返回完整、可导入的 JSON 文件。`;
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
  "S-NOON-ALTITUDE": "正午太阳高度计算错误",
  "P-DATE-RISESET": "日期与日出日落方位对应错误",
  "P-NOON-LATITUDE": "没有比较当地纬度与太阳直射纬度",
  "P-SHADOW-OPPOSITE": "影子方向没有与太阳方位相反",
  "P-OVERHEAD-SHADOW": "太阳直射时的正午影子判断错误",
  "A-DATE-LATITUDE": "不能由日期估计太阳直射纬度",
  "A-MIGRATION-DIRECTION": "直射点位置与移动方向混淆",
  "A-SOLSTICE-TURN": "没有把二至日识别为移动方向转折点",
  "A-DAY-TREND": "直射点移动与北半球昼长趋势对应错误",
  "A-ALTITUDE-TREND": "直射点移动与目标地正午太阳高度趋势对应错误",
  "O-DISTANCE-POSITION": "不能由轨道位置判断日地距离状态",
  "O-SPEED-DISTANCE": "没有建立近日点快、远日点慢的对应关系",
  "O-HEMISPHERE-SEASON": "同一日期的南北半球季节对应错误",
  "O-SEASON-DISTANCE": "把日地距离当成四季的主要成因",
  "O-SEASON-CAUSE": "四季成因判断缺少地轴倾斜和指向不变",
  "L-DIRECT-MERIDIAN": "没有把太阳直射经线与地方时12:00对应",
  "L-LOCAL-TIME": "经度差换算地方时出现方向或进位错误",
  "L-DAY-LENGTH": "没有由纬度和太阳直射纬度判断昼长",
  "L-TERMINATOR-STATUS": "没有用日出日落时刻区分白昼、黑夜、晨线和昏线",
  "L-POLAR-RANGE": "极昼极夜半球和范围对应错误",
  "R-ANGULAR-SAME": "把自转角速度错误地看成随纬度变化",
  "R-LATITUDE-CIRCLE": "没有把纬度升高与纬线圈缩短联系起来",
  "R-LINE-SPEED": "线速度数值没有按赤道速度乘cos纬度估算",
  "R-ANGLE-TIME": "转过角度与经过时间的15°/小时关系错误",
  "R-DISTANCE-SPEED": "没有用线速度乘时间求纬线弧长",
  "D-MIDNIGHT-MERIDIAN": "没有把UTC时刻换算为地方时0时经线",
  "D-NEW-DATE-RANGE": "较新日期范围方向或占比错误",
  "D-OLD-DATE-RANGE": "较旧日期占比没有与较新日期互补",
  "D-DATE-COUNT": "全球日期数量判断错误：仅0时经线与180°经线重合时为一个日期",
  "D-IDL-DIRECTION": "跨越180°经线时日期加减方向错误",
  "X-TROPIC-LATITUDE": "没有把黄赤交角与回归线纬度对应",
  "X-POLAR-CIRCLE": "没有用90°减黄赤交角求极圈纬度",
  "X-TROPICAL-WIDTH": "把回归线纬度误当成南北回归线之间的总宽度",
  "X-TEMPERATE-WIDTH": "没有用极圈纬度减回归线纬度求每个温带的宽度",
  "X-ZONE-CHANGE": "黄赤交角变化与热带、温带、寒带宽窄变化对应错误",
  "C-SYSTEM-ORDER": "天体系统包含关系和由小到大顺序混淆",
  "C-MOON-SCALE": "地月距离的数量级或单位判断错误",
  "C-AU-SCALE": "没有把 1 AU 与日地平均距离对应",
  "C-GALACTIC-LOCATION": "把太阳系误放在银心、银河系外或最外缘",
  "C-DIAGRAM-SCALE": "把强烈压缩的层级示意图当成真实比例图",
  "H-SOLAR-FLUX": "没有用日距平方反比比较接收的太阳辐射",
  "H-ATMOSPHERE-PRESSURE": "把大气成分比例与大气总量、气压混为一谈",
  "H-TEMP-WINDOW": "只按日距判断温度，没有结合大气温室效应",
  "H-LIQUID-WATER": "把水冰或水分子误当成地表长期稳定液态水",
  "H-EVIDENCE-BOUNDARY": "把宜居条件、液态水证据直接写成存在生命的证明",
  "SA-PHENOMENON": "把黑子、耀斑、粒子事件、CME或地磁响应混为同一现象",
  "SA-TRANSPORT": "没有区分电磁辐射、高能粒子与磁化等离子体的传播载体",
  "SA-TIMESCALE": "把约8分钟、分钟至小时、数十小时至数日和约11年混成同一时间尺度",
  "SA-EARTH-IMPACT": "太阳源现象与无线电、辐射、地磁、导航或电网影响对应错误",
  "SA-EVIDENCE-BOUNDARY": "把活动概率、伴随关系或可能影响写成必然因果",
  "MP-POSITION-PHASE": "没有把日地月相对位置转换成正确月相",
  "MP-ILLUMINATION": "把地球看到的亮面比例与月球实际受光的一半混为一谈",
  "MP-WAX-WANE": "没有结合月球位置、连续变化或可见时段区分渐盈与渐亏",
  "MP-VISIBLE-TIME": "月相与月升、中天、月落及可见时段对应错误",
  "MP-EVIDENCE-BOUNDARY": "把普通月相写成地影作用、必然日月食或固定左右朝向",
  "EC-ALIGNMENT-PHASE": "没有把新月/满月、日地月次序与轨道交点条件连起来",
  "EC-SHADOW-TYPE": "把本影、半影、伪本影及其投射对象混淆",
  "EC-ECLIPSE-TYPE": "日全食、日环食、日偏食或三类月食判断错误",
  "EC-VISIBILITY": "没有区分日食的局地影带与月食的广大夜半球可见范围",
  "EC-EVIDENCE-BOUNDARY": "把新月/满月写成食的充分条件，或把局地食相推广到全球",
  "TD-GEOMETRY-PHASE": "没有把月相转换成太阳—地球—月球方向关系",
  "TD-SPRING-NEAP": "混淆大潮、小潮与日月引潮作用的叠加方式",
  "TD-TIDAL-RANGE": "把潮差大小、高潮水位和是否发生潮汐混为一谈",
  "TD-LUNAR-DAY": "没有建立太阴日、每日常见潮次与朔望月潮序周期",
  "TD-LOCAL-BOUNDARY": "把理想潮汐规律写成任意港口的精确潮时潮高预报",
  "CF-HEMISPHERE-RULE": "南北半球偏转规律混淆",
  "CF-RELATIVE-SIDE": "没有相对运动方向判断左右",
  "CF-MAP-DIRECTION": "相对左右没有转换为地图方位",
  "CF-SPEED-EFFECT": "把地转偏向力误当作改变速度大小",
  "CF-SCALE-APPLICATION": "忽略大尺度运动和赤道边界"
};

function errorTagLabel(tag) {
  return ERROR_TAG_LABELS[tag]
    || catalog.frontWeatherLab?.error_tags?.[tag]
    || catalog.cycloneSystemLab?.error_tags?.[tag]
    || (catalog.atmosphereLabs?.labs || []).find((lab) => lab.error_tags?.[tag])?.error_tags?.[tag]
    || tag;
}

function renderPaperReview(review) {
  const question = review.reviewed_question;
  return `<article class="paper-review"><div class="attempt-head"><div><strong>${escapeHtml(review.title)}</strong><div class="topic-meta">${escapeHtml(review.scope)} · ${escapeHtml(review.id)}</div></div><span class="pill orange">${escapeHtml(question.diagnosis_status)}诊断</span></div><div class="score-pair"><div><span>卷面原始分</span><strong>${review.scores.raw.earned}/${review.scores.raw.max}</strong></div><div><span>标准分</span><strong>${review.scores.standard.earned}</strong></div></div><div class="notice">两种分数量尺不同，不混合计算。${escapeHtml(review.scores.standard.scale_note)}</div><h4>${escapeHtml(question.id)} · ${escapeHtml(question.title)} · ${question.earned_points}/${question.max_points}</h4><div class="diagnosis-list">${question.subquestions.map((item) => `<div class="diagnosis-item"><div class="attempt-head"><strong>${escapeHtml(item.id)}</strong><span class="pill red">${item.earned_points}/${item.max_points}</span></div><p class="small">${escapeHtml(item.answer_evidence)}</p><div>${item.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join(" ")}</div></div>`).join("")}</div><p class="small">${escapeHtml(review.source_note)}</p><div class="btn-row"><button class="btn orange" data-action="start-retest" data-retest-id="${escapeHtml(catalog.retests.find((item) => item.source_paper_review_id === review.id)?.id || "")}">开始第19题换情境复测</button></div></article>`;
}

function renderParentTimeLabAttempt(attempt) {
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${longitudeLabel(attempt.longitude)} · 时区实验</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · ${escapeHtml(attempt.scenario_id)}</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="lab-parent-summary"><span>地方时 <strong>${escapeHtml(correct.local_time)}</strong></span><span>${escapeHtml(correct.zone_name)} <strong>${escapeHtml(correct.zone_time)}</strong></span><span>日期 <strong>${escapeHtml(correct.date_relation)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个计算步骤均正确</strong><br/>请继续追问：为什么地方时和区时可能不同？</div>`}<label class="field-label" for="lab-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="lab-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="lab-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="lab-note-${escapeHtml(attempt.id)}" placeholder="例如：会算地方时，但区时仍按经度分钟计算">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-lab-review" data-attempt-id="${escapeHtml(attempt.id)}">保存实验审核</button></div></article>`;
}

function renderParentEarthMotionAttempt(attempt) {
  const view = getEarthMotionView(attempt.view_id);
  const point = getEarthMotionPoint(view, attempt.point_id);
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(view?.name || attempt.view_id)} · ${escapeHtml(point?.name || attempt.point_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 晨昏线实验</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="motion-parent-summary"><span>自转 <strong>${escapeHtml(attempt.correct_answers.rotation)}</strong></span><span>变化 <strong>${escapeHtml(attempt.correct_answers.transition)}</strong></span><span>界线 <strong>${escapeHtml(attempt.correct_answers.boundary)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：换到另一个极点上空，自转方向为什么会改变？</div>`}<label class="field-label" for="motion-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="motion-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="motion-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="motion-note-${escapeHtml(attempt.id)}" placeholder="例如：知道晨线定义，但切换南极视角后顺逆时针仍混淆">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-motion-review" data-attempt-id="${escapeHtml(attempt.id)}">保存实验审核</button></div></article>`;
}

function renderParentSolarSeasonAttempt(attempt) {
  const date = getSolarSeasonDate(attempt.date_id);
  const place = getSolarSeasonPlace(attempt.place_id);
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(date?.name || attempt.date_id)} · ${escapeHtml(place?.name || attempt.place_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 太阳直射点与昼夜长短</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="solar-parent-summary"><span>直射 <strong>${escapeHtml(correct.direct)}</strong></span><span>昼夜 <strong>${escapeHtml(correct.day_relation)}</strong></span><span>正午高度 <strong>${correct.noon_altitude}°</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：如果换到另一半球同纬度地点，哪些结论会改变？</div>`}<label class="field-label" for="solar-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="solar-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="solar-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="solar-note-${escapeHtml(attempt.id)}" placeholder="例如：能判断直射点，但不会把直射半球转化为全球昼长分布">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-solar-review" data-attempt-id="${escapeHtml(attempt.id)}">保存太阳季节审核</button></div></article>`;
}

function renderParentAnnualSunAttempt(attempt) {
  const checkpoint = getAnnualSunCheckpoint(attempt.checkpoint_id);
  const place = getAnnualSunPlace(attempt.place_id);
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(checkpoint?.name || attempt.checkpoint_id)} · ${escapeHtml(place?.name || attempt.place_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 太阳直射点周年回归</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="solar-parent-summary"><span>直射 <strong>${escapeHtml(correct.direct_label)}</strong></span><span>移动 <strong>${escapeHtml(correct.migration)}</strong></span><span>昼长 <strong>${escapeHtml(correct.north_day_trend)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：相同直射纬度为什么可能对应两个日期和相反移动方向？</div>`}<label class="field-label" for="annual-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="annual-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="annual-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="annual-note-${escapeHtml(attempt.id)}" placeholder="例如：能估直射纬度，但把5月和8月的移动方向看成相同">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-annual-review" data-attempt-id="${escapeHtml(attempt.id)}">保存周年回归审核</button></div></article>`;
}

function renderParentOrbitSpeedAttempt(attempt) {
  const checkpoint = getOrbitSpeedCheckpoint(attempt.checkpoint_id);
  const hemisphere = getOrbitSpeedHemisphere(attempt.hemisphere_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(checkpoint?.name || attempt.checkpoint_id)} · ${escapeHtml(hemisphere?.name || attempt.hemisphere_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 地球公转轨道与速度</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="solar-parent-summary"><span>距离 <strong>${escapeHtml(correct.distance_state)}</strong></span><span>速度 <strong>${escapeHtml(correct.speed_state)}</strong></span><span>季节 <strong>${escapeHtml(correct.season)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：为什么1月更靠近太阳，北半球和南半球却不是同一季节？</div>`}<label class="field-label" for="orbit-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="orbit-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="orbit-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="orbit-note-${escapeHtml(attempt.id)}" placeholder="例如：知道近日点快，但仍用日地距离解释四季">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-orbit-review" data-attempt-id="${escapeHtml(attempt.id)}">保存公转轨道审核</button></div></article>`;
}

function renderParentTerminatorLinkAttempt(attempt) {
  const scenario = getTerminatorLinkScenario(attempt.scenario_id);
  const date = getTerminatorLinkDate(scenario?.date_id);
  const place = getTerminatorLinkPlace(scenario?.place_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(date?.name || scenario?.date_id || attempt.scenario_id)} · ${escapeHtml(place?.name || scenario?.place_id || "目标地")}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 晨昏线综合联动</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>直射/地方时 <strong>${escapeHtml(correct.direct_longitude_label)} · ${escapeHtml(correct.local_time)}</strong></span><span>昼长/状态 <strong>${Number(correct.day_length_exact).toFixed(1)}h · ${escapeHtml(correct.status)}</strong></span><span>极地范围 <strong>${escapeHtml(correct.polar_pattern)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请拖动UTC时刻追问：哪些量会随时刻改变，哪些量只由日期和纬度决定？</div>`}<label class="field-label" for="link-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="link-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="link-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="link-note-${escapeHtml(attempt.id)}" placeholder="例如：会算地方时，但仍把所有晨线点记成6时">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-terminator-link-review" data-attempt-id="${escapeHtml(attempt.id)}">保存晨昏线综合审核</button></div></article>`;
}

function renderParentRotationSpeedAttempt(attempt) {
  const scenario = getRotationSpeedScenario(attempt.scenario_id);
  const place = getRotationSpeedPlace(scenario?.place_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(place?.name || scenario?.place_id || attempt.scenario_id)} · ${Math.abs(place?.latitude || 0)}°${(place?.latitude || 0) < 0 ? "S" : "N"}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 地球自转速度</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>角速度 <strong>${escapeHtml(correct.angular_speed)}</strong></span><span>线速度 <strong>${correct.line_speed_exact} km/h</strong></span><span>${scenario?.duration_hours || correct.duration_hours}小时弧长 <strong>${correct.distance_exact} km</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请追问：南半球同纬度地点的角速度、线速度大小会改变吗？</div>`}<label class="field-label" for="rotation-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="rotation-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="rotation-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="rotation-note-${escapeHtml(attempt.id)}" placeholder="例如：知道高纬线速度小，但把角速度也写小了">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-rotation-speed-review" data-attempt-id="${escapeHtml(attempt.id)}">保存自转速度审核</button></div></article>`;
}

function renderParentDateRangeAttempt(attempt) {
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>UTC ${escapeHtml(correct.utc_time || "--:--")} · ${escapeHtml(attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 全球日期范围</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>0时经线 <strong>${escapeHtml(correct.zero_label)}</strong></span><span>较新/较旧 <strong>${correct.new_date_percent}% / ${correct.old_date_percent}%</strong></span><span>日期数量 <strong>${escapeHtml(correct.date_count)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请拖到UTC 12:00追问：为什么此时全球同属一个日期？</div>`}<label class="field-label" for="date-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="date-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="date-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="date-note-${escapeHtml(attempt.id)}" placeholder="例如：会找0时经线，但较新日期范围方向仍会反">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-date-range-review" data-attempt-id="${escapeHtml(attempt.id)}">保存全球日期审核</button></div></article>`;
}

function renderParentAxialTiltAttempt(attempt) {
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>ε=${correct.tilt_deg}° · ${escapeHtml(attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 黄赤交角与五带变化</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>回归线/极圈 <strong>${correct.tropic_latitude}° / ${correct.polar_circle_latitude}°</strong></span><span>热带/每个温带 <strong>${correct.tropical_width}° / ${correct.temperate_width_each}°</strong></span><span>每个寒带 <strong>${correct.polar_width_each}°</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请把交角拖到0°，追问为什么极昼极夜与由地轴倾斜造成的季节差异会消失。</div>`}<label class="field-label" for="axial-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="axial-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="axial-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="axial-note-${escapeHtml(attempt.id)}" placeholder="例如：会求极圈，但把回归线纬度当成热带总宽">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-axial-tilt-review" data-attempt-id="${escapeHtml(attempt.id)}">保存黄赤交角审核</button></div></article>`;
}

function renderParentCelestialScaleAttempt(attempt) {
  const correct = attempt.correct_answers || {};
  const level = window.OrangeCoach?.features?.celestialScale?.getLevel(catalog.celestialScaleLab, attempt.target_level_id);
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(level?.name || attempt.target_level_id)} · ${escapeHtml(attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 天体系统尺度与宇宙位置</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>地月尺度 <strong>${escapeHtml(correct.moon_distance)}</strong></span><span>日地尺度 <strong>${escapeHtml(correct.earth_sun_unit)}</strong></span><span>太阳系位置 <strong>银河系猎户臂</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请把缩放尺拖到银河系，追问太阳系为什么不在银河系中心，以及为什么不能按图量距离。</div>`}<label class="field-label" for="celestial-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="celestial-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="celestial-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="celestial-note-${escapeHtml(attempt.id)}" placeholder="例如：层级顺序正确，但仍把太阳系放在银河系中心">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-celestial-scale-review" data-attempt-id="${escapeHtml(attempt.id)}">保存宇宙尺度审核</button></div></article>`;
}

function renderParentHabitabilityAttempt(attempt) {
  const scenario = getHabitabilityScenario(attempt.scenario_id);
  const feature = window.OrangeCoach?.features?.habitability;
  const bodyA = feature?.getBody(catalog.habitabilityLab, scenario?.body_a);
  const bodyB = feature?.getBody(catalog.habitabilityLab, scenario?.body_b);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(bodyA?.name || scenario?.body_a)} vs ${escapeHtml(bodyB?.name || scenario?.body_b)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 地球宜居条件对照</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>太阳辐射 <strong>${escapeHtml(correct.higher_solar)}</strong></span><span>地表气压 <strong>${escapeHtml(correct.higher_pressure)}</strong></span><span>稳定液态水 <strong>${escapeHtml(correct.stable_liquid_water)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请把证据尺退回“轨道”，追问为什么只看宜居带仍不能证明存在生命。</div>`}<label class="field-label" for="habitability-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="habitability-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="habitability-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="habitability-note-${escapeHtml(attempt.id)}" placeholder="例如：会比较日距，但仍把发现水冰等同于发现生命">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-habitability-review" data-attempt-id="${escapeHtml(attempt.id)}">保存宜居条件审核</button></div></article>`;
}

function renderParentSolarActivityAttempt(attempt) {
  const scenario = getSolarActivityScenario(attempt.scenario_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(scenario?.headline || attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 太阳活动证据判读</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>太阳源 <strong>${escapeHtml(correct.phenomenon)}</strong></span><span>载体/时标 <strong>${escapeHtml(correct.transport)} · ${escapeHtml(correct.arrival)}</strong></span><span>影响 <strong>${escapeHtml(correct.impact)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请追问：耀斑、粒子事件和CME为什么不能使用同一个到达时间和影响结论？</div>`}<label class="field-label" for="solar-activity-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="solar-activity-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="solar-activity-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="solar-activity-note-${escapeHtml(attempt.id)}" placeholder="例如：能认耀斑，但把CME也写成约8分钟到达">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-solar-activity-review" data-attempt-id="${escapeHtml(attempt.id)}">保存太阳活动审核</button></div></article>`;
}

function renderParentMoonPhaseAttempt(attempt) {
  const phase = getMoonPhase(attempt.phase_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(phase?.name || attempt.phase_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 月相位置与可见时段</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>亮面/盈亏 <strong>${escapeHtml(correct.illumination)} · ${escapeHtml(correct.trend)}</strong></span><span>中天时刻 <strong>${escapeHtml(correct.transit)}</strong></span><span>证据边界 <strong>${escapeHtml(correct.conclusion)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请把月轨拖到亮面比例相同的另一侧，追问为什么可见时段和盈亏名称改变。</div>`}<label class="field-label" for="moon-phase-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="moon-phase-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="moon-phase-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="moon-phase-note-${escapeHtml(attempt.id)}" placeholder="例如：会认上弦月，但把半圆误解为太阳只照亮四分之一月球">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-moon-phase-review" data-attempt-id="${escapeHtml(attempt.id)}">保存月相审核</button></div></article>`;
}

function renderParentEclipseAttempt(attempt) {
  const item = getEclipseCase(attempt.case_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(item?.name || attempt.case_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 日月食几何与可见范围</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>影区/食象 <strong>${escapeHtml(correct.shadow)} · ${escapeHtml(correct.phenomenon)}</strong></span><span>可见范围 <strong>${escapeHtml(correct.visibility)}</strong></span><span>证据边界 <strong>${escapeHtml(correct.conclusion)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请切换日全食与月全食，追问为什么可见范围差异很大。</div>`}<label class="field-label" for="eclipse-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="eclipse-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="eclipse-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="eclipse-note-${escapeHtml(attempt.id)}" placeholder="例如：能区分日食和月食，但把本影带误写成整个白昼半球">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-eclipse-review" data-attempt-id="${escapeHtml(attempt.id)}">保存日月食审核</button></div></article>`;
}

function renderParentTideAttempt(attempt) {
  const item = getTideCase(attempt.case_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(item?.name || attempt.case_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 潮汐周期与月相</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>潮型/潮差 <strong>${escapeHtml(correct.tide_type)} · ${escapeHtml(correct.range)}</strong></span><span>周期 <strong>${escapeHtml(correct.cycle)}</strong></span><span>证据边界 <strong>${escapeHtml(correct.conclusion)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请切换新月大潮与上弦月小潮，追问为什么“小潮”不等于没有涨落。</div>`}<label class="field-label" for="tide-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="tide-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="tide-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="tide-note-${escapeHtml(attempt.id)}" placeholder="例如：会认新月大潮，但仍把小潮解释为没有高潮低潮">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-tide-review" data-attempt-id="${escapeHtml(attempt.id)}">保存潮汐审核</button></div></article>`;
}

function renderParentCoriolisAttempt(attempt) {
  const scenario = getCoriolisScenario(attempt.scenario_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(scenario?.name || attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 地转偏向力</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>相对偏向 <strong>${escapeHtml(correct.relative_side)}</strong></span><span>地图方位 <strong>${escapeHtml(correct.final_direction)}</strong></span><span>边界 <strong>赤道上不偏</strong></span></div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请换初始方向追问：“右偏”为什么不总等于“向东偏”。</div>`}<label class="field-label" for="coriolis-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="coriolis-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="coriolis-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="coriolis-note-${escapeHtml(attempt.id)}" placeholder="例如：能背北右南左，但向东运动时仍不会转换方位">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-coriolis-review" data-attempt-id="${escapeHtml(attempt.id)}">保存地转偏向力审核</button></div></article>`;
}

function renderParentFrontWeatherAttempt(attempt) {
  const scenario = getFrontWeatherScenario(attempt.scenario_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(scenario?.name || attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 锋面天气</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>锋型 <strong>${escapeHtml(correct.front_type)}</strong></span><span>降水 <strong>${escapeHtml(correct.precipitation_zone)}</strong></span><span>天气 <strong>${escapeHtml(correct.station_weather)}</strong></span></div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请遮住锋型标题，让橙子只看主动气团和雨区反推锋型。</div>`}<label class="field-label" for="front-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="front-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="front-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="front-note-${escapeHtml(attempt.id)}" placeholder="例如：能判断冷锋，但仍把降水区放到锋前">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-front-weather-review" data-attempt-id="${escapeHtml(attempt.id)}">保存锋面天气审核</button></div></article>`;
}

function renderParentCycloneSystemAttempt(attempt) {
  const scenario = getCycloneSystemScenario(attempt.scenario_id);
  const correct = attempt.correct_answers || {};
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(scenario?.name || attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 气旋与反气旋</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary"><span>水平气流 <strong>${escapeHtml(correct.surface_flow)}</strong></span><span>垂直运动 <strong>${escapeHtml(correct.vertical_motion)}</strong></span><span>天气 <strong>${escapeHtml(correct.weather)}</strong></span></div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请换半球追问：哪些关系不变，只有旋转方向改变？</div>`}<label class="field-label" for="cyclone-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="cyclone-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="cyclone-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="cyclone-note-${escapeHtml(attempt.id)}" placeholder="例如：会背北逆南顺，但把高压也判断成辐合上升">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-cyclone-system-review" data-attempt-id="${escapeHtml(attempt.id)}">保存气旋反气旋审核</button></div></article>`;
}

function renderParentAtmosphereAttempt(attempt) {
  const lab = getAtmosphereLab(attempt.lab_id);
  const scenario = getAtmosphereScenario(lab, attempt.scenario_id);
  const correct = attempt.correct_answers || {};
  const summary = (lab?.questions || []).slice(0, 3).map((question) => `<span>${escapeHtml(question.label)} <strong>${escapeHtml(correct[question.key])}</strong></span>`).join("");
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(scenario?.name || attempt.scenario_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · ${escapeHtml(lab?.title || attempt.lab_id)}</div></div><span class="pill ${attempt.score >= 4 ? "green" : "orange"}">${attempt.score}/5</span></div><div class="solar-parent-summary">${summary}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>五个步骤均正确</strong><br/>请换季节、纬度或区域，要求橙子从气压成因重新推导。</div>`}<label class="field-label" for="atmosphere-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="atmosphere-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="atmosphere-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="atmosphere-note-${escapeHtml(attempt.id)}" placeholder="例如：会背风向，但还不能从高低压和半球规则推出">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-atmosphere-review" data-attempt-id="${escapeHtml(attempt.id)}">保存大气运动审核</button></div></article>`;
}

function renderParentSolarPathAttempt(attempt) {
  const date = getSolarPathDate(attempt.date_id);
  const place = getSolarPathPlace(attempt.place_id);
  const correct = attempt.correct_answers;
  return `<article class="attempt-item"><div class="attempt-head"><div><strong>${escapeHtml(date?.name || attempt.date_id)} · ${escapeHtml(place?.name || attempt.place_id)}</strong><div class="topic-meta">${formatDate(attempt.submitted_at)} · 日出日落与太阳视运动</div></div><span class="pill ${attempt.score >= 3 ? "green" : "orange"}">${attempt.score}/4</span></div><div class="solar-parent-summary"><span>日出/日落 <strong>${escapeHtml(correct.sunrise)}/${escapeHtml(correct.sunset)}</strong></span><span>正午太阳 <strong>${escapeHtml(correct.noon_sun)}</strong></span><span>正午影子 <strong>${escapeHtml(correct.noon_shadow)}</strong></span></div><p><strong>橙子的判断链</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${attempt.error_tags.length ? `<p><strong>候选错因</strong></p><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(errorTagLabel(tag))}</span>`).join("")}</div>` : `<div class="answer-box correct"><strong>四个步骤均正确</strong><br/>请追问：日出方向与正午太阳方位分别依据什么判断？</div>`}<label class="field-label" for="path-verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="path-verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再练" ? "selected" : ""}>需再练</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="path-note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="path-note-${escapeHtml(attempt.id)}" placeholder="例如：会背东北升西北落，但没有比较当地纬度与直射纬度">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-path-review" data-attempt-id="${escapeHtml(attempt.id)}">保存太阳视运动审核</button></div></article>`;
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
  return `<article class="attempt-item"><div class="attempt-head"><strong>${escapeHtml(question?.title || attempt.question_id)}</strong><span class="pill ${attempt.is_correct ? "green" : "red"}">${attempt.is_correct ? "正确" : "错误"}</span></div><p class="small">${formatDate(attempt.submitted_at)} · 选择 ${escapeHtml(attempt.selected_option)} · 信心 ${attempt.confidence}/5</p><p><strong>橙子的理由</strong></p><div class="quote">${optionalReasoning(attempt.reasoning)}</div>${candidate ? `<p><strong>候选错因：</strong>${escapeHtml(candidate.tag)}<br/><span class="small">${escapeHtml(candidate.diagnosis)}</span></p>` : ""}${attempt.ai_response ? `<p><strong>AI 返回</strong></p><div class="quote">${escapeHtml(attempt.ai_response)}</div>` : ""}<label class="field-label" for="verdict-${escapeHtml(attempt.id)}">家长判断</label><select id="verdict-${escapeHtml(attempt.id)}"><option ${attempt.parent_review_status === "待家长确认" ? "selected" : ""}>待家长确认</option><option ${attempt.parent_review_status === "已确认" ? "selected" : ""}>已确认</option><option ${attempt.parent_review_status === "需再看" ? "selected" : ""}>需再看</option><option ${attempt.parent_review_status === "需教师复核" ? "selected" : ""}>需教师复核</option></select><label class="field-label" for="note-${escapeHtml(attempt.id)}">家长备注</label><textarea id="note-${escapeHtml(attempt.id)}" placeholder="例如：能说出结论，但没有解释气压变化">${escapeHtml(attempt.parent_note || "")}</textarea><div class="btn-row"><button class="btn" data-action="save-review" data-attempt-id="${escapeHtml(attempt.id)}">保存审核</button></div></article>`;
}

function makeAiPrompt(question, session, candidate) {
  const reasoning = String(session.reasoning || "").trim() || "未填写（选填）";
  return `你是高中地理学习诊断助手，请帮助家长判断橙子的真实错因。\n\n【题目】\n${question.stem}\n${question.options.map((option) => `${option.id}. ${option.text}`).join("\n")}\n\n【正确答案】${question.answer}\n【橙子的选择】${session.selectedOption}\n【橙子的理由】${reasoning}\n【自评信心】${session.confidence}/5\n【题库提供的候选错因】${candidate?.tag || "答对，检查是否只是猜对"}\n\n请按以下顺序输出：\n1. 如果理由未填写，明确写“理由未填写，证据不足”，不要推测真实错因；否则仅根据理由判断最可能的错误环节。\n2. 给出一个不超过两句的纠正解释，不要堆砌术语。\n3. 提出两个追问，先检查推理链，不要直接让她背答案。\n4. 给出一个 5 分钟内可以完成的微任务。\n5. 标注：家长可确认 / 需要更多证据 / 建议教师复核。\n不要把一次答题表现写成稳定能力结论。`;
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
  if (action === "set-solar-path-date") {
    setSolarPathScenario(actionTarget.dataset.dateId, state.solarPathPlaceId);
    return;
  }
  if (action === "set-solar-path-place") {
    setSolarPathScenario(state.solarPathDateId, actionTarget.dataset.placeId);
    return;
  }
  if (action === "set-annual-checkpoint") {
    setAnnualSunScenario(actionTarget.dataset.checkpointId, state.annualSunPlaceId);
    return;
  }
  if (action === "set-annual-place") {
    setAnnualSunScenario(state.annualSunCheckpointId, actionTarget.dataset.placeId);
    return;
  }
  if (action === "set-orbit-checkpoint") {
    setOrbitSpeedScenario(actionTarget.dataset.checkpointId, state.orbitSpeedHemisphereId);
    return;
  }
  if (action === "set-orbit-hemisphere") {
    setOrbitSpeedScenario(state.orbitSpeedCheckpointId, actionTarget.dataset.hemisphereId);
    return;
  }
  if (action === "goto") {
    state.route = actionTarget.dataset.route;
    saveState(); render();
  }
  if (action === "open-diagnostic-catalog") {
    state.route = "diagnostic-catalog";
    saveState(); render();
    return;
  }
  if (action === "set-diagnostic-filter") {
    const filter = actionTarget.dataset.filter;
    state.diagnosticFilter = ["all", "unseen", "review", "answered"].includes(filter) ? filter : "all";
    state.route = "diagnostic-catalog";
    saveState(); render();
    return;
  }
  if (action === "start-question") {
    const question = getQuestion(actionTarget.dataset.questionId);
    if (!question) return;
    state.currentQuestionId = question.id;
    state.activeSession = null;
    state.route = "train";
    saveState(); render();
    return;
  }
  if (action === "start-next") {
    state.currentQuestionId = chooseNextQuestion()?.id || null;
    state.activeSession = null;
    state.route = "train";
    saveState(); render();
  }
  if (action === "continue-question") {
    saveAttempt("next");
    return;
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
  if (action === "start-solar-path") {
    const dates = catalog.solarPathLab?.dates || [];
    const places = catalog.solarPathLab?.places || [];
    if (!dates.length || !places.length) return;
    const date = dates[state.solarPathAttempts.length % dates.length];
    const place = places[(state.solarPathAttempts.length * 2 + 1) % places.length];
    state.solarPathDateId = date.id;
    state.solarPathPlaceId = place.id;
    state.activeSolarPathAttemptId = null;
    state.route = "solar-path-lab";
    saveState(); render();
  }
  if (action === "start-annual-sun") {
    const checkpoints = catalog.annualSunLab?.checkpoints || [];
    const places = catalog.annualSunLab?.places || [];
    if (!checkpoints.length || !places.length) return;
    const checkpoint = checkpoints[(state.annualSunAttempts.length * 2 + 1) % checkpoints.length];
    const place = places[state.annualSunAttempts.length % places.length];
    state.annualSunCheckpointId = checkpoint.id;
    state.annualSunPlaceId = place.id;
    state.activeAnnualSunAttemptId = null;
    state.route = "annual-sun-lab";
    saveState(); render();
  }
  if (action === "start-orbit-speed") {
    const scenarios = orbitSpeedScenarios();
    const scenario = scenarios[state.orbitSpeedAttempts.length % Math.max(scenarios.length, 1)];
    if (!scenario) return;
    state.orbitSpeedCheckpointId = scenario.checkpoint.id;
    state.orbitSpeedHemisphereId = scenario.hemisphere.id;
    state.activeOrbitSpeedAttemptId = null;
    state.route = "orbit-speed-lab";
    saveState(); render();
  }
  if (action === "start-terminator-link") {
    const count = catalog.terminatorLinkLab?.scenarios?.length || 0;
    if (!count) return;
    state.terminatorLinkScenarioIndex = state.terminatorLinkAttempts.length % count;
    state.activeTerminatorLinkAttemptId = null;
    state.route = "terminator-link-lab";
    saveState(); render();
  }
  if (action === "start-rotation-speed") {
    const count = catalog.rotationSpeedLab?.scenarios?.length || 0;
    if (!count) return;
    state.rotationSpeedScenarioIndex = state.rotationSpeedAttempts.length % count;
    state.activeRotationSpeedAttemptId = null;
    state.route = "rotation-speed-lab";
    saveState(); render();
  }
  if (action === "start-axial-tilt") {
    const count = catalog.axialTiltLab?.scenarios?.length || 0;
    if (!count) return;
    state.axialTiltScenarioIndex = state.axialTiltAttempts.length % count;
    state.activeAxialTiltAttemptId = null;
    state.route = "axial-tilt-lab";
    saveState(); render();
  }
  if (action === "start-celestial-scale") {
    const count = catalog.celestialScaleLab?.scenarios?.length || 0;
    if (!count) return;
    state.celestialScaleScenarioIndex = state.celestialScaleAttempts.length % count;
    state.activeCelestialScaleAttemptId = null;
    state.route = "celestial-scale-lab";
    saveState(); render();
  }
  if (action === "start-habitability") {
    const count = catalog.habitabilityLab?.scenarios?.length || 0;
    if (!count) return;
    state.habitabilityScenarioIndex = state.habitabilityAttempts.length % count;
    state.activeHabitabilityAttemptId = null;
    state.route = "habitability-lab";
    saveState(); render();
  }
  if (action === "start-solar-activity") {
    const count = catalog.solarActivityLab?.scenarios?.length || 0;
    if (!count) return;
    state.solarActivityScenarioIndex = state.solarActivityAttempts.length % count;
    state.activeSolarActivityAttemptId = null;
    state.route = "solar-activity-lab";
    saveState(); render();
  }
  if (action === "start-moon-phase") {
    const count = catalog.moonPhaseLab?.scenarios?.length || 0;
    if (!count) return;
    state.moonPhaseScenarioIndex = state.moonPhaseAttempts.length % count;
    state.activeMoonPhaseAttemptId = null;
    state.route = "moon-phase-lab";
    saveState(); render();
  }
  if (action === "start-eclipse") {
    const count = catalog.eclipseLab?.scenarios?.length || 0;
    if (!count) return;
    state.eclipseScenarioIndex = state.eclipseAttempts.length % count;
    state.activeEclipseAttemptId = null;
    state.route = "eclipse-lab";
    saveState(); render();
  }
  if (action === "start-tide") {
    const count = catalog.tideLab?.scenarios?.length || 0;
    if (!count) return;
    state.tideScenarioIndex = state.tideAttempts.length % count;
    state.activeTideAttemptId = null;
    state.route = "tide-lab";
    saveState(); render();
  }
  if (action === "start-coriolis") {
    const count = catalog.coriolisLab?.scenarios?.length || 0;
    if (!count) return;
    state.coriolisScenarioIndex = state.coriolisAttempts.length % count;
    state.activeCoriolisAttemptId = null;
    state.route = "coriolis-lab";
    saveState(); render();
  }
  if (action === "start-front-weather") {
    const count = catalog.frontWeatherLab?.scenarios?.length || 0;
    if (!count) return;
    state.frontWeatherScenarioIndex = state.frontWeatherAttempts.length % count;
    state.activeFrontWeatherAttemptId = null;
    state.route = "front-weather-lab";
    saveState(); render();
  }
  if (action === "start-cyclone-system") {
    const count = catalog.cycloneSystemLab?.scenarios?.length || 0;
    if (!count) return;
    state.cycloneSystemScenarioIndex = state.cycloneSystemAttempts.length % count;
    state.activeCycloneSystemAttemptId = null;
    state.route = "cyclone-system-lab";
    saveState(); render();
  }
  if (action === "start-atmosphere-lab") {
    const lab = getAtmosphereLab(actionTarget.dataset.route);
    const count = lab?.scenarios?.length || 0;
    if (!count) return;
    state.activeAtmosphereLabId = lab.id;
    state.atmosphereScenarioIndex = latestAtmosphereAttempts(lab.id).length % count;
    state.activeAtmosphereAttemptId = null;
    state.route = "atmosphere-lab";
    saveState(); render();
  }
  if (action === "start-date-range") {
    const count = catalog.dateRangeLab?.scenarios?.length || 0;
    if (!count) return;
    state.dateRangeScenarioIndex = state.dateRangeAttempts.length % count;
    state.activeDateRangeAttemptId = null;
    state.route = "date-range-lab";
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
  if (action === "next-solar-path") {
    const next = chooseSolarPathScenario(1);
    if (!next) return;
    state.solarPathDateId = next.date.id;
    state.solarPathPlaceId = next.place.id;
    state.activeSolarPathAttemptId = null;
    state.route = "solar-path-lab";
    saveState(); render();
  }
  if (action === "next-annual-sun") {
    const next = chooseAnnualSunScenario(1);
    if (!next) return;
    state.annualSunCheckpointId = next.checkpoint.id;
    state.annualSunPlaceId = next.place.id;
    state.activeAnnualSunAttemptId = null;
    state.route = "annual-sun-lab";
    saveState(); render();
  }
  if (action === "next-orbit-speed") {
    const next = chooseOrbitSpeedScenario(1);
    if (!next) return;
    state.orbitSpeedCheckpointId = next.checkpoint.id;
    state.orbitSpeedHemisphereId = next.hemisphere.id;
    state.activeOrbitSpeedAttemptId = null;
    state.route = "orbit-speed-lab";
    saveState(); render();
  }
  if (action === "next-terminator-link") {
    state.terminatorLinkScenarioIndex = (state.terminatorLinkScenarioIndex + 1) % Math.max(catalog.terminatorLinkLab?.scenarios?.length || 1, 1);
    state.activeTerminatorLinkAttemptId = null;
    state.route = "terminator-link-lab";
    saveState(); render();
  }
  if (action === "next-rotation-speed") {
    state.rotationSpeedScenarioIndex = (state.rotationSpeedScenarioIndex + 1) % Math.max(catalog.rotationSpeedLab?.scenarios?.length || 1, 1);
    state.activeRotationSpeedAttemptId = null;
    state.route = "rotation-speed-lab";
    saveState(); render();
  }
  if (action === "next-axial-tilt") {
    state.axialTiltScenarioIndex = (state.axialTiltScenarioIndex + 1) % Math.max(catalog.axialTiltLab?.scenarios?.length || 1, 1);
    state.activeAxialTiltAttemptId = null;
    state.route = "axial-tilt-lab";
    saveState(); render();
  }
  if (action === "next-celestial-scale") {
    state.celestialScaleScenarioIndex = (state.celestialScaleScenarioIndex + 1) % Math.max(catalog.celestialScaleLab?.scenarios?.length || 1, 1);
    state.activeCelestialScaleAttemptId = null;
    state.route = "celestial-scale-lab";
    saveState(); render();
  }
  if (action === "next-habitability") {
    state.habitabilityScenarioIndex = (state.habitabilityScenarioIndex + 1) % Math.max(catalog.habitabilityLab?.scenarios?.length || 1, 1);
    state.activeHabitabilityAttemptId = null;
    state.route = "habitability-lab";
    saveState(); render();
  }
  if (action === "next-solar-activity") {
    state.solarActivityScenarioIndex = (state.solarActivityScenarioIndex + 1) % Math.max(catalog.solarActivityLab?.scenarios?.length || 1, 1);
    state.activeSolarActivityAttemptId = null;
    state.route = "solar-activity-lab";
    saveState(); render();
  }
  if (action === "next-moon-phase") {
    state.moonPhaseScenarioIndex = (state.moonPhaseScenarioIndex + 1) % Math.max(catalog.moonPhaseLab?.scenarios?.length || 1, 1);
    state.activeMoonPhaseAttemptId = null;
    state.route = "moon-phase-lab";
    saveState(); render();
  }
  if (action === "next-eclipse") {
    state.eclipseScenarioIndex = (state.eclipseScenarioIndex + 1) % Math.max(catalog.eclipseLab?.scenarios?.length || 1, 1);
    state.activeEclipseAttemptId = null;
    state.route = "eclipse-lab";
    saveState(); render();
  }
  if (action === "next-tide") {
    state.tideScenarioIndex = (state.tideScenarioIndex + 1) % Math.max(catalog.tideLab?.scenarios?.length || 1, 1);
    state.activeTideAttemptId = null;
    state.route = "tide-lab";
    saveState(); render();
  }
  if (action === "next-coriolis") {
    state.coriolisScenarioIndex = (state.coriolisScenarioIndex + 1) % Math.max(catalog.coriolisLab?.scenarios?.length || 1, 1);
    state.activeCoriolisAttemptId = null;
    state.route = "coriolis-lab";
    saveState(); render();
  }
  if (action === "next-front-weather") {
    state.frontWeatherScenarioIndex = (state.frontWeatherScenarioIndex + 1) % Math.max(catalog.frontWeatherLab?.scenarios?.length || 1, 1);
    state.activeFrontWeatherAttemptId = null;
    state.route = "front-weather-lab";
    saveState(); render();
  }
  if (action === "next-cyclone-system") {
    state.cycloneSystemScenarioIndex = (state.cycloneSystemScenarioIndex + 1) % Math.max(catalog.cycloneSystemLab?.scenarios?.length || 1, 1);
    state.activeCycloneSystemAttemptId = null;
    state.route = "cyclone-system-lab";
    saveState(); render();
  }
  if (action === "next-atmosphere-scenario") {
    const lab = getAtmosphereLab();
    state.atmosphereScenarioIndex = (state.atmosphereScenarioIndex + 1) % Math.max(lab?.scenarios?.length || 1, 1);
    state.activeAtmosphereAttemptId = null;
    state.route = "atmosphere-lab";
    saveState(); render();
  }
  if (action === "next-date-range") {
    state.dateRangeScenarioIndex = (state.dateRangeScenarioIndex + 1) % Math.max(catalog.dateRangeLab?.scenarios?.length || 1, 1);
    state.activeDateRangeAttemptId = null;
    state.route = "date-range-lab";
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
  if (action === "save-path-review") saveSolarPathReview(actionTarget.dataset.attemptId);
  if (action === "save-annual-review") saveAnnualSunReview(actionTarget.dataset.attemptId);
  if (action === "save-orbit-review") saveOrbitSpeedReview(actionTarget.dataset.attemptId);
  if (action === "save-terminator-link-review") saveTerminatorLinkReview(actionTarget.dataset.attemptId);
  if (action === "save-rotation-speed-review") saveRotationSpeedReview(actionTarget.dataset.attemptId);
  if (action === "save-date-range-review") saveDateRangeReview(actionTarget.dataset.attemptId);
  if (action === "save-axial-tilt-review") saveAxialTiltReview(actionTarget.dataset.attemptId);
  if (action === "save-celestial-scale-review") saveCelestialScaleReview(actionTarget.dataset.attemptId);
  if (action === "save-habitability-review") saveHabitabilityReview(actionTarget.dataset.attemptId);
  if (action === "save-solar-activity-review") saveSolarActivityReview(actionTarget.dataset.attemptId);
  if (action === "save-moon-phase-review") saveMoonPhaseReview(actionTarget.dataset.attemptId);
  if (action === "save-eclipse-review") saveEclipseReview(actionTarget.dataset.attemptId);
  if (action === "save-tide-review") saveTideReview(actionTarget.dataset.attemptId);
  if (action === "save-coriolis-review") saveCoriolisReview(actionTarget.dataset.attemptId);
  if (action === "save-front-weather-review") saveFrontWeatherReview(actionTarget.dataset.attemptId);
  if (action === "save-cyclone-system-review") saveCycloneSystemReview(actionTarget.dataset.attemptId);
  if (action === "save-atmosphere-review") saveAtmosphereReview(actionTarget.dataset.attemptId);
  if (action === "save-retest-review") saveRetestReview(actionTarget.dataset.attemptId);
  if (action === "export-data") exportData();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "atmosphere-reasoning-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.atmosphereReasoning;
    const lab = getAtmosphereLab();
    const scenario = getAtmosphereScenario(lab);
    if (!feature || !lab || !scenario) return;
    const form = new FormData(event.target);
    const answers = Object.fromEntries(lab.questions.map((question) => [question.key, form.get(`atmosphere-${question.key}`) || ""]));
    const reasoning = String(form.get("atmosphere-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项判断后再提交。判断链可以留空。");
    const correctAnswers = feature.calculate(scenario);
    const checks = Object.fromEntries(lab.questions.map((question) => [question.key, answers[question.key] === correctAnswers[question.key]]));
    const tags = Object.keys(lab.error_tags || {});
    const errorTags = lab.questions.flatMap((question, index) => checks[question.key] ? [] : [tags[index] || `${lab.id}-${question.key}`]);
    const attempt = {
      schema_version: catalog.atmosphereLabs.schema_version, id: newId(), lab_id: lab.id, scenario_id: scenario.id,
      section_id: lab.section_id, contrast_key: scenario.contrast_key,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.atmosphereReasoningAttempts.push(attempt);
    state.activeAtmosphereAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "front-weather-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.frontWeather;
    const scenario = getFrontWeatherScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      front_type: form.get("front-type") || "",
      active_process: form.get("front-active") || "",
      uplift_style: form.get("front-uplift") || "",
      precipitation_zone: form.get("front-precipitation") || "",
      station_weather: form.get("front-weather") || ""
    };
    const reasoning = String(form.get("front-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项判断后再提交。判断链可以留空。");
    const correctAnswers = feature.calculate(scenario);
    const checks = Object.fromEntries(Object.keys(answers).map((key) => [key, answers[key] === correctAnswers[key]]));
    const errorTags = [];
    if (!checks.front_type) errorTags.push("W-FRONT-TYPE");
    if (!checks.active_process) errorTags.push("W-FRONT-ACTIVE-AIRMASS");
    if (!checks.uplift_style) errorTags.push("W-FRONT-UPLIFT");
    if (!checks.precipitation_zone) errorTags.push("W-FRONT-PRECIPITATION");
    if (!checks.station_weather) errorTags.push("W-FRONT-SEQUENCE");
    const attempt = {
      schema_version: "0.23.0", id: newId(), scenario_id: scenario.id, front_type: scenario.front_type,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.frontWeatherAttempts.push(attempt);
    state.activeFrontWeatherAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "cyclone-system-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.cycloneSystem;
    const scenario = getCycloneSystemScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      pressure_center: form.get("cyclone-pressure") || "",
      surface_flow: form.get("cyclone-flow") || "",
      rotation: form.get("cyclone-rotation") || "",
      vertical_motion: form.get("cyclone-vertical") || "",
      weather: form.get("cyclone-weather") || ""
    };
    const reasoning = String(form.get("cyclone-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项判断后再提交。判断链可以留空。");
    const correctAnswers = feature.calculate(scenario);
    const checks = Object.fromEntries(Object.keys(answers).map((key) => [key, answers[key] === correctAnswers[key]]));
    const errorTags = [];
    if (!checks.pressure_center) errorTags.push("W-PRESSURE-CENTER");
    if (!checks.surface_flow) errorTags.push("W-FLOW-CONVERGENCE");
    if (!checks.rotation) errorTags.push("W-CYCLONE-ROTATION");
    if (!checks.vertical_motion) errorTags.push("W-VERTICAL-MOTION");
    if (!checks.weather) errorTags.push("W-VERTICAL-WEATHER");
    const attempt = {
      schema_version: "0.23.0", id: newId(), scenario_id: scenario.id, hemisphere: scenario.hemisphere,
      system_family: scenario.system.startsWith("低") ? "低气压（气旋）" : "高气压（反气旋）",
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.cycloneSystemAttempts.push(attempt);
    state.activeCycloneSystemAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "coriolis-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.coriolis;
    const scenario = getCoriolisScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      hemisphere_rule: form.get("coriolis-rule") || "",
      relative_side: form.get("coriolis-side") || "",
      final_direction: form.get("coriolis-final") || "",
      speed_effect: form.get("coriolis-speed") || "",
      application: form.get("coriolis-application") || ""
    };
    const reasoning = String(form.get("coriolis-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = Object.fromEntries(Object.keys(answers).map((key) => [key, answers[key] === correctAnswers[key]]));
    const tagByKey = { hemisphere_rule: "CF-HEMISPHERE-RULE", relative_side: "CF-RELATIVE-SIDE", final_direction: "CF-MAP-DIRECTION", speed_effect: "CF-SPEED-EFFECT", application: "CF-SCALE-APPLICATION" };
    const errorTags = Object.keys(checks).filter((key) => !checks[key]).map((key) => tagByKey[key]);
    const attempt = {
      schema_version: "0.21.0", id: newId(), scenario_id: scenario.id, hemisphere: scenario.hemisphere,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.coriolisAttempts.push(attempt);
    state.activeCoriolisAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "tide-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.tide;
    const scenario = getTideScenario();
    const item = getTideCase(scenario?.case_id);
    if (!feature || !scenario || !item) return;
    const form = new FormData(event.target);
    const answers = {
      geometry: form.get("tide-geometry") || "",
      tide_type: form.get("tide-type") || "",
      range: form.get("tide-range") || "",
      cycle: form.get("tide-cycle") || "",
      conclusion: form.get("tide-conclusion") || ""
    };
    const reasoning = String(form.get("tide-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = {
      geometry: answers.geometry === correctAnswers.geometry,
      tide_type: answers.tide_type === correctAnswers.tide_type,
      range: answers.range === correctAnswers.range,
      cycle: answers.cycle === correctAnswers.cycle,
      conclusion: answers.conclusion === correctAnswers.conclusion
    };
    const errorTags = [];
    if (!checks.geometry) errorTags.push("TD-GEOMETRY-PHASE");
    if (!checks.tide_type) errorTags.push("TD-SPRING-NEAP");
    if (!checks.range) errorTags.push("TD-TIDAL-RANGE");
    if (!checks.cycle) errorTags.push("TD-LUNAR-DAY");
    if (!checks.conclusion) errorTags.push("TD-LOCAL-BOUNDARY");
    const attempt = {
      schema_version: "0.20.0", id: newId(), scenario_id: scenario.id, case_id: item.id, category: item.category,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.tideAttempts.push(attempt);
    state.activeTideAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "eclipse-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.eclipse;
    const scenario = getEclipseScenario();
    const item = getEclipseCase(scenario?.case_id);
    if (!feature || !scenario || !item) return;
    const form = new FormData(event.target);
    const answers = {
      alignment: form.get("eclipse-alignment") || "",
      shadow: form.get("eclipse-shadow") || "",
      phenomenon: form.get("eclipse-phenomenon") || "",
      visibility: form.get("eclipse-visibility") || "",
      conclusion: form.get("eclipse-conclusion") || ""
    };
    const reasoning = String(form.get("eclipse-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = {
      alignment: answers.alignment === correctAnswers.alignment,
      shadow: answers.shadow === correctAnswers.shadow,
      phenomenon: answers.phenomenon === correctAnswers.phenomenon,
      visibility: answers.visibility === correctAnswers.visibility,
      conclusion: answers.conclusion === correctAnswers.conclusion
    };
    const errorTags = [];
    if (!checks.alignment) errorTags.push("EC-ALIGNMENT-PHASE");
    if (!checks.shadow) errorTags.push("EC-SHADOW-TYPE");
    if (!checks.phenomenon) errorTags.push("EC-ECLIPSE-TYPE");
    if (!checks.visibility) errorTags.push("EC-VISIBILITY");
    if (!checks.conclusion) errorTags.push("EC-EVIDENCE-BOUNDARY");
    const attempt = {
      schema_version: "0.19.0", id: newId(), scenario_id: scenario.id, case_id: item.id, family: item.family, category: item.category,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.eclipseAttempts.push(attempt);
    state.activeEclipseAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "moon-phase-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.moonPhase;
    const scenario = getMoonPhaseScenario();
    const phase = getMoonPhase(scenario?.phase_id);
    if (!feature || !scenario || !phase) return;
    const form = new FormData(event.target);
    const answers = {
      phase: form.get("moon-phase-name") || "",
      illumination: form.get("moon-phase-illumination") || "",
      trend: form.get("moon-phase-trend") || "",
      transit: form.get("moon-phase-transit") || "",
      conclusion: form.get("moon-phase-conclusion") || ""
    };
    const reasoning = String(form.get("moon-phase-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = {
      phase: answers.phase === correctAnswers.phase,
      illumination: answers.illumination === correctAnswers.illumination,
      trend: answers.trend === correctAnswers.trend,
      transit: answers.transit === correctAnswers.transit,
      conclusion: answers.conclusion === correctAnswers.conclusion
    };
    const errorTags = [];
    if (!checks.phase) errorTags.push("MP-POSITION-PHASE");
    if (!checks.illumination) errorTags.push("MP-ILLUMINATION");
    if (!checks.trend) errorTags.push("MP-WAX-WANE");
    if (!checks.transit) errorTags.push("MP-VISIBLE-TIME");
    if (!checks.conclusion) errorTags.push("MP-EVIDENCE-BOUNDARY");
    const attempt = {
      schema_version: "0.18.0", id: newId(), scenario_id: scenario.id, phase_id: phase.id, category: phase.category,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.moonPhaseAttempts.push(attempt);
    state.activeMoonPhaseAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "solar-activity-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.solarActivity;
    const scenario = getSolarActivityScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      phenomenon: form.get("solar-activity-phenomenon") || "",
      transport: form.get("solar-activity-transport") || "",
      arrival: form.get("solar-activity-arrival") || "",
      impact: form.get("solar-activity-impact") || "",
      conclusion: form.get("solar-activity-conclusion") || ""
    };
    const reasoning = String(form.get("solar-activity-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = {
      phenomenon: answers.phenomenon === correctAnswers.phenomenon,
      transport: answers.transport === correctAnswers.transport,
      arrival: answers.arrival === correctAnswers.arrival,
      impact: answers.impact === correctAnswers.impact,
      conclusion: answers.conclusion === correctAnswers.conclusion
    };
    const errorTags = [];
    if (!checks.phenomenon) errorTags.push("SA-PHENOMENON");
    if (!checks.transport) errorTags.push("SA-TRANSPORT");
    if (!checks.arrival) errorTags.push("SA-TIMESCALE");
    if (!checks.impact) errorTags.push("SA-EARTH-IMPACT");
    if (!checks.conclusion) errorTags.push("SA-EVIDENCE-BOUNDARY");
    const attempt = {
      schema_version: "0.17.0", id: newId(), scenario_id: scenario.id, category: scenario.category,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.solarActivityAttempts.push(attempt);
    state.activeSolarActivityAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "habitability-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.habitability;
    const scenario = getHabitabilityScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      higher_solar: form.get("habitability-solar") || "",
      higher_pressure: form.get("habitability-pressure") || "",
      temperature_window: form.get("habitability-temperature") || "",
      stable_liquid_water: form.get("habitability-water") || "",
      best_inference: form.get("habitability-inference") || ""
    };
    const reasoning = String(form.get("habitability-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(scenario);
    const checks = {
      higher_solar: answers.higher_solar === correctAnswers.higher_solar,
      higher_pressure: answers.higher_pressure === correctAnswers.higher_pressure,
      temperature_window: answers.temperature_window === correctAnswers.temperature_window,
      stable_liquid_water: answers.stable_liquid_water === correctAnswers.stable_liquid_water,
      best_inference: answers.best_inference === correctAnswers.best_inference
    };
    const errorTags = [];
    if (!checks.higher_solar) errorTags.push("H-SOLAR-FLUX");
    if (!checks.higher_pressure) errorTags.push("H-ATMOSPHERE-PRESSURE");
    if (!checks.temperature_window) errorTags.push("H-TEMP-WINDOW");
    if (!checks.stable_liquid_water) errorTags.push("H-LIQUID-WATER");
    if (!checks.best_inference) errorTags.push("H-EVIDENCE-BOUNDARY");
    const attempt = {
      schema_version: "0.16.0", id: newId(), scenario_id: scenario.id, pair_category: scenario.pair_category,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.habitabilityAttempts.push(attempt);
    state.activeHabitabilityAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "celestial-scale-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.celestialScale;
    const scenario = getCelestialScaleScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      system_order: form.get("celestial-order") || "",
      moon_distance: form.get("celestial-moon") || "",
      earth_sun_unit: form.get("celestial-au") || "",
      galactic_location: form.get("celestial-location") || "",
      diagram_rule: form.get("celestial-diagram") || ""
    };
    const reasoning = String(form.get("celestial-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) return alert("请完成五项预测后再提交。");
    const correctAnswers = feature.calculate(catalog.celestialScaleLab);
    const checks = {
      system_order: answers.system_order === correctAnswers.system_order,
      moon_distance: answers.moon_distance === correctAnswers.moon_distance,
      earth_sun_unit: answers.earth_sun_unit === correctAnswers.earth_sun_unit,
      galactic_location: answers.galactic_location === correctAnswers.galactic_location,
      diagram_rule: answers.diagram_rule === correctAnswers.diagram_rule
    };
    const errorTags = [];
    if (!checks.system_order) errorTags.push("C-SYSTEM-ORDER");
    if (!checks.moon_distance) errorTags.push("C-MOON-SCALE");
    if (!checks.earth_sun_unit) errorTags.push("C-AU-SCALE");
    if (!checks.galactic_location) errorTags.push("C-GALACTIC-LOCATION");
    if (!checks.diagram_rule) errorTags.push("C-DIAGRAM-SCALE");
    const attempt = {
      schema_version: "0.15.0", id: newId(), scenario_id: scenario.id, target_level_id: scenario.target_level_id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.celestialScaleAttempts.push(attempt);
    state.activeCelestialScaleAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "axial-tilt-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.axialTilt;
    const scenario = getAxialTiltScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      tropic_latitude: Number(form.get("axial-tropic")),
      polar_circle_latitude: Number(form.get("axial-polar")),
      tropical_width: Number(form.get("axial-tropical-width")),
      temperate_width_each: Number(form.get("axial-temperate")),
      zone_change: form.get("axial-zone-change") || ""
    };
    const reasoning = String(form.get("axial-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => answer === "" || (typeof answer === "number" && !Number.isFinite(answer)))) {
      return alert("请完成五项预测后再提交。");
    }
    const correctAnswers = feature.calculate(scenario, scenario.target_tilt_deg, catalog.axialTiltLab.facts);
    const checks = {
      tropic_latitude: Math.abs(answers.tropic_latitude - correctAnswers.tropic_latitude) <= 0.1,
      polar_circle_latitude: Math.abs(answers.polar_circle_latitude - correctAnswers.polar_circle_latitude) <= 0.1,
      tropical_width: Math.abs(answers.tropical_width - correctAnswers.tropical_width) <= 0.1,
      temperate_width_each: Math.abs(answers.temperate_width_each - correctAnswers.temperate_width_each) <= 0.1,
      zone_change: answers.zone_change === correctAnswers.zone_change
    };
    const errorTags = [];
    if (!checks.tropic_latitude) errorTags.push("X-TROPIC-LATITUDE");
    if (!checks.polar_circle_latitude) errorTags.push("X-POLAR-CIRCLE");
    if (!checks.tropical_width) errorTags.push("X-TROPICAL-WIDTH");
    if (!checks.temperate_width_each) errorTags.push("X-TEMPERATE-WIDTH");
    if (!checks.zone_change) errorTags.push("X-ZONE-CHANGE");
    const attempt = {
      schema_version: "0.14.0", id: newId(), scenario_id: scenario.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.axialTiltAttempts.push(attempt);
    state.activeAxialTiltAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "date-range-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.dateRange;
    const scenario = getDateRangeScenario();
    if (!feature || !scenario) return;
    const form = new FormData(event.target);
    const answers = {
      zero_meridian: Number(form.get("date-zero")),
      new_date_percent: Number(form.get("date-new")),
      old_date_percent: Number(form.get("date-old")),
      date_count: form.get("date-count") || "",
      crossing_result: form.get("date-crossing") || ""
    };
    const reasoning = String(form.get("date-reasoning") || "").trim();
    if (!Number.isFinite(answers.zero_meridian) || !Number.isFinite(answers.new_date_percent) || !Number.isFinite(answers.old_date_percent) || !answers.date_count || !answers.crossing_result) {
      return alert("请完成五项预测后再提交。");
    }
    const correctAnswers = feature.calculate(scenario);
    const longitudeDifference = Math.abs(answers.zero_meridian - correctAnswers.zero_meridian);
    const checks = {
      zero_meridian: Math.min(longitudeDifference, 360 - longitudeDifference) <= 1,
      new_date_percent: Math.abs(answers.new_date_percent - correctAnswers.new_date_percent) <= 0.1,
      old_date_percent: Math.abs(answers.old_date_percent - correctAnswers.old_date_percent) <= 0.1,
      date_count: answers.date_count === correctAnswers.date_count,
      crossing_result: answers.crossing_result === correctAnswers.crossing_result
    };
    const errorTags = [];
    if (!checks.zero_meridian) errorTags.push("D-MIDNIGHT-MERIDIAN");
    if (!checks.new_date_percent) errorTags.push("D-NEW-DATE-RANGE");
    if (!checks.old_date_percent) errorTags.push("D-OLD-DATE-RANGE");
    if (!checks.date_count) errorTags.push("D-DATE-COUNT");
    if (!checks.crossing_result) errorTags.push("D-IDL-DIRECTION");
    const attempt = {
      schema_version: "0.13.0", id: newId(), scenario_id: scenario.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.dateRangeAttempts.push(attempt);
    state.activeDateRangeAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "rotation-speed-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.rotationSpeed;
    const scenario = getRotationSpeedScenario();
    const place = getRotationSpeedPlace(scenario?.place_id);
    if (!feature || !scenario || !place) return;
    const form = new FormData(event.target);
    const answers = {
      angular_speed: form.get("rotation-angular-speed") || "",
      line_speed_relation: form.get("rotation-line-relation") || "",
      line_speed_km_h: Number(form.get("rotation-line-speed")),
      rotated_angle_deg: Number(form.get("rotation-angle")),
      distance_km: Number(form.get("rotation-distance"))
    };
    const reasoning = String(form.get("rotation-reasoning") || "").trim();
    if (!answers.angular_speed || !answers.line_speed_relation || !Number.isFinite(answers.line_speed_km_h) || !Number.isFinite(answers.rotated_angle_deg) || !Number.isFinite(answers.distance_km)) {
      return alert("请完成五项预测后再提交。");
    }
    const correctAnswers = feature.calculate(place, scenario.duration_hours, catalog.rotationSpeedLab.facts);
    const checks = {
      angular_speed: answers.angular_speed === correctAnswers.angular_speed,
      line_speed_relation: answers.line_speed_relation === correctAnswers.line_speed_relation,
      line_speed_km_h: Math.abs(answers.line_speed_km_h - correctAnswers.line_speed_km_h) <= 6,
      rotated_angle_deg: answers.rotated_angle_deg === correctAnswers.rotated_angle_deg,
      distance_km: Math.abs(answers.distance_km - correctAnswers.distance_km) <= 26
    };
    const errorTags = [];
    if (!checks.angular_speed) errorTags.push("R-ANGULAR-SAME");
    if (!checks.line_speed_relation) errorTags.push("R-LATITUDE-CIRCLE");
    if (!checks.line_speed_km_h) errorTags.push("R-LINE-SPEED");
    if (!checks.rotated_angle_deg) errorTags.push("R-ANGLE-TIME");
    if (!checks.distance_km) errorTags.push("R-DISTANCE-SPEED");
    const attempt = {
      schema_version: "0.12.0", id: newId(), scenario_id: scenario.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.rotationSpeedAttempts.push(attempt);
    state.activeRotationSpeedAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "terminator-link-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.terminatorLink;
    const scenario = getTerminatorLinkScenario();
    const date = getTerminatorLinkDate(scenario?.date_id);
    const place = getTerminatorLinkPlace(scenario?.place_id);
    if (!feature || !scenario || !date || !place) return;
    const form = new FormData(event.target);
    const answers = {
      direct_longitude: Number(form.get("terminator-direct")),
      local_time: readTimeParts(form, "terminator-local"),
      day_length_hours: Number(form.get("terminator-day-length")),
      status: form.get("terminator-status") || "",
      polar_pattern: form.get("terminator-polar") || ""
    };
    const reasoning = String(form.get("terminator-reasoning") || "").trim();
    if (!Number.isFinite(answers.direct_longitude) || !answers.local_time || !Number.isFinite(answers.day_length_hours) || !answers.status || !answers.polar_pattern) {
      return alert("请完成五项预测后再提交。时间的小时和分钟请分别填写，例如06和00。");
    }
    const correctAnswers = feature.calculate(date, place, scenario.utc_minutes, catalog.terminatorLinkLab.status_line_tolerance_minutes);
    const longitudeDifference = Math.abs(answers.direct_longitude - correctAnswers.direct_longitude);
    const checks = {
      direct_longitude: Math.min(longitudeDifference, 360 - longitudeDifference) <= 1,
      local_time: answers.local_time === correctAnswers.local_time,
      day_length_hours: Math.abs(answers.day_length_hours - correctAnswers.day_length_hours) <= 0.26,
      status: answers.status === correctAnswers.status,
      polar_pattern: answers.polar_pattern === correctAnswers.polar_pattern
    };
    const errorTags = [];
    if (!checks.direct_longitude) errorTags.push("L-DIRECT-MERIDIAN");
    if (!checks.local_time) errorTags.push("L-LOCAL-TIME");
    if (!checks.day_length_hours) errorTags.push("L-DAY-LENGTH");
    if (!checks.status) errorTags.push("L-TERMINATOR-STATUS");
    if (!checks.polar_pattern) errorTags.push("L-POLAR-RANGE");
    const attempt = {
      schema_version: "0.11.0", id: newId(), scenario_id: scenario.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.terminatorLinkAttempts.push(attempt);
    state.activeTerminatorLinkAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "orbit-speed-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.orbitSpeed;
    const checkpoint = getOrbitSpeedCheckpoint();
    const hemisphere = getOrbitSpeedHemisphere();
    if (!feature || !checkpoint || !hemisphere) return;
    const form = new FormData(event.target);
    const answers = {
      distance_state: form.get("orbit-distance-state") || "",
      speed_state: form.get("orbit-speed-state") || "",
      season: form.get("orbit-season") || "",
      season_cause: form.get("orbit-season-cause") || ""
    };
    const reasoning = String(form.get("orbit-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) {
      return alert("请完成四项预测后再提交。");
    }
    const correctAnswers = feature.calculate(checkpoint, hemisphere, catalog.orbitSpeedLab.facts);
    const checks = {
      distance_state: answers.distance_state === correctAnswers.distance_state,
      speed_state: answers.speed_state === correctAnswers.speed_state,
      season: answers.season === correctAnswers.season,
      season_cause: answers.season_cause === correctAnswers.season_cause
    };
    const errorTags = [];
    if (!checks.distance_state) errorTags.push("O-DISTANCE-POSITION");
    if (!checks.speed_state) errorTags.push("O-SPEED-DISTANCE");
    if (!checks.season) errorTags.push("O-HEMISPHERE-SEASON");
    if (!checks.season_cause) errorTags.push(answers.season_cause === "近日点更热、远日点更冷" ? "O-SEASON-DISTANCE" : "O-SEASON-CAUSE");
    const attempt = {
      schema_version: "0.10.0", id: newId(), checkpoint_id: checkpoint.id, hemisphere_id: hemisphere.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.orbitSpeedAttempts.push(attempt);
    state.activeOrbitSpeedAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "annual-sun-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.annualSun;
    const checkpoint = getAnnualSunCheckpoint();
    const place = getAnnualSunPlace();
    if (!feature || !checkpoint || !place) return;
    const form = new FormData(event.target);
    const answers = {
      direct_latitude: Number(form.get("annual-direct-latitude")),
      migration: form.get("annual-migration") || "",
      north_day_trend: form.get("annual-day-trend") || "",
      altitude_trend: form.get("annual-altitude-trend") || ""
    };
    const reasoning = String(form.get("annual-reasoning") || "").trim();
    if (!Number.isFinite(answers.direct_latitude) || !answers.migration || !answers.north_day_trend || !answers.altitude_trend) {
      return alert("请完成四项预测后再提交。");
    }
    const correctAnswers = feature.calculate(checkpoint, place);
    const checks = {
      direct_latitude: Math.abs(answers.direct_latitude - correctAnswers.direct_latitude) <= 0.6,
      migration: answers.migration === correctAnswers.migration,
      north_day_trend: answers.north_day_trend === correctAnswers.north_day_trend,
      altitude_trend: answers.altitude_trend === correctAnswers.altitude_trend
    };
    const errorTags = [];
    if (!checks.direct_latitude) errorTags.push("A-DATE-LATITUDE");
    if (!checks.migration) errorTags.push(correctAnswers.migration.includes("折返") || answers.migration.includes("折返") ? "A-SOLSTICE-TURN" : "A-MIGRATION-DIRECTION");
    if (!checks.north_day_trend) errorTags.push("A-DAY-TREND");
    if (!checks.altitude_trend) errorTags.push("A-ALTITUDE-TREND");
    const attempt = {
      schema_version: "0.9.0", id: newId(), checkpoint_id: checkpoint.id, place_id: place.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.annualSunAttempts.push(attempt);
    state.activeAnnualSunAttemptId = attempt.id;
    saveState(); render();
    return;
  }
  if (event.target.id === "solar-path-form") {
    event.preventDefault();
    const feature = window.OrangeCoach?.features?.solarPath;
    const date = getSolarPathDate();
    const place = getSolarPathPlace();
    if (!feature || !date || !place) return;
    const form = new FormData(event.target);
    const answers = {
      sunrise: form.get("path-sunrise") || "",
      noon_sun: form.get("path-noon-sun") || "",
      sunset: form.get("path-sunset") || "",
      noon_shadow: form.get("path-noon-shadow") || ""
    };
    const reasoning = String(form.get("solar-path-reasoning") || "").trim();
    if (Object.values(answers).some((answer) => !answer)) {
      return alert("请完成四项预测后再提交。");
    }
    const correctAnswers = feature.calculate(date, place);
    const checks = {
      sunrise: answers.sunrise === correctAnswers.sunrise,
      noon_sun: answers.noon_sun === correctAnswers.noon_sun,
      sunset: answers.sunset === correctAnswers.sunset,
      noon_shadow: answers.noon_shadow === correctAnswers.noon_shadow
    };
    const errorTags = [];
    if (!checks.sunrise || !checks.sunset) errorTags.push("P-DATE-RISESET");
    if (!checks.noon_sun) errorTags.push("P-NOON-LATITUDE");
    if (!checks.noon_shadow) errorTags.push(correctAnswers.noon_sun === "头顶" || answers.noon_sun === "头顶" ? "P-OVERHEAD-SHADOW" : "P-SHADOW-OPPOSITE");
    const attempt = {
      schema_version: "0.8.0", id: newId(), date_id: date.id, place_id: place.id,
      answers, correct_answers: correctAnswers, checks,
      score: Object.values(checks).filter(Boolean).length, error_tags: errorTags, reasoning,
      submitted_at: new Date().toISOString(), parent_review_status: "待家长确认", parent_note: ""
    };
    state.solarPathAttempts.push(attempt);
    state.activeSolarPathAttemptId = attempt.id;
    saveState(); render();
    return;
  }
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
    if (!answers.direct || !answers.day_relation || !answers.north_pattern || answers.noon_altitude == null || !Number.isFinite(answers.noon_altitude)) {
      return alert("请完成四项预测后再提交。");
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
    if (Object.values(answers).some((answer) => !answer)) {
      return alert("请完成四项预测后再提交。");
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
    if (!answers.relation || !answers.local_time || !answers.zone_time || !answers.date_relation) {
      return alert("请完成四项预测后再提交。时间的小时和分钟请分别填写，例如11和44。");
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
  if (!selectedOption) return alert("请先选择答案。");
  state.activeSession = { questionId: state.currentQuestionId, selectedOption, reasoning, confidence, submittedAt: new Date().toISOString() };
  saveState(); render();
});

document.addEventListener("input", (event) => {
  if (event.target.id === "tide-progress") {
    window.OrangeCoach?.features?.tide?.updateCycle(event.target.value, catalog.tideLab);
    return;
  }
  if (event.target.id === "eclipse-progress") {
    window.OrangeCoach?.features?.eclipse?.updateCycle(event.target.value, catalog.eclipseLab);
    return;
  }
  if (event.target.id === "moon-phase-progress") {
    window.OrangeCoach?.features?.moonPhase?.updateCycle(event.target.value, catalog.moonPhaseLab);
    return;
  }
  if (event.target.id === "solar-activity-progress") {
    const attempt = getSolarActivityAttempt(state.activeSolarActivityAttemptId);
    window.OrangeCoach?.features?.solarActivity?.updateProgress(event.target.value, catalog.solarActivityLab, getSolarActivityScenario(attempt?.scenario_id));
    return;
  }
  if (event.target.id === "habitability-progress") {
    const attempt = getHabitabilityAttempt(state.activeHabitabilityAttemptId);
    window.OrangeCoach?.features?.habitability?.updateProgress(event.target.value, catalog.habitabilityLab, getHabitabilityScenario(attempt?.scenario_id));
    return;
  }
  if (event.target.id === "celestial-progress") {
    window.OrangeCoach?.features?.celestialScale?.updateProgress(event.target.value, catalog.celestialScaleLab);
    return;
  }
  if (event.target.id === "axial-tropic-prediction") {
    window.OrangeCoach?.features?.axialTilt?.updateTropic(event.target.value);
    return;
  }
  if (event.target.id === "axial-polar-prediction") {
    window.OrangeCoach?.features?.axialTilt?.updatePolar(event.target.value);
    return;
  }
  if (event.target.id === "axial-tropical-width-prediction") {
    window.OrangeCoach?.features?.axialTilt?.updateTropicalWidth(event.target.value);
    return;
  }
  if (event.target.id === "axial-temperate-prediction") {
    window.OrangeCoach?.features?.axialTilt?.updateTemperate(event.target.value);
    return;
  }
  if (event.target.id === "axial-progress") {
    const attempt = getAxialTiltAttempt(state.activeAxialTiltAttemptId);
    const scenario = getAxialTiltScenario(attempt?.scenario_id);
    window.OrangeCoach?.features?.axialTilt?.updateProgress(event.target.value, scenario, catalog.axialTiltLab?.facts);
    return;
  }
  if (event.target.id === "date-zero-prediction") {
    window.OrangeCoach?.features?.dateRange?.updateZero(event.target.value);
    return;
  }
  if (event.target.id === "date-new-prediction") {
    window.OrangeCoach?.features?.dateRange?.updateNew(event.target.value);
    return;
  }
  if (event.target.id === "date-old-prediction") {
    window.OrangeCoach?.features?.dateRange?.updateOld(event.target.value);
    return;
  }
  if (event.target.id === "date-progress") {
    const attempt = getDateRangeAttempt(state.activeDateRangeAttemptId);
    const scenario = getDateRangeScenario(attempt?.scenario_id);
    window.OrangeCoach?.features?.dateRange?.updateProgress(event.target.value, scenario);
    return;
  }
  if (event.target.id === "rotation-line-prediction") {
    window.OrangeCoach?.features?.rotationSpeed?.updateLinePrediction(event.target.value);
    return;
  }
  if (event.target.id === "rotation-angle-prediction") {
    window.OrangeCoach?.features?.rotationSpeed?.updateAnglePrediction(event.target.value);
    return;
  }
  if (event.target.id === "rotation-distance-prediction") {
    window.OrangeCoach?.features?.rotationSpeed?.updateDistancePrediction(event.target.value);
    return;
  }
  if (event.target.id === "rotation-progress") {
    const attempt = getRotationSpeedAttempt(state.activeRotationSpeedAttemptId);
    const scenario = getRotationSpeedScenario(attempt?.scenario_id);
    window.OrangeCoach?.features?.rotationSpeed?.updateProgress(event.target.value, getRotationSpeedPlace(scenario?.place_id), catalog.rotationSpeedLab?.facts);
    return;
  }
  if (event.target.id === "terminator-direct-prediction") {
    window.OrangeCoach?.features?.terminatorLink?.updateDirectPrediction(event.target.value);
    return;
  }
  if (event.target.id === "terminator-day-prediction") {
    window.OrangeCoach?.features?.terminatorLink?.updateDayPrediction(event.target.value);
    return;
  }
  if (event.target.id === "terminator-progress") {
    const attempt = getTerminatorLinkAttempt(state.activeTerminatorLinkAttemptId);
    const scenario = getTerminatorLinkScenario(attempt?.scenario_id);
    window.OrangeCoach?.features?.terminatorLink?.updateProgress(event.target.value, getTerminatorLinkDate(scenario?.date_id), getTerminatorLinkPlace(scenario?.place_id));
    return;
  }
  if (event.target.id === "orbit-progress") {
    window.OrangeCoach?.features?.orbitSpeed?.updateProgress(event.target.value, catalog.orbitSpeedLab);
    return;
  }
  if (event.target.matches(".annual-latitude-slider")) {
    window.OrangeCoach?.features?.annualSun?.updatePrediction(event.target.value);
    return;
  }
  if (event.target.id === "annual-progress") {
    window.OrangeCoach?.features?.annualSun?.updateProgress(event.target.value, catalog.annualSunLab, getAnnualSunPlace());
    return;
  }
  if (event.target.id === "solar-path-progress") {
    window.OrangeCoach?.features?.solarPath?.updateProgress(event.target.value, getSolarPathDate(), getSolarPathPlace());
    return;
  }
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
    const localRecordCount = state.attempts.length + state.retestAttempts.length + state.timeLabAttempts.length + state.earthMotionAttempts.length + state.solarSeasonAttempts.length + state.solarPathAttempts.length + state.annualSunAttempts.length + state.orbitSpeedAttempts.length + state.terminatorLinkAttempts.length + state.rotationSpeedAttempts.length + state.dateRangeAttempts.length + state.axialTiltAttempts.length + state.celestialScaleAttempts.length + state.habitabilityAttempts.length + state.solarActivityAttempts.length + state.moonPhaseAttempts.length + state.eclipseAttempts.length + state.tideAttempts.length + state.coriolisAttempts.length + state.frontWeatherAttempts.length + state.cycloneSystemAttempts.length + state.atmosphereReasoningAttempts.length;
    const isAnnotatedArchive = ["0.6.0", "0.7.0", "0.8.0", "0.9.0", "0.10.0", "0.11.0", "0.12.0", "0.13.0", "0.14.0", "0.15.0", "0.16.0", "0.17.0", "0.18.0", "0.19.0", "0.20.0", "0.21.0", "0.21.1", "0.21.2", "0.21.3", COACH_CONFIG.EXPORT_SCHEMA_VERSION].includes(imported.export_schema_version) && Array.isArray(imported.coach_annotations);
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
      state.solarPathAttempts = normalized.solarPathAttempts;
      state.annualSunAttempts = normalized.annualSunAttempts;
      state.orbitSpeedAttempts = normalized.orbitSpeedAttempts;
      state.terminatorLinkAttempts = normalized.terminatorLinkAttempts;
      state.rotationSpeedAttempts = normalized.rotationSpeedAttempts;
      state.dateRangeAttempts = normalized.dateRangeAttempts;
      state.axialTiltAttempts = normalized.axialTiltAttempts;
      state.celestialScaleAttempts = normalized.celestialScaleAttempts;
      state.habitabilityAttempts = normalized.habitabilityAttempts;
      state.solarActivityAttempts = normalized.solarActivityAttempts;
      state.moonPhaseAttempts = normalized.moonPhaseAttempts;
      state.eclipseAttempts = normalized.eclipseAttempts;
      state.tideAttempts = normalized.tideAttempts;
      state.coriolisAttempts = normalized.coriolisAttempts;
      state.frontWeatherAttempts = normalized.frontWeatherAttempts;
      state.cycloneSystemAttempts = normalized.cycloneSystemAttempts;
      state.atmosphereReasoningAttempts = normalized.atmosphereReasoningAttempts;
      state.coachAnnotations = normalized.coachAnnotations;
      state.lastAction = `已导入学习档案：${state.coachAnnotations.length} 条教练批注`;
    }
    saveState(); render();
  } catch (error) { alert(`导入失败：${error.message}`); }
});

function saveAttempt(destination = "parent") {
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
  if (destination === "next") {
    state.currentQuestionId = chooseNextCatalogQuestion(question.id)?.id || null;
    state.route = "train";
  } else {
    state.route = "parent";
    state.currentQuestionId = null;
  }
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

function saveSolarPathReview(id) {
  const attempt = state.solarPathAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#path-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#path-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveAnnualSunReview(id) {
  const attempt = state.annualSunAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#annual-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#annual-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveOrbitSpeedReview(id) {
  const attempt = state.orbitSpeedAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#orbit-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#orbit-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveTerminatorLinkReview(id) {
  const attempt = state.terminatorLinkAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#link-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#link-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveRotationSpeedReview(id) {
  const attempt = state.rotationSpeedAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#rotation-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#rotation-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveDateRangeReview(id) {
  const attempt = state.dateRangeAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#date-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#date-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveAxialTiltReview(id) {
  const attempt = state.axialTiltAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#axial-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#axial-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveCelestialScaleReview(id) {
  const attempt = state.celestialScaleAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#celestial-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#celestial-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveHabitabilityReview(id) {
  const attempt = state.habitabilityAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#habitability-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#habitability-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveSolarActivityReview(id) {
  const attempt = state.solarActivityAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#solar-activity-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#solar-activity-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveMoonPhaseReview(id) {
  const attempt = state.moonPhaseAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#moon-phase-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#moon-phase-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveEclipseReview(id) {
  const attempt = state.eclipseAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#eclipse-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#eclipse-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveTideReview(id) {
  const attempt = state.tideAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#tide-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#tide-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveCoriolisReview(id) {
  const attempt = state.coriolisAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#coriolis-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#coriolis-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveFrontWeatherReview(id) {
  const attempt = state.frontWeatherAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#front-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#front-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveCycloneSystemReview(id) {
  const attempt = state.cycloneSystemAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#cyclone-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#cyclone-note-${CSS.escape(id)}`)?.value.trim() || "";
  saveState(); render();
}

function saveAtmosphereReview(id) {
  const attempt = state.atmosphereReasoningAttempts.find((item) => item.id === id);
  if (!attempt) return;
  attempt.parent_review_status = document.querySelector(`#atmosphere-verdict-${CSS.escape(id)}`)?.value || "待家长确认";
  attempt.parent_note = document.querySelector(`#atmosphere-note-${CSS.escape(id)}`)?.value.trim() || "";
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
    const [topics, questions, paperReviews, retests, projectCatalog, curriculum, regionReview, timeLab, earthMotionLab, solarSeasonLab, solarPathLab, annualSunLab, orbitSpeedLab, terminatorLinkLab, rotationSpeedLab, dateRangeLab, axialTiltLab, celestialScaleLab, habitabilityLab, solarActivityLab, moonPhaseLab, eclipseLab, tideLab, coriolisLab, frontWeatherLab, cycloneSystemLab, atmosphereLabs] = await Promise.all([
      fetch(`./data/topics.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/questions.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/paper_reviews.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/retests.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/learning_projects.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/curriculum_catalog.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/region_review.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/time_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/earth_motion_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/solar_season_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/solar_path_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/annual_sun_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/orbit_speed_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/terminator_link_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/rotation_speed_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/date_range_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/axial_tilt_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/celestial_scale_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/habitability_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/solar_activity_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/moon_phase_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/eclipse_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/tide_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/coriolis_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/front_weather_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/cyclone_system_lab.json?v=${ASSET_VERSION}`).then((response) => response.json()),
      fetch(`./data/atmosphere_reasoning_labs.json?v=${ASSET_VERSION}`).then((response) => response.json())
    ]);
    catalog = { topics, questions, paperReviews, retests, projects: projectCatalog.projects || [], curriculum, regionReview, timeLab, earthMotionLab, solarSeasonLab, solarPathLab, annualSunLab, orbitSpeedLab, terminatorLinkLab, rotationSpeedLab, dateRangeLab, axialTiltLab, celestialScaleLab, habitabilityLab, solarActivityLab, moonPhaseLab, eclipseLab, tideLab, coriolisLab, frontWeatherLab, cycloneSystemLab, atmosphereLabs };
    render();
  } catch (error) {
    app.innerHTML = `<section class="card"><h2>项目启动失败</h2><p>请通过本地服务器打开，而不是直接双击 index.html。</p><div class="quote">${escapeHtml(error.message)}</div></section>`;
  }
}

init();
