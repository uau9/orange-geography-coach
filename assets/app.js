import { calculateTimeLabAnswers, formatClock, longitudeLabel, normalizeTimeAnswer } from "./time-utils.js";

const STORAGE_KEY = "orange-geography-coach:v0.1";

const app = document.querySelector("#app");
const state = loadState();
let catalog = { topics: [], questions: [], paperReviews: [], retests: [], timeLab: null };

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
    attempts: [],
    retestAttempts: [],
    timeLabAttempts: [],
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
function completedToday() {
  const day = new Date().toISOString().slice(0, 10);
  return [...state.attempts, ...state.retestAttempts, ...state.timeLabAttempts]
    .filter((attempt) => attempt.submitted_at?.startsWith(day)).length;
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
function render() {
  window.scrollTo(0, 0);
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.route === state.route));
  if (state.route === "retest") return renderRetest();
  if (state.route === "time-lab") return renderTimeLab();
  if (state.route === "train") return renderTrain();
  if (state.route === "mastery") return renderMastery();
  if (state.route === "parent") return renderParent();
  return renderToday();
}

function renderToday() {
  const attempts = latestAttempts();
  const due = getActiveQuestion();
  const latestLab = latestTimeLabAttempts()[0];
  app.innerHTML = `
    <h2 class="page-title">今天，先留下一个真实判断</h2>
    <p class="page-subtitle">不追求题量。先预测、再观察、最后解释；AI负责提出诊断候选，家长负责确认。</p>
    <section class="card time-lab-entry">
      <div class="attempt-head"><div><span class="pill orange">v0.3 时区专项</span><h2>时区实验室</h2></div><span class="lab-orbit" aria-hidden="true"></span></div>
      <p>拖动目标经度，先预测地方时、理论区时和日期，再解锁同一瞬间的三种时间。</p>
      ${latestLab ? `<p class="small">最近一次：${latestLab.score}/4 · ${escapeHtml(latestLab.parent_review_status)} · ${formatDate(latestLab.submitted_at)}</p>` : `<p class="small">第一轮建议从120°E开始，重点观察UTC与北京时间的关系。</p>`}
      <div class="btn-row"><button class="btn orange" data-action="start-time-lab">进入实验室</button><button class="btn secondary" data-action="start-time-diagnostic">做时区诊断题</button></div>
    </section>
    <section class="card hero-card">
      <span class="pill orange">今日任务</span>
      <h2>${escapeHtml(due?.title || "暂无题目")}</h2>
      <p>${due ? escapeHtml(due.stem.slice(0, 64)) + "……" : "请先在 data/questions.json 中加入题目。"}</p>
      <div class="btn-row"><button class="btn" data-action="start-next">开始诊断</button><button class="btn secondary" data-action="goto" data-route="parent">查看家长页</button></div>
    </section>
    <section class="stat-grid">
      <div class="stat"><strong>${completedToday()}</strong><span>今日完成</span></div>
      <div class="stat"><strong>${state.attempts.length}</strong><span>诊断题记录</span></div>
      <div class="stat"><strong>${state.timeLabAttempts.length}</strong><span>时区实验</span></div>
    </section>
    <section class="card">
      <h3>最近记录</h3>
      ${attempts.length ? `<div class="attempt-list">${attempts.slice(0, 3).map(renderAttemptSummary).join("")}</div>` : `<div class="empty">还没有记录。第一条记录不需要完美，只需要真实。</div>`}
    </section>
    <div class="notice">家长提示：今天只问“你为什么这样选”，先不要把页面变成讲答案的地方。</div>
  `;
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
  const markerPosition = ((longitude + 175) / 350) * 100;
  app.innerHTML = `
    <div class="topic-meta">自然地理 · 时区与地方时 · ${escapeHtml(scenario.id)}</div>
    <h2 class="page-title">时区实验室</h2>
    <p class="page-subtitle">先预测，再解锁。拖动经度不会显示答案，提交后才会看到三种时间如何联动。</p>
    <section class="card time-lab-card">
      <div class="lab-reference"><span>全球参考时刻</span><strong>${escapeHtml(scenario.utc_date)} UTC ${formatClock(scenario.utc_minutes)}</strong></div>
      <div class="lab-model-note">理论模型：地方时按经度每1°差4分钟；区时按最近的15°中央经线计算。不考虑均时差、夏令时和法定边界。</div>
      <div class="longitude-heading"><strong>选择目标经度</strong><output id="lab-longitude-label">${longitudeLabel(longitude)}</output></div>
      <div class="longitude-scale" aria-hidden="true"><span>175°W</span><span>0°</span><span>175°E</span></div>
      <input id="lab-longitude" class="longitude-slider" name="longitude" type="range" min="-175" max="175" step="1" value="${longitude}" aria-label="目标经度" style="--marker:${markerPosition}%" />
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
          <label><span>2. 目标经度的地方时</span><input name="lab-local-time" class="time-input" inputmode="numeric" placeholder="如 11:44" autocomplete="off" /></label>
          <label><span>3. 目标经度采用的理论区时</span><input name="lab-zone-time" class="time-input" inputmode="numeric" placeholder="如 12:00" autocomplete="off" /></label>
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
  app.innerHTML = `
    <h2 class="page-title">掌握与复测</h2>
    <p class="page-subtitle">百分比只是提示，不代表真正掌握。真正的证据来自延迟复测和能否讲清推理链。</p>
    <section class="card"><div class="topic-list">${catalog.topics.map((topic) => {
      const stats = topicStats(topic);
      return `<div class="topic-item"><div class="topic-head"><div><strong>${escapeHtml(topic.name)}</strong><div class="topic-meta">${escapeHtml(topic.category)} · ${stats.attempts.length ? `${stats.attempts.length} 次作答` : "尚未开始"}</div></div><span class="pill ${stats.ratio >= 70 ? "green" : stats.attempts.length ? "orange" : ""}">${stats.attempts.length ? `${stats.ratio}%` : "待建立"}</span></div><div class="progress"><span style="width:${stats.ratio}%"></span></div><div class="topic-meta">${escapeHtml(topic.description)}</div></div>`;
    }).join("")}</div></section>
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
  app.innerHTML = `
    <h2 class="page-title">家长审核页</h2>
    <p class="page-subtitle">只核验三件事：理由是否真实、诊断是否有证据、下一步是否可执行。</p>
    <div class="notice">家长不是每道题的讲解员，而是学习过程的质量审核员。连续 2–3 次同类错误，再考虑请老师校准。</div>
    <section class="card"><h3>真实试卷复盘</h3>${catalog.paperReviews.map(renderPaperReview).join("") || `<div class="empty">尚未录入试卷复盘。</div>`}</section>
    <section class="card"><h3>时区实验审核</h3>${timeLabAttempts.length ? `<div class="attempt-list">${timeLabAttempts.map(renderParentTimeLabAttempt).join("")}</div>` : `<div class="empty">橙子提交时区预测后，这里会出现步骤证据。</div>`}</section>
    <section class="card"><h3>专项复测审核</h3>${retestAttempts.length ? `<div class="attempt-list">${retestAttempts.map(renderParentRetestAttempt).join("")}</div>` : `<div class="empty">橙子提交专项复测后，这里会出现评分点。</div>`}</section>
    <section class="card"><h3>其他待审核记录</h3>${attempts.length ? `<div class="attempt-list">${attempts.map(renderParentAttempt).join("")}</div>` : `<div class="empty">橙子完成第一道题后，这里会出现审核记录。</div>`}</section>
    <section class="card"><h3>数据管理</h3><p class="small">数据只保存在这个浏览器。更换设备前先导出；不要把含个人信息的导出文件随意发送。</p><div class="btn-row"><button class="btn secondary" data-action="export-data">导出学习记录</button><label class="btn secondary" for="import-data">导入学习记录</label><input id="import-data" class="file-input" type="file" accept="application/json" data-action="import-data" /></div></section>
  `;
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
  "T-ORDER": "计算顺序错误"
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
  if (action === "next-time-lab") {
    state.timeLabScenarioIndex = (state.timeLabScenarioIndex + 1) % Math.max(catalog.timeLab?.scenarios?.length || 1, 1);
    state.activeTimeLabAttemptId = null;
    state.route = "time-lab";
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
  if (action === "save-attempt") saveAttempt();
  if (action === "save-review") saveReview(actionTarget.dataset.attemptId);
  if (action === "save-lab-review") saveLabReview(actionTarget.dataset.attemptId);
  if (action === "save-retest-review") saveRetestReview(actionTarget.dataset.attemptId);
  if (action === "export-data") exportData();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "time-lab-form") {
    event.preventDefault();
    const scenario = getTimeLabScenario();
    if (!scenario) return;
    const form = new FormData(event.target);
    const longitude = Number(document.querySelector("#lab-longitude")?.value);
    const answers = {
      relation: form.get("lab-relation") || "",
      local_time: normalizeTimeAnswer(form.get("lab-local-time") || ""),
      zone_time: normalizeTimeAnswer(form.get("lab-zone-time") || ""),
      date_relation: form.get("lab-date-relation") || ""
    };
    const reasoning = String(form.get("lab-reasoning") || "").trim();
    if (!answers.relation || !answers.local_time || !answers.zone_time || !answers.date_relation || !reasoning) {
      return alert("请完成四项预测并写出判断链，再解锁联动结果。时间请写成如11:44的格式。");
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
  if (event.target.id !== "lab-longitude") return;
  const longitude = Number(event.target.value);
  const label = document.querySelector("#lab-longitude-label");
  if (label) label.textContent = longitudeLabel(longitude);
  event.target.style.setProperty("--marker", `${((longitude + 175) / 350) * 100}%`);
});

document.addEventListener("change", async (event) => {
  if (event.target.dataset.action !== "import-data") return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!["0.1.0", "0.2.0", "0.3.0"].includes(imported.version) || !Array.isArray(imported.attempts)) throw new Error("版本不匹配");
    const normalized = normalizeState(imported);
    state.version = normalized.version;
    state.attempts = normalized.attempts;
    state.retestAttempts = normalized.retestAttempts;
    state.timeLabAttempts = normalized.timeLabAttempts;
    state.lastAction = "已导入学习记录";
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
  const blob = new Blob([JSON.stringify({ version: state.version, exported_at: new Date().toISOString(), attempts: state.attempts, retest_attempts: state.retestAttempts, time_lab_attempts: state.timeLabAttempts }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = `orange-geography-records-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
}

async function init() {
  try {
    const [topics, questions, paperReviews, retests, timeLab] = await Promise.all([
      fetch("./data/topics.json").then((response) => response.json()),
      fetch("./data/questions.json").then((response) => response.json()),
      fetch("./data/paper_reviews.json").then((response) => response.json()),
      fetch("./data/retests.json").then((response) => response.json()),
      fetch("./data/time_lab.json").then((response) => response.json())
    ]);
    catalog = { topics, questions, paperReviews, retests, timeLab };
    render();
  } catch (error) {
    app.innerHTML = `<section class="card"><h2>项目启动失败</h2><p>请通过本地服务器打开，而不是直接双击 index.html。</p><div class="quote">${escapeHtml(error.message)}</div></section>`;
  }
}

init();
