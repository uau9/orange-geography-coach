(function registerAtmosphereReasoningFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  function calculate(scenario) { return { ...scenario.answers }; }

  function circulationModel(scenario) {
    const shift = scenario.season === "north-summer" ? -12 : scenario.season === "north-winter" ? 12 : 0;
    const targetY = 205 - (scenario.target_latitude / 90) * 165 + shift;
    const bands = [
      [40 + shift, "极地高压带"], [95 + shift, "副极地低压带"], [150 + shift, "副热带高压带"], [205 + shift, "赤道低压带"],
      [260 + shift, "副热带高压带"], [315 + shift, "副极地低压带"], [370 + shift, "极地高压带"]
    ];
    const bandSvg = bands.map(([y, label], index) => `<g><rect class="circulation-band ${label.includes("低压") ? "low" : "high"}" x="66" y="${y - 12}" width="288" height="24" rx="12"/><text x="210" y="${y + 5}" text-anchor="middle">${label}</text>${index < bands.length - 1 ? `<path class="circulation-wind" d="M${index % 2 ? 310 : 110} ${y + 20}L${index % 2 ? 120 : 300} ${bands[index + 1][0] - 20}" marker-end="url(#atmo-arrow)"/>` : ""}</g>`).join("");
    const vertical = scenario.answers.vertical_motion === "上升" ? `M378 ${targetY + 34}V${targetY - 34}` : `M378 ${targetY - 34}V${targetY + 34}`;
    return `<svg class="weather-system-model atmosphere-model" viewBox="0 0 420 410" role="img" aria-label="全球气压带风带与${esc(scenario.name)}目标位置示意"><defs><marker id="atmo-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="weather-sky" width="420" height="410" rx="18"/>${bandSvg}<line class="atmosphere-equator" x1="44" y1="205" x2="376" y2="205"/><text class="weather-note" x="38" y="211">0°</text><line class="atmosphere-target" x1="48" y1="${targetY}" x2="372" y2="${targetY}"/><circle class="atmosphere-target-dot" cx="52" cy="${targetY}" r="8"/><path class="vertical-arrow" d="${vertical}" marker-end="url(#atmo-arrow)"/><text class="weather-label" x="374" y="${targetY - 44}" text-anchor="middle">${esc(scenario.answers.vertical_motion)}</text><text class="weather-note" x="210" y="398" text-anchor="middle">${esc(scenario.answers.seasonal_position)} · 目标纬度约 ${Math.abs(scenario.target_latitude)}°${scenario.target_latitude > 0 ? "N" : ""}</text></svg>`;
  }

  function monsoonModel(scenario) {
    const winter = scenario.season_key === "winter";
    const eastAsia = scenario.region === "east-asia";
    const markerId = `monsoon-arrow-${scenario.id.toLowerCase()}`;
    const continentPressure = winter ? "高" : "低";
    const oceanPressure = winter ? "低" : "高";
    const path = eastAsia
      ? (winter ? "M230 115Q300 130 360 190" : "M360 210Q300 160 230 135")
      : (winter ? "M220 130Q190 205 155 270" : "M115 300Q145 220 220 145");
    return `<svg class="weather-system-model atmosphere-model monsoon-model" viewBox="0 0 420 340" role="img" aria-label="${esc(scenario.name)}亚洲大陆与海洋气压中心和风向示意"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="monsoon-ocean" width="420" height="340" rx="18"/><path class="monsoon-land" d="M45 35H294L330 80L295 120L245 132L220 185L165 210L105 175L70 115Z"/><text class="weather-label" x="155" y="72">亚洲大陆</text><text class="weather-note" x="345" y="78">太平洋</text><text class="weather-note" x="150" y="310">印度洋</text><circle class="pressure-center ${winter ? "high" : "low"}" cx="195" cy="120" r="34"/><text class="pressure-letter" x="195" y="132" text-anchor="middle">${continentPressure}</text><circle class="pressure-center ${winter ? "low" : "high"}" cx="350" cy="175" r="30"/><text class="pressure-letter" x="350" y="186" text-anchor="middle">${oceanPressure}</text><path class="monsoon-flow" d="${path}" marker-end="url(#${markerId})"/><text class="weather-label" x="210" y="270" text-anchor="middle">${esc(scenario.answers.regional_wind)}</text><text class="weather-note" x="210" y="326" text-anchor="middle">${esc(scenario.answers.season)} · ${esc(scenario.region === "east-asia" ? "东亚" : "南亚")}</text></svg>`;
  }

  function climateControlModel(scenario) {
    const markerId = `climate-arrow-${scenario.id.toLowerCase()}`;
    const rising = scenario.mode === "rising";
    const sinking = scenario.mode === "sinking";
    const oceanWind = scenario.mode === "ocean-wind";
    const alternating = scenario.mode === "alternating";
    const monsoon = scenario.mode === "monsoon";
    const migrating = scenario.mode === "migrating";
    const wet = ["all-year-wet", "even-wet", "winter-wet", "summer-wet", "wet-dry"].includes(scenario.season_key);
    const verticalPath = rising ? "M210 250V105" : "M210 105V250";
    const flowPath = oceanWind ? "M40 205Q135 165 230 185" : monsoon ? "M380 230Q300 170 225 185" : alternating ? "M42 220Q125 170 205 185" : migrating ? "M90 165Q210 105 330 165" : "";
    const rainDrops = wet ? [120, 160, 200, 240, 280].map((x, i) => `<path d="M${x} 118l-7 14a8 8 0 0 0 14 0Z" fill="#38bdf8" opacity="${0.62 + i * 0.07}"/>`).join("") : "";
    return `<svg class="weather-system-model atmosphere-model climate-control-model" viewBox="0 0 420 340" role="img" aria-label="${esc(scenario.name)}气压带风带控制气候示意"><defs><linearGradient id="climate-sky-${scenario.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff4ff"/><stop offset="1" stop-color="${wet ? "#eafaf3" : "#fff0d6"}"/></linearGradient><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#0f5d78"/></marker></defs><rect width="420" height="340" rx="18" fill="url(#climate-sky-${scenario.id})"/><path d="M20 270Q105 245 190 267T400 258V330H20Z" fill="${wet ? "#79c98f" : "#e4bb6d"}" opacity=".9"/><text class="weather-label" x="24" y="34">${esc(scenario.latitude_label)}</text><text class="weather-note" x="396" y="34" text-anchor="end">${esc(scenario.context)}</text>${rising || sinking ? `<path d="${verticalPath}" stroke="#0f5d78" stroke-width="7" fill="none" marker-end="url(#${markerId})"/><circle cx="210" cy="270" r="34" fill="${rising ? "#f97316" : "#2563eb"}" opacity=".18"/><text class="weather-label" x="210" y="282" text-anchor="middle">${rising ? "低压" : "高压"}</text>` : ""}${flowPath ? `<path d="${flowPath}" stroke="#0f5d78" stroke-width="7" fill="none" marker-end="url(#${markerId})"/><text class="weather-label" x="210" y="150" text-anchor="middle">${alternating ? "冬夏控制系统交替" : monsoon ? "海陆风向季节转换" : migrating ? "雨带南北移动" : "海洋西风输入"}</text>` : ""}${rainDrops}<text class="weather-label" x="210" y="308" text-anchor="middle">${esc(scenario.answers.precipitation)}</text><text class="weather-note" x="210" y="330" text-anchor="middle">先读控制系统，再判断气流和水汽</text></svg>`;
  }

  function climateGraphModel(scenario) {
    const temperatures = scenario.monthly_temperature || [];
    const precipitation = scenario.monthly_precipitation || [];
    const maxPrecip = Math.max(300, ...precipitation);
    const graphLeft = 48;
    const graphTop = 52;
    const graphWidth = 336;
    const graphHeight = 220;
    const step = graphWidth / 12;
    const bars = precipitation.map((value, index) => {
      const h = Math.max(1, (value / maxPrecip) * graphHeight);
      const x = graphLeft + index * step + 4;
      return `<rect x="${x.toFixed(1)}" y="${(graphTop + graphHeight - h).toFixed(1)}" width="${Math.max(8, step - 8).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="#38bdf8" opacity=".8"/>`;
    }).join("");
    const tempMin = -10;
    const tempMax = 35;
    const points = temperatures.map((value, index) => {
      const x = graphLeft + (index + 0.5) * step;
      const y = graphTop + graphHeight - ((value - tempMin) / (tempMax - tempMin)) * graphHeight;
      return `${x.toFixed(1)},${Math.max(graphTop, Math.min(graphTop + graphHeight, y)).toFixed(1)}`;
    }).join(" ");
    const monthLabels = [1, 4, 7, 10, 12].map((month) => `<text x="${(graphLeft + (month - 0.5) * step).toFixed(1)}" y="292" text-anchor="middle" font-size="12" fill="#52636e">${month}</text>`).join("");
    return `<svg class="weather-system-model atmosphere-model climate-graph-model" viewBox="0 0 420 330" role="img" aria-label="${esc(scenario.name)}月均气温曲线和降水柱状图"><rect width="420" height="330" rx="18" fill="#f7fbff"/><text class="weather-label" x="24" y="30">${esc(scenario.city || scenario.name)}</text><text x="396" y="30" text-anchor="end" font-size="13" fill="#52636e">气温折线 · 降水柱</text>${[0, .25, .5, .75, 1].map((ratio) => `<line x1="${graphLeft}" y1="${graphTop + graphHeight * ratio}" x2="${graphLeft + graphWidth}" y2="${graphTop + graphHeight * ratio}" stroke="#d6e4ec" stroke-width="1"/>`).join("")}${bars}<polyline points="${points}" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${points.split(" ").map((point) => { const [x, y] = point.split(","); return `<circle cx="${x}" cy="${y}" r="3.5" fill="#f97316"/>`; }).join("")}<line x1="${graphLeft}" y1="${graphTop + graphHeight}" x2="${graphLeft + graphWidth}" y2="${graphTop + graphHeight}" stroke="#52636e" stroke-width="2"/>${monthLabels}<text x="24" y="64" font-size="12" fill="#f97316">℃</text><text x="396" y="64" text-anchor="end" font-size="12" fill="#0284c7">mm</text><text x="210" y="318" text-anchor="middle" font-size="13" fill="#52636e">月份 · 先找最热月与降水集中期</text></svg>`;
  }

  function orographicRainModel(scenario) {
    const markerId = `oro-arrow-${scenario.id.toLowerCase()}`;
    const fromEast = scenario.flow === "east-to-west";
    const variable = scenario.flow === "variable";
    const highMoisture = scenario.moisture === "high";
    const startX = fromEast ? 390 : 30;
    const endX = fromEast ? 230 : 190;
    const arrow = variable ? "M45 155Q150 95 210 145M375 155Q285 105 220 145" : `M${startX} 150Q${fromEast ? 310 : 110} 105 ${endX} 150`;
    const drops = highMoisture ? [0, 1, 2, 3].map((index) => `<path d="M${(fromEast ? 278 : 118) + index * 18} ${160 + index % 2 * 8}l-6 13a7 7 0 0 0 12 0Z" fill="#38bdf8"/>`).join("") : "";
    return `<svg class="weather-system-model atmosphere-model orographic-model" viewBox="0 0 420 330" role="img" aria-label="${esc(scenario.name)}水汽、迎风坡抬升和雨影示意"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#0f5d78"/></marker></defs><rect width="420" height="330" rx="18" fill="#eaf7ff"/><rect y="255" width="420" height="75" fill="#e7c989"/><path d="M95 255L210 78L330 255Z" fill="#8fa2ad"/><path d="M145 178L210 78L267 168Q220 153 185 170Z" fill="#f8fafc"/><path d="${arrow}" fill="none" stroke="#0f5d78" stroke-width="7" stroke-linecap="round" marker-end="url(#${markerId})" opacity="${variable ? .65 : 1}"/><ellipse cx="${fromEast ? 310 : 110}" cy="140" rx="48" ry="22" fill="${highMoisture ? "#cbd5e1" : "#eef2f7"}"/><text class="weather-note" x="${fromEast ? 310 : 110}" y="145" text-anchor="middle">${esc(scenario.answers.moisture_source)}</text>${drops}<path d="M${fromEast ? 165 : 255} 178Q${fromEast ? 120 : 300} 205 ${fromEast ? 72 : 348} 230" fill="none" stroke="#f97316" stroke-width="5" stroke-dasharray="7 7"/><text class="weather-label" x="210" y="40" text-anchor="middle">迎风抬升 → 冷却凝结 → 背风下沉</text><text class="weather-note" x="108" y="292" text-anchor="middle">西侧</text><text class="weather-note" x="312" y="292" text-anchor="middle">东侧</text><text class="weather-label" x="210" y="316" text-anchor="middle">${esc(variable ? "来流变化大：结论需长期证据" : `目标区：${scenario.target === "east" ? "东坡" : "西坡"}`)}</text></svg>`;
  }

  function model(lab, scenario) {
    if (lab.visual_type === "monsoon") return monsoonModel(scenario);
    if (lab.visual_type === "climate-control") return climateControlModel(scenario);
    if (lab.visual_type === "climate-graph") return climateGraphModel(scenario);
    if (lab.visual_type === "orographic-rain") return orographicRainModel(scenario);
    return circulationModel(scenario);
  }

  function radioGroup(name, values) {
    return `<div class="weather-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function resultRow(label, actual, expected, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(actual || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(expected)}`}</small></div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    const sectionLabel = lab.section_id?.endsWith("s03") ? "第三章第三节" : "第三章第二节";
    const fields = lab.questions.map((question, index) => `<fieldset><legend>${index + 1}. ${esc(question.label)}：</legend>${radioGroup(`atmosphere-${question.key}`, question.choices)}</fieldset>`).join("");
    return `<div class="topic-meta">选择性必修1 · ${sectionLabel} · ${esc(scenario.id)}</div><h2 class="page-title">${esc(lab.title)}</h2><p class="page-subtitle">${esc(lab.subtitle)}</p><section class="weather-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.name)}</strong></div><div><span>判断背景</span><strong>${esc(scenario.context)}</strong></div></section><section class="card weather-system-card"><div class="weather-system-layout"><div><div class="solar-model-head"><div><span class="pill orange">连续模型</span><h3>${esc(scenario.name)}</h3></div><span class="pill">图示默认可见</span></div>${model(lab, scenario)}<p class="motion-hint">${esc(lab.model_note)}</p></div><form id="atmosphere-reasoning-form" class="weather-prediction-panel"><div class="notice">五项判断需完成；判断链选填，留空也能提交。</div>${fields}<label class="field-label" for="atmosphere-reasoning">判断链（选填）</label><textarea id="atmosphere-reasoning" name="atmosphere-reasoning" placeholder="可选：控制系统 → 气流或水汽 → 降水季节 → 气候或工程结论。"></textarea><button class="btn orange motion-submit" type="submit">提交五步判断</button></form></div></section>`;
  }

  function renderResult({ lab, scenario, attempt }) {
    const sectionLabel = lab.section_id?.endsWith("s03") ? "第三章第三节" : "第三章第二节";
    const rows = lab.questions.map((question) => resultRow(question.label, attempt.answers[question.key], attempt.correct_answers[question.key], attempt.checks[question.key])).join("");
    return `<div class="topic-meta">${sectionLabel} · 已形成候选诊断</div><h2 class="page-title">把大气环流连成因果链</h2><p class="page-subtitle">本轮 ${attempt.score}/${lab.questions.length}。一次满分仍需家长确认和${lab.review_after_hours || 48}小时后的换情境复测。</p><section class="card weather-system-card"><div class="weather-system-layout"><div>${model(lab, scenario)}</div><div><div class="lab-check-grid">${rows}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${esc(attempt.reasoning || "未填写（选填）")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长换情境追问，确认橙子能从证据重新推导，而不是记住结论。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-atmosphere-scenario">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  coach.features.atmosphereReasoning = Object.freeze({ calculate, model, renderLab, renderResult });
})(typeof window !== "undefined" ? window : globalThis);
