(function registerRotationSpeedFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function round(value, digits = 0) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function latitudeLabel(latitude) {
    const value = Number(latitude);
    if (Math.abs(value) < 0.05) return "赤道（0°）";
    return `${Math.abs(value)}°${value > 0 ? "N" : "S"}`;
  }

  function calculate(place, durationHours, facts = {}) {
    const latitude = Number(place.latitude);
    const duration = Number(durationHours);
    const cosine = Math.cos(Math.abs(latitude) * Math.PI / 180);
    const exactSpeed = (facts.equator_speed_km_h || 1670) * cosine;
    const exactCircumference = (facts.equator_circumference_km || 40075) * cosine;
    const angularSpeed = facts.angular_speed_deg_h || 15;
    return {
      angular_speed: `约${angularSpeed}°/小时`,
      angular_speed_value: angularSpeed,
      line_speed_relation: Math.abs(latitude) < 0.05 ? "与赤道相同" : "小于赤道",
      line_speed_km_h: Math.round(exactSpeed / 10) * 10,
      line_speed_exact: round(exactSpeed),
      latitude_circle_km: Math.round(exactCircumference / 10) * 10,
      rotated_angle_deg: duration * angularSpeed,
      distance_km: Math.round(exactSpeed * duration / 50) * 50,
      distance_exact: round(exactSpeed * duration),
      duration_hours: duration
    };
  }

  function geometry(place, hours = 0) {
    const latitude = Number(place.latitude);
    const centerX = 360;
    const centerY = 202;
    const globeRadius = 158;
    const latitudeRadius = globeRadius * Math.cos(Math.abs(latitude) * Math.PI / 180);
    const latitudeY = centerY - latitude / 90 * 137;
    const ellipseYRadius = Math.max(5, latitudeRadius * 0.19);
    const theta = -Math.PI + Number(hours) / 24 * Math.PI * 2;
    return {
      centerX, centerY, globeRadius, latitudeRadius, latitudeY, ellipseYRadius, theta,
      pointX: centerX + latitudeRadius * Math.cos(theta),
      pointY: latitudeY + ellipseYRadius * Math.sin(theta)
    };
  }

  function progressPath(place, hours) {
    const g = geometry(place, hours);
    const steps = Math.max(2, Math.ceil(Number(hours) * 4));
    return Array.from({ length: steps + 1 }, (_, index) => {
      const theta = -Math.PI + Number(hours) / 24 * Math.PI * 2 * index / steps;
      return `${round(g.centerX + g.latitudeRadius * Math.cos(theta), 1)},${round(g.latitudeY + g.ellipseYRadius * Math.sin(theta), 1)}`;
    }).join(" ");
  }

  function dynamicLayer(place, hours, facts) {
    const g = geometry(place, hours);
    const result = calculate(place, hours, facts);
    const dx = -Math.sin(g.theta);
    const dy = Math.cos(g.theta) * 0.19;
    const magnitude = Math.hypot(dx, dy) || 1;
    const arrowLength = 58;
    return `<polyline class="rotation-progress-arc" points="${progressPath(place, hours)}"/>
      <line class="rotation-speed-vector" x1="${round(g.pointX, 1)}" y1="${round(g.pointY, 1)}" x2="${round(g.pointX + dx / magnitude * arrowLength, 1)}" y2="${round(g.pointY + dy / magnitude * arrowLength, 1)}" marker-end="url(#rotation-arrow)"/>
      <circle class="rotation-moving-point" cx="${round(g.pointX, 1)}" cy="${round(g.pointY, 1)}" r="9"/>
      <g class="rotation-answer-band"><rect x="128" y="366" width="464" height="32" rx="16"/><text id="rotation-progress-label" x="360" y="387" text-anchor="middle">${round(Number(hours), 1)}小时 · ${result.rotated_angle_deg}° · 约${result.distance_exact}千米</text></g>`;
  }

  function renderModel(place, result = null, hours = 0, facts = {}) {
    const g = geometry(place, 0);
    const basePoint = geometry(place, 0);
    return `<svg class="rotation-speed-svg" viewBox="0 0 720 420" role="img" aria-label="地球自转角速度与线速度纬度模型">
      <defs><radialGradient id="rotation-earth-gradient"><stop offset="0" stop-color="#8ed0d7"/><stop offset="1" stop-color="#397c94"/></radialGradient><marker id="rotation-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#d65f4b"/></marker></defs>
      <rect class="rotation-bg" width="720" height="420" rx="24"/>
      <circle class="rotation-earth-disc" cx="360" cy="202" r="158"/>
      <ellipse class="rotation-equator" cx="360" cy="202" rx="158" ry="30"/>
      <line class="rotation-axis" x1="360" y1="20" x2="360" y2="384"/>
      <text class="rotation-pole-label" x="374" y="35">北极</text><text class="rotation-pole-label" x="374" y="378">南极</text>
      <ellipse class="rotation-latitude-ring" cx="360" cy="${round(g.latitudeY, 1)}" rx="${round(g.latitudeRadius, 1)}" ry="${round(g.ellipseYRadius, 1)}"/>
      <line class="rotation-latitude-guide" x1="${round(360 - g.latitudeRadius, 1)}" y1="${round(g.latitudeY, 1)}" x2="${round(360 + g.latitudeRadius, 1)}" y2="${round(g.latitudeY, 1)}"/>
      <text class="rotation-place-label" x="${round(Math.max(88, 360 - g.latitudeRadius), 1)}" y="${round(g.latitudeY - 15, 1)}">${escapeHtml(place.name)} · ${latitudeLabel(place.latitude)}</text>
      <g id="rotation-dynamic-layer">${result ? dynamicLayer(place, hours, facts) : `<circle class="rotation-base-point" cx="${round(basePoint.pointX, 1)}" cy="${round(basePoint.pointY, 1)}" r="9"/><g class="rotation-lock"><rect x="203" y="352" width="314" height="38" rx="19"/><text x="360" y="376" text-anchor="middle">速度箭头、数值与运动弧长提交后显示</text></g>`}</g>
      <text class="rotation-equator-label" x="525" y="197">赤道</text>
    </svg>`;
  }

  function renderChoice(name, values) {
    return `<div class="rotation-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"/><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, place, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(scenario.id)}</div>
      <h2 class="page-title">地球自转速度实验室</h2>
      <p class="page-subtitle">同一时刻，所有非极点转过的角度相同，但不同纬度沿纬线圈走过的距离不同。先预测，再用具体数值检验。</p>
      <section class="rotation-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${escapeHtml(place.name)} · ${latitudeLabel(place.latitude)}</strong></div><div><span>观察时段</span><strong>${scenario.duration_hours}小时</strong></div></section>
      <section class="card rotation-speed-card"><div class="rotation-speed-layout">
        <div class="rotation-model-panel"><div class="solar-model-head"><div><span class="pill orange">纬度剖面</span><h3>${escapeHtml(place.name)}所在纬线圈</h3></div><span class="pill">24小时理想模型</span></div>${renderModel(place, calculate(place, scenario.duration_hours, lab.facts), scenario.duration_hours, lab.facts)}<p class="motion-hint">${escapeHtml(lab.model_note)} 纬线圈的横向大小按cos纬度绘制；答案数值默认可见。</p></div>
        <form id="rotation-speed-form" class="rotation-prediction-panel">
          <div class="notice">判断链：自转周期 → 角速度；纬度 → 纬线圈大小 → 线速度；最后用“速度×时间”得到运动距离。</div>
          <fieldset><legend>1. ${escapeHtml(place.name)}的自转角速度：</legend>${renderChoice("rotation-angular-speed", lab.choices.angular_speed)}</fieldset>
          <fieldset><legend>2. 与赤道相比，该地线速度：</legend>${renderChoice("rotation-line-relation", lab.choices.line_speed_relation)}</fieldset>
          <fieldset><legend>3. 该地线速度约为：</legend><output id="rotation-line-output" class="rotation-range-output">1000 km/h</output><input id="rotation-line-prediction" name="rotation-line-speed" type="range" min="0" max="1700" step="10" value="1000" aria-label="预测自转线速度"/></fieldset>
          <fieldset><legend>4. ${scenario.duration_hours}小时转过的角度：</legend><output id="rotation-angle-output" class="rotation-range-output">90°</output><input id="rotation-angle-prediction" name="rotation-angle" type="range" min="0" max="180" step="15" value="90" aria-label="预测转过角度"/></fieldset>
          <fieldset><legend>5. ${scenario.duration_hours}小时沿纬线走过约：</legend><output id="rotation-distance-output" class="rotation-range-output">6000 km</output><input id="rotation-distance-prediction" name="rotation-distance" type="range" min="0" max="14000" step="50" value="6000" aria-label="预测纬线运动距离"/></fieldset>
          <label class="field-label" for="rotation-reasoning">判断链（选填）</label><textarea id="rotation-reasoning" name="rotation-reasoning" placeholder="例如：24小时转360°，所以角速度15°/h；该纬度的纬线圈比赤道短，线速度按1670×cos纬度估算；再乘观察时长得到弧长。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交五步预测</button>
        </form>
      </div></section>`;
  }

  function answerRow(label, userAnswer, correctAnswer, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer ?? "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
  }

  function renderResult({ lab, place, scenario, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks || {};
    return `<div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
      <h2 class="page-title">角速度相同，不等于线速度相同</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/5。拖动24小时，观察同样角度下纬线弧长如何由纬度圈大小决定。</p>
      <section class="card rotation-speed-card"><div class="rotation-result-layout">
        <div>${renderModel(place, correct, scenario.duration_hours, lab.facts)}<label class="rotation-progress-caption" for="rotation-progress"><span>0小时</span><strong>拖动自转一天</strong><span>24小时</span></label><input id="rotation-progress" class="rotation-progress-slider" type="range" min="0" max="24" step="0.5" value="${scenario.duration_hours}" aria-label="拖动自转24小时"/><p class="motion-hint">橙色弧线表示从起点沿该纬线走过的路程；红色箭头表示线速度方向。不同纬度24小时都转一周，但纬线圈周长不同。</p></div>
        <div><div class="lab-check-grid">${answerRow("角速度", attempt.answers.angular_speed, correct.angular_speed, checks.angular_speed)}${answerRow("与赤道比较", attempt.answers.line_speed_relation, correct.line_speed_relation, checks.line_speed_relation)}${answerRow("线速度", `${attempt.answers.line_speed_km_h} km/h`, `${correct.line_speed_km_h} km/h`, checks.line_speed_km_h)}${answerRow(`${scenario.duration_hours}小时角度`, `${attempt.answers.rotated_angle_deg}°`, `${correct.rotated_angle_deg}°`, checks.rotated_angle_deg)}${answerRow(`${scenario.duration_hours}小时距离`, `${attempt.answers.distance_km} km`, `${correct.distance_km} km`, checks.distance_km)}</div>
          <div class="rotation-fact-strip"><div><span>纬线圈周长</span><strong>约${correct.latitude_circle_km}</strong><small>km</small></div><div><span>精算线速度</span><strong>${correct.line_speed_exact}</strong><small>km/h</small></div><div><span>观察时段弧长</span><strong>${correct.distance_exact}</strong><small>km</small></div></div>
          <div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${escapeHtml(place.name)} · ${latitudeLabel(place.latitude)}</strong><br/>24小时同样转360°，因此角速度约15°/小时；但纬线圈周长约为赤道的cos${Math.abs(place.latitude)}°倍，所以线速度约${correct.line_speed_exact} km/h。</div>
          <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长追问：把地点换到南半球同纬度，角速度和线速度大小是否改变？为什么？</div>`}
          <div class="btn-row"><button class="btn orange" data-action="next-rotation-speed">换纬度继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
        </div>
      </div></section>`;
  }

  function setOutput(selector, text) {
    if (typeof document === "undefined") return;
    const output = document.querySelector(selector);
    if (output) output.textContent = text;
  }

  function updateLinePrediction(value) { setOutput("#rotation-line-output", `${Number(value)} km/h`); }
  function updateAnglePrediction(value) { setOutput("#rotation-angle-output", `${Number(value)}°`); }
  function updateDistancePrediction(value) { setOutput("#rotation-distance-output", `${Number(value)} km`); }

  function updateProgress(value, place, facts) {
    if (typeof document === "undefined" || !place) return;
    const layer = document.querySelector("#rotation-dynamic-layer");
    if (layer) layer.innerHTML = dynamicLayer(place, Number(value), facts);
  }

  coach.features.rotationSpeed = Object.freeze({ calculate, geometry, progressPath, renderLab, renderResult, updateLinePrediction, updateAnglePrediction, updateDistancePrediction, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
