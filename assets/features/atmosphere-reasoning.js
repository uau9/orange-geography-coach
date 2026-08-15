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

  function model(lab, scenario) {
    return lab.visual_type === "monsoon" ? monsoonModel(scenario) : circulationModel(scenario);
  }

  function radioGroup(name, values) {
    return `<div class="weather-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function resultRow(label, actual, expected, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(actual || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(expected)}`}</small></div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    const fields = lab.questions.map((question, index) => `<fieldset><legend>${index + 1}. ${esc(question.label)}：</legend>${radioGroup(`atmosphere-${question.key}`, question.choices)}</fieldset>`).join("");
    return `<div class="topic-meta">选择性必修1 · 第三章第二节 · ${esc(scenario.id)}</div><h2 class="page-title">${esc(lab.title)}</h2><p class="page-subtitle">${esc(lab.subtitle)}</p><section class="weather-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.name)}</strong></div><div><span>判断背景</span><strong>${esc(scenario.context)}</strong></div></section><section class="card weather-system-card"><div class="weather-system-layout"><div><div class="solar-model-head"><div><span class="pill orange">连续模型</span><h3>${esc(scenario.name)}</h3></div><span class="pill">图示默认可见</span></div>${model(lab, scenario)}<p class="motion-hint">${esc(lab.model_note)}</p></div><form id="atmosphere-reasoning-form" class="weather-prediction-panel"><div class="notice">五项判断需完成；判断链选填，留空也能提交。</div>${fields}<label class="field-label" for="atmosphere-reasoning">判断链（选填）</label><textarea id="atmosphere-reasoning" name="atmosphere-reasoning" placeholder="可选：热力差异 → 高低压 → 垂直运动 → 水平气流 → 季节变化。"></textarea><button class="btn orange motion-submit" type="submit">提交五步判断</button></form></div></section>`;
  }

  function renderResult({ lab, scenario, attempt }) {
    const rows = lab.questions.map((question) => resultRow(question.label, attempt.answers[question.key], attempt.correct_answers[question.key], attempt.checks[question.key])).join("");
    return `<div class="topic-meta">第三章第二节 · 已形成候选诊断</div><h2 class="page-title">把大气环流连成因果链</h2><p class="page-subtitle">本轮 ${attempt.score}/${lab.questions.length}。一次满分仍需家长确认和${lab.review_after_hours || 48}小时后的换情境复测。</p><section class="card weather-system-card"><div class="weather-system-layout"><div>${model(lab, scenario)}</div><div><div class="lab-check-grid">${rows}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${esc(attempt.reasoning || "未填写（选填）")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长换季节或换纬度追问，确认橙子能从成因重新推导。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-atmosphere-scenario">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  coach.features.atmosphereReasoning = Object.freeze({ calculate, model, renderLab, renderResult });
})(typeof window !== "undefined" ? window : globalThis);
