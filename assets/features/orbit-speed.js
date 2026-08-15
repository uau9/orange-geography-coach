(function registerOrbitSpeedFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function normalizePhase(value) {
    const phase = Number(value);
    if (!Number.isFinite(phase)) return 0;
    return ((phase % 1) + 1) % 1;
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function orbitPoint(rawPhase) {
    const phase = normalizePhase(rawPhase);
    const angle = Math.PI * 2 * phase;
    return {
      x: round(360 - 250 * Math.cos(angle), 2),
      y: round(210 + 180 * Math.sin(angle), 2)
    };
  }

  function calculateFromPhase(rawPhase, facts = {}) {
    const phase = normalizePhase(rawPhase);
    const angle = Math.PI * 2 * phase;
    const middleDistance = ((facts.perihelion_distance_million_km || 147.1) + (facts.aphelion_distance_million_km || 152.1)) / 2;
    const distanceAmplitude = ((facts.aphelion_distance_million_km || 152.1) - (facts.perihelion_distance_million_km || 147.1)) / 2;
    const middleSpeed = ((facts.max_speed_km_s || 30.29) + (facts.min_speed_km_s || 29.29)) / 2;
    const speedAmplitude = ((facts.max_speed_km_s || 30.29) - (facts.min_speed_km_s || 29.29)) / 2;
    const nearPerihelion = phase < 0.012 || phase > 0.988;
    const nearAphelion = Math.abs(phase - 0.5) < 0.012;
    return {
      phase,
      distance_million_km: round(middleDistance - distanceAmplitude * Math.cos(angle), 1),
      speed_km_s: round(middleSpeed + speedAmplitude * Math.cos(angle), 2),
      distance_state: nearPerihelion ? "近日点（最近）" : nearAphelion ? "远日点（最远）" : phase < 0.5 ? "由近变远" : "由远变近",
      speed_state: nearPerihelion ? "最快，随后减速" : nearAphelion ? "最慢，随后加速" : phase < 0.5 ? "正在减速" : "正在加速"
    };
  }

  function calculate(checkpoint, hemisphere, facts = {}) {
    return {
      phase: checkpoint.phase,
      orbit_label: checkpoint.orbit_label,
      distance_state: checkpoint.distance_state,
      distance_million_km: checkpoint.distance_million_km,
      speed_state: checkpoint.speed_state,
      speed_km_s: checkpoint.speed_km_s,
      season: hemisphere.id === "north" ? checkpoint.north_season : checkpoint.south_season,
      season_cause: facts.season_cause || "地轴倾斜且公转时指向近似不变"
    };
  }

  function trailPoints(centerPhase) {
    const visualSpeedFactor = 1 + 0.35 * Math.cos(Math.PI * 2 * centerPhase);
    const halfWindow = 15 / 365.242 * visualSpeedFactor;
    return Array.from({ length: 25 }, (_, index) => {
      const phase = centerPhase - halfWindow + (halfWindow * 2 * index) / 24;
      const point = orbitPoint(phase);
      return `${point.x},${point.y}`;
    }).join(" ");
  }

  function axisLine(point) {
    return { x1: point.x - 9, y1: point.y + 19, x2: point.x + 9, y2: point.y - 19 };
  }

  function dateLabelY(point) { return point.y < 80 ? point.y + 45 : point.y - 29; }

  function speedArrow(phase, speed) {
    const point = orbitPoint(phase);
    const next = orbitPoint(phase + 0.002);
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const length = 54 + (speed - 29.29) * 25;
    return { x1: point.x, y1: point.y, x2: point.x + dx / magnitude * length, y2: point.y + dy / magnitude * length };
  }

  function renderModel(checkpoint, result = null) {
    const point = orbitPoint(checkpoint.phase);
    const axis = axisLine(point);
    const speed = result ? speedArrow(checkpoint.phase, result.speed_km_s) : null;
    return `
      <svg class="orbit-speed-svg" viewBox="0 0 720 460" role="img" aria-label="地球公转轨道与速度示意图">
        <defs>
          <radialGradient id="orbit-sun-glow"><stop offset="0" stop-color="#fff5a3"/><stop offset=".55" stop-color="#f8c75c"/><stop offset="1" stop-color="#ed8a3b"/></radialGradient>
          <marker id="orbit-direction-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#ed8a3b"/></marker>
          <marker id="orbit-speed-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#1c6a52"/></marker>
        </defs>
        <rect class="orbit-bg" width="720" height="460" rx="24"/>
        <ellipse class="orbit-track" cx="360" cy="210" rx="250" ry="180"/>
        <path class="orbit-direction" d="M112 216 C116 315 180 370 268 383" marker-end="url(#orbit-direction-arrow)"/>
        <text class="orbit-direction-label" x="126" y="363">公转方向</text>
        <g class="orbit-date-labels"><text x="92" y="216">1月</text><text x="360" y="418" text-anchor="middle">4月</text><text x="628" y="216">7月</text><text x="360" y="18" text-anchor="middle">10月</text></g>
        <circle class="orbit-sun" cx="187" cy="210" r="45"/><text class="orbit-sun-label" x="187" y="216" text-anchor="middle">太阳</text>
        ${result ? `<line id="orbit-distance-line" class="orbit-distance-line" x1="187" y1="210" x2="${point.x}" y2="${point.y}"/><polyline id="orbit-time-trail" class="orbit-time-trail" points="${trailPoints(checkpoint.phase)}"/><line id="orbit-speed-vector" class="orbit-speed-vector" x1="${speed.x1}" y1="${speed.y1}" x2="${speed.x2}" y2="${speed.y2}" marker-end="url(#orbit-speed-arrow)"/>` : ""}
        <g id="orbit-earth-marker"><circle class="orbit-earth" cx="${point.x}" cy="${point.y}" r="18"/><line id="orbit-axis-line" class="orbit-axis" x1="${axis.x1}" y1="${axis.y1}" x2="${axis.x2}" y2="${axis.y2}"/><text id="orbit-earth-date" class="orbit-earth-date" x="${point.x}" y="${dateLabelY(point)}" text-anchor="middle">${escapeHtml(checkpoint.name)}</text></g>
        ${result ? `<g class="orbit-answer-band"><rect x="154" y="422" width="412" height="28" rx="14"/><text id="orbit-progress-label" x="360" y="441" text-anchor="middle">${escapeHtml(checkpoint.name)} · ${escapeHtml(result.orbit_label)} · ${result.distance_million_km}百万千米 · ${result.speed_km_s} km/s</text></g>` : `<g class="orbit-lock"><rect x="237" y="188" width="315" height="42" rx="21"/><text x="394.5" y="214" text-anchor="middle">距离数值、速度箭头和30天轨迹提交后显示</text></g>`}
      </svg>`;
  }

  function renderChoice(name, values) {
    return `<div class="orbit-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"/><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, checkpoint, hemisphere }) {
    return `
      <div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(checkpoint.id)}-${escapeHtml(hemisphere.id)}</div>
      <h2 class="page-title">地球公转轨道与速度实验室</h2>
      <p class="page-subtitle">先看地球在轨道上的位置，再判断远近、快慢和季节；不要把“离太阳近”直接等同于夏季。</p>
      <div class="orbit-date-tabs" aria-label="选择公转位置">${lab.checkpoints.map((item) => `<button class="${item.id === checkpoint.id ? "active" : ""}" data-action="set-orbit-checkpoint" data-checkpoint-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.date_hint)}</small></button>`).join("")}</div>
      <section class="card orbit-speed-card"><div class="orbit-speed-layout">
        <div class="orbit-model-panel">
          <div class="solar-model-head"><div><span class="pill orange">当前情境</span><h3>${escapeHtml(checkpoint.name)} · ${escapeHtml(hemisphere.name)}</h3></div><span class="pill">轨道俯视示意</span></div>
          ${renderModel(checkpoint, calculate(checkpoint, hemisphere, lab.facts))}
          <p class="motion-hint">${escapeHtml(lab.model_note)} 地轴小线在各位置保持平行；答案数据默认可见。</p>
          <div class="orbit-hemisphere-tabs" aria-label="选择季节判断半球">${lab.hemispheres.map((item) => `<button class="${item.id === hemisphere.id ? "active" : ""}" data-action="set-orbit-hemisphere" data-hemisphere-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>判断该半球季节</small></button>`).join("")}</div>
        </div>
        <form id="orbit-speed-form" class="orbit-prediction-panel">
          <div class="notice">判断顺序：先位置与距离，再由开普勒第二定律判断速度，最后判断半球季节和四季成因。</div>
          <fieldset><legend>1. 此时日地距离处于：</legend>${renderChoice("orbit-distance-state", lab.choices.distance_state)}</fieldset>
          <fieldset><legend>2. 此时地球公转速度：</legend>${renderChoice("orbit-speed-state", lab.choices.speed_state)}</fieldset>
          <fieldset><legend>3. ${escapeHtml(hemisphere.name)}此时大致为：</legend>${renderChoice("orbit-season", lab.choices.season)}</fieldset>
          <fieldset><legend>4. 地球形成四季的主要原因是：</legend>${renderChoice("orbit-season-cause", lab.choices.season_cause)}</fieldset>
          <label class="field-label" for="orbit-reasoning">判断链（选填）</label><textarea id="orbit-reasoning" name="orbit-reasoning" placeholder="例如：先根据太阳位于椭圆焦点判断远近；越近公转越快；再按地轴倾斜判断所选半球季节；用南北半球季节相反排除距离成因。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交预测</button>
        </form>
      </div></section>`;
  }

  function answerRow(label, userAnswer, correctAnswer, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
  }

  function renderResult({ lab, checkpoint, hemisphere, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks || {};
    const opposite = lab.hemispheres.find((item) => item.id !== hemisphere.id);
    const oppositeSeason = opposite?.id === "north" ? checkpoint.north_season : checkpoint.south_season;
    return `
      <div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
      <h2 class="page-title">把轨道远近、速度与四季成因分开</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/4。拖动一年，观察同样30天在近日点和远日点附近走过的轨道弧长不同。</p>
      <section class="card orbit-speed-card"><div class="orbit-result-layout">
        <div>${renderModel(checkpoint, correct)}<label class="annual-progress-caption" for="orbit-progress"><span>1月初</span><strong>拖动公转一年</strong><span>次年1月</span></label><input id="orbit-progress" class="annual-progress-slider" type="range" min="0" max="100" step="1" value="${checkpoint.phase * 100}" aria-label="地球公转周年位置"/><p class="motion-hint">橙色轨迹表示以当前位置为中心的约30天行程；图形差异被夸大，但“近日点快、远日点慢”与数值关系保持一致。</p></div>
        <div><div class="lab-check-grid">${answerRow("距离状态", attempt.answers.distance_state, correct.distance_state, checks.distance_state)}${answerRow("公转速度", attempt.answers.speed_state, correct.speed_state, checks.speed_state)}${answerRow(`${hemisphere.name}季节`, attempt.answers.season, correct.season, checks.season)}${answerRow("四季成因", attempt.answers.season_cause, correct.season_cause, checks.season_cause)}</div>
          <div class="orbit-fact-strip"><div><span>日地距离</span><strong>${correct.distance_million_km}</strong><small>百万千米</small></div><div><span>公转速度</span><strong>${correct.speed_km_s}</strong><small>km/s</small></div><div><span>轨道位置</span><strong>${escapeHtml(correct.orbit_label)}</strong><small>${escapeHtml(checkpoint.name)}</small></div></div>
          <div class="answer-box ${attempt.score === 4 ? "correct" : "wrong"}"><strong>${escapeHtml(checkpoint.name)} · ${escapeHtml(hemisphere.name)}</strong><br/>${escapeHtml(hemisphere.name)}是${escapeHtml(correct.season)}，同一时刻${escapeHtml(opposite?.name || "另一半球")}是${escapeHtml(oppositeSeason)}。两半球距离太阳相同却季节相反，说明日地距离不是四季的主要成因。</div>
          <div class="notice">速度留下的另一条证据：北半球春夏半年约${lab.facts.north_spring_summer_days}天，秋冬半年约${lab.facts.north_autumn_winter_days}天；春夏经过远日点附近较慢，因此略长。</div>
          <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">四步均正确。请家长追问：1月地球更靠近太阳，为什么北半球仍是冬季、南半球却是夏季？</div>`}
          <div class="btn-row"><button class="btn orange" data-action="next-orbit-speed">换轨道位置继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
        </div>
      </div></section>`;
  }

  function nearestCheckpoint(lab, phase) {
    return [...(lab.checkpoints || [])].sort((a, b) => {
      const da = Math.min(Math.abs(phase - a.phase), 1 - Math.abs(phase - a.phase));
      const db = Math.min(Math.abs(phase - b.phase), 1 - Math.abs(phase - b.phase));
      return da - db;
    })[0];
  }

  function updateProgress(rawProgress, lab) {
    if (typeof document === "undefined") return;
    const visualPhase = Math.max(0, Math.min(1, Number(rawProgress) / 100));
    const phase = visualPhase === 1 ? 0 : visualPhase;
    const result = calculateFromPhase(phase, lab.facts);
    const point = orbitPoint(phase);
    const axis = axisLine(point);
    const speed = speedArrow(phase, result.speed_km_s);
    const earth = document.querySelector("#orbit-earth-marker .orbit-earth");
    const axisElement = document.querySelector("#orbit-axis-line");
    const dateLabel = document.querySelector("#orbit-earth-date");
    const distanceLine = document.querySelector("#orbit-distance-line");
    const speedVector = document.querySelector("#orbit-speed-vector");
    const trail = document.querySelector("#orbit-time-trail");
    const progressLabel = document.querySelector("#orbit-progress-label");
    if (earth) { earth.setAttribute("cx", String(point.x)); earth.setAttribute("cy", String(point.y)); }
    if (axisElement) { axisElement.setAttribute("x1", String(axis.x1)); axisElement.setAttribute("y1", String(axis.y1)); axisElement.setAttribute("x2", String(axis.x2)); axisElement.setAttribute("y2", String(axis.y2)); }
    if (dateLabel) { dateLabel.setAttribute("x", String(point.x)); dateLabel.setAttribute("y", String(dateLabelY(point))); }
    if (distanceLine) { distanceLine.setAttribute("x2", String(point.x)); distanceLine.setAttribute("y2", String(point.y)); }
    if (speedVector) { speedVector.setAttribute("x1", String(speed.x1)); speedVector.setAttribute("y1", String(speed.y1)); speedVector.setAttribute("x2", String(speed.x2)); speedVector.setAttribute("y2", String(speed.y2)); }
    if (trail) trail.setAttribute("points", trailPoints(phase));
    const checkpoint = nearestCheckpoint(lab, phase);
    if (dateLabel) dateLabel.textContent = `${checkpoint?.name || "周年位置"}附近`;
    if (progressLabel) progressLabel.textContent = `${checkpoint?.name || "周年位置"}附近 · ${result.distance_state} · ${result.distance_million_km}百万千米 · ${result.speed_km_s} km/s`;
  }

  coach.features.orbitSpeed = Object.freeze({ calculate, calculateFromPhase, orbitPoint, trailPoints, renderLab, renderResult, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
