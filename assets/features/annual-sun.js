(function registerAnnualSunFeature(root) {
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

  function roundOne(value) { return Math.round(value * 10) / 10; }

  function latitudeLabel(latitude) {
    const value = roundOne(latitude);
    if (Math.abs(value) < 0.05) return "赤道（0°）";
    return `${Math.abs(value)}°${value > 0 ? "N" : "S"}`;
  }

  function calculateFromPhase(rawPhase, place) {
    const phase = normalizePhase(rawPhase);
    const declination = roundOne(23.5 * Math.sin(Math.PI * 2 * phase));
    const juneTurn = Math.abs(phase - 0.25) < 0.001;
    const decemberTurn = Math.abs(phase - 0.75) < 0.001;
    const movingNorth = Math.cos(Math.PI * 2 * phase) > 0;
    let migration = movingNorth ? "向北移动" : "向南移动";
    let northDayTrend = movingNorth ? "正在变长" : "正在变短";
    if (juneTurn) { migration = "北界折返向南"; northDayTrend = "达到最长后转短"; }
    if (decemberTurn) { migration = "南界折返向北"; northDayTrend = "达到最短后转长"; }

    const latitude = Number(place.latitude);
    const noonAltitude = roundOne(90 - Math.abs(latitude - declination));
    let altitudeTrend;
    if (juneTurn) altitudeTrend = latitude > 23.5 ? "达到最高后降低" : "达到最低后升高";
    else if (decemberTurn) altitudeTrend = latitude > 23.5 ? "达到最低后升高" : "达到最高后降低";
    else {
      const altitudeRisesWithNorthwardMotion = latitude > 23.5;
      const rising = movingNorth === altitudeRisesWithNorthwardMotion;
      altitudeTrend = rising ? "正在升高" : "正在降低";
    }
    return {
      phase,
      direct_latitude: declination,
      direct_label: latitudeLabel(declination),
      migration,
      north_day_trend: northDayTrend,
      noon_altitude: noonAltitude,
      altitude_trend: altitudeTrend
    };
  }

  function calculate(checkpoint, place) { return calculateFromPhase(checkpoint.phase, place); }
  function graphX(phase) { return 58 + phase * 604; }
  function graphY(latitude) { return 170 - latitude / 23.5 * 92; }

  function curvePoints() {
    return Array.from({ length: 101 }, (_, index) => {
      const phase = index / 100;
      const latitude = 23.5 * Math.sin(Math.PI * 2 * phase);
      return `${roundOne(graphX(phase))},${roundOne(graphY(latitude))}`;
    }).join(" ");
  }

  function migrationArrow(result) {
    const x = graphX(result.phase);
    const y = graphY(result.direct_latitude);
    const pointsNorth = ["向北移动", "南界折返向北"].includes(result.migration);
    const y1 = y + (pointsNorth ? 34 : -34);
    const y2 = y + (pointsNorth ? 7 : -7);
    return { x, y, y1, y2 };
  }

  function renderModel(checkpoint, place, result = null) {
    const selectedX = graphX(checkpoint.phase);
    const arrow = result ? migrationArrow(result) : null;
    return `
      <svg class="annual-sun-svg" viewBox="0 0 720 340" role="img" aria-label="太阳直射点周年回归曲线">
        <defs><marker id="annual-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#ed8a3b"/></marker></defs>
        <rect class="annual-bg" width="720" height="340" rx="24"/>
        <g class="annual-grid"><line x1="58" y1="78" x2="662" y2="78"/><line x1="58" y1="170" x2="662" y2="170"/><line x1="58" y1="262" x2="662" y2="262"/>${[0,.25,.5,.75,1].map((phase) => `<line x1="${graphX(phase)}" y1="52" x2="${graphX(phase)}" y2="286"/>`).join("")}</g>
        <g class="annual-axis-labels"><text x="46" y="82" text-anchor="end">23.5°N</text><text x="46" y="174" text-anchor="end">赤道</text><text x="46" y="266" text-anchor="end">23.5°S</text><text x="58" y="311" text-anchor="middle">春分</text><text x="209" y="311" text-anchor="middle">夏至</text><text x="360" y="311" text-anchor="middle">秋分</text><text x="511" y="311" text-anchor="middle">冬至</text><text x="662" y="311" text-anchor="middle">春分</text></g>
        <line class="annual-selected-date" x1="${roundOne(selectedX)}" y1="52" x2="${roundOne(selectedX)}" y2="286"/>
        <text class="annual-selected-label" x="${roundOne(selectedX)}" y="36" text-anchor="middle">${escapeHtml(checkpoint.name)}</text>
        ${result ? `<polyline class="annual-curve" points="${curvePoints()}"/><circle id="annual-moving-marker" class="annual-marker" cx="${roundOne(arrow.x)}" cy="${roundOne(arrow.y)}" r="9"/><line id="annual-migration-arrow" class="annual-arrow" x1="${roundOne(arrow.x)}" y1="${roundOne(arrow.y1)}" x2="${roundOne(arrow.x)}" y2="${roundOne(arrow.y2)}" marker-end="url(#annual-arrow)"/><g class="annual-answer-band"><rect x="188" y="315" width="344" height="25" rx="12"/><text id="annual-progress-label" x="360" y="332" text-anchor="middle">${escapeHtml(checkpoint.name)} · 直射${escapeHtml(result.direct_label)} · ${escapeHtml(result.migration)}</text></g>` : `<g class="annual-lock"><rect x="218" y="145" width="284" height="42" rx="21"/><text x="360" y="171" text-anchor="middle">回归曲线、纬度和移动方向提交后显示</text></g>`}
      </svg>`;
  }

  function renderChoice(name, values) {
    return `<div class="annual-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"/><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, checkpoint, place }) {
    return `
      <div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(checkpoint.id)}-${escapeHtml(place.id)}</div>
      <h2 class="page-title">太阳直射点周年回归实验室</h2>
      <p class="page-subtitle">不只背四个节气：在日期之间继续追踪直射点向哪移动、昼长和太阳高度怎样变化。</p>
      <div class="annual-date-tabs" aria-label="选择周年位置">${lab.checkpoints.map((item) => `<button class="${item.id === checkpoint.id ? "active" : ""}" data-action="set-annual-checkpoint" data-checkpoint-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.date_hint)}</small></button>`).join("")}</div>
      <section class="card annual-sun-card"><div class="annual-sun-layout">
        <div class="solar-model-panel">
          <div class="solar-model-head"><div><span class="pill orange">当前情境</span><h3>${escapeHtml(checkpoint.name)} · ${escapeHtml(place.name)}</h3></div><span class="pill">${escapeHtml(place.location_note)}</span></div>
          ${renderModel(checkpoint, place, calculate(checkpoint, place))}
          <p class="motion-hint">${escapeHtml(lab.model_note)} 选中的日期位置可以看见，回归曲线和答案默认可见。</p>
          <div class="annual-place-tabs" aria-label="选择正午太阳高度观察地">${lab.places.map((item) => `<button class="${item.id === place.id ? "active" : ""}" data-action="set-annual-place" data-place-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location_note)}</small></button>`).join("")}</div>
        </div>
        <form id="annual-sun-form" class="annual-prediction-panel">
          <div class="notice">先估纬度，再判断方向。二至日既是最北/最南位置，也是移动方向转折点。</div>
          <fieldset><legend>1. 太阳直射纬度约为：</legend><output id="annual-latitude-output" class="annual-latitude-output">赤道（0°）</output><input class="annual-latitude-slider" name="annual-direct-latitude" type="range" min="-23.5" max="23.5" step="0.5" value="0" aria-label="预测太阳直射纬度"/></fieldset>
          <fieldset><legend>2. 直射点此时正在：</legend>${renderChoice("annual-migration", lab.choices.migration)}</fieldset>
          <fieldset><legend>3. 北半球昼长：</legend>${renderChoice("annual-day-trend", lab.choices.north_day_trend)}</fieldset>
          <fieldset><legend>4. ${escapeHtml(place.name)}正午太阳高度：</legend>${renderChoice("annual-altitude-trend", lab.choices.altitude_trend)}</fieldset>
          <label class="field-label" for="annual-reasoning">判断链（选填）</label><textarea id="annual-reasoning" name="annual-reasoning" placeholder="例如：先把日期放在二分二至之间，估计直射纬度；再判断向北或向南；据此判断北半球昼长；最后结合目标地所在半球判断正午太阳高度趋势。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交预测</button>
        </form>
      </div></section>`;
  }

  function answerRow(label, userAnswer, correctAnswer, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
  }

  function renderResult({ lab, checkpoint, place, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks || {};
    return `
      <div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
      <h2 class="page-title">把四个节气连成一条周年曲线</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/4。拖动周年位置，观察纬度、移动方向和两类趋势怎样连续变化。</p>
      <section class="card annual-sun-card"><div class="annual-result-layout">
        <div>${renderModel(checkpoint, place, correct)}<label class="annual-progress-caption" for="annual-progress"><span>春分</span><strong>拖动一年</strong><span>次年春分</span></label><input id="annual-progress" class="annual-progress-slider" type="range" min="0" max="100" step="1" value="${checkpoint.phase * 100}" aria-label="太阳直射点周年位置"/><p class="motion-hint">曲线在南北回归线之间往返；二至日到达端点后立即改变移动方向。</p></div>
        <div><div class="lab-check-grid">${answerRow("直射纬度", latitudeLabel(attempt.answers.direct_latitude), correct.direct_label, checks.direct_latitude)}${answerRow("移动方向", attempt.answers.migration, correct.migration, checks.migration)}${answerRow("北半球昼长", attempt.answers.north_day_trend, correct.north_day_trend, checks.north_day_trend)}${answerRow(`${place.name}正午高度`, attempt.answers.altitude_trend, correct.altitude_trend, checks.altitude_trend)}</div>
          <div class="answer-box ${attempt.score === 4 ? "correct" : "wrong"}"><strong>${escapeHtml(checkpoint.name)} · ${escapeHtml(place.name)}</strong><br/>太阳直射${escapeHtml(correct.direct_label)}，直射点${escapeHtml(correct.migration)}；北半球昼长${escapeHtml(correct.north_day_trend)}。${escapeHtml(place.name)}正午太阳高度约${correct.noon_altitude}°，趋势为${escapeHtml(correct.altitude_trend)}。</div>
          <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">四步均正确。请家长追问：同样是太阳直射北半球，5月与8月的移动方向为什么相反？</div>`}
          <div class="btn-row"><button class="btn orange" data-action="next-annual-sun">换周年位置继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
        </div>
      </div></section>`;
  }

  function updatePrediction(rawLatitude) {
    if (typeof document === "undefined") return;
    const output = document.querySelector("#annual-latitude-output");
    if (output) output.textContent = latitudeLabel(Number(rawLatitude));
  }

  function nearestCheckpoint(lab, phase) {
    return [...(lab.checkpoints || [])].sort((a, b) => {
      const da = Math.min(Math.abs(phase - a.phase), 1 - Math.abs(phase - a.phase));
      const db = Math.min(Math.abs(phase - b.phase), 1 - Math.abs(phase - b.phase));
      return da - db;
    })[0];
  }

  function updateProgress(rawProgress, lab, place) {
    if (typeof document === "undefined") return;
    const phase = Math.max(0, Math.min(1, Number(rawProgress) / 100));
    const normalized = phase === 1 ? 0 : phase;
    const result = calculateFromPhase(normalized, place);
    const x = graphX(phase);
    const y = graphY(result.direct_latitude);
    const arrow = migrationArrow({ ...result, phase });
    const marker = document.querySelector("#annual-moving-marker");
    const line = document.querySelector("#annual-migration-arrow");
    const label = document.querySelector("#annual-progress-label");
    if (marker) { marker.setAttribute("cx", String(roundOne(x))); marker.setAttribute("cy", String(roundOne(y))); }
    if (line) { line.setAttribute("x1", String(roundOne(x))); line.setAttribute("x2", String(roundOne(x))); line.setAttribute("y1", String(roundOne(arrow.y1))); line.setAttribute("y2", String(roundOne(arrow.y2))); }
    if (label) {
      const checkpoint = nearestCheckpoint(lab, normalized);
      label.textContent = `${checkpoint?.name || "周年位置"}附近 · 直射${result.direct_label} · ${result.migration}`;
    }
  }

  coach.features.annualSun = Object.freeze({ calculate, calculateFromPhase, latitudeLabel, renderLab, renderResult, updatePrediction, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
