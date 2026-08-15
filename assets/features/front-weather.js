(function registerFrontWeatherFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  function calculate(scenario) { return { ...scenario.answers }; }

  function rain(x, width = 76) {
    return `<g class="front-rain" aria-label="降水区"><path d="M${x} 105c12-18 36-13 39 5 16-7 32 4 30 19H${x - 6}c-2-12 6-21 17-24Z"/><path d="M${x + 2} 140l-8 18m28-18-8 18m28-18-8 18m28-18-8 18"/><text x="${x + width / 2 - 4}" y="184" text-anchor="middle">降水区</text></g>`;
  }

  function model(scenario) {
    const type = scenario.front_type;
    if (type === "冷锋") {
      return `<svg class="weather-system-model" viewBox="0 0 420 280" role="img" aria-label="冷锋剖面与降水位置示意"><defs><marker id="front-cold-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="front-warm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="weather-sky" width="420" height="280" rx="18"/><path class="weather-ground" d="M18 236H402"/><path class="front-cold-mass" d="M18 236V129C78 128 145 153 238 236Z"/><path class="front-warm-mass" d="M238 236L302 57H402V236Z"/><path class="front-boundary" d="M238 236L302 57"/><path class="front-cold-motion" d="M75 198H171" marker-end="url(#front-cold-arrow)"/><path class="front-warm-motion" d="M267 194Q292 130 308 91" marker-end="url(#front-warm-arrow)"/>${rain(202)}<text class="weather-label" x="82" y="184">冷气团主动推进</text><text class="weather-label" x="323" y="84">暖气团</text><text class="weather-label" x="267" y="226">锋线</text><text class="weather-note" x="210" y="264" text-anchor="middle">陡坡 · 暖空气快速抬升 · 降水多在锋后附近</text></svg>`;
    }
    if (type === "暖锋") {
      return `<svg class="weather-system-model" viewBox="0 0 420 280" role="img" aria-label="暖锋剖面与降水位置示意"><defs><marker id="front-warm-main" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="weather-sky" width="420" height="280" rx="18"/><path class="weather-ground" d="M18 236H402"/><path class="front-cold-mass" d="M244 236Q304 151 402 139V236Z"/><path class="front-warm-mass" d="M18 236V73H90Q172 116 244 236Z"/><path class="front-boundary" d="M244 236Q304 151 402 139"/><path class="front-warm-motion" d="M96 201Q207 153 306 143" marker-end="url(#front-warm-main)"/>${rain(302, 84)}<text class="weather-label" x="83" y="185">暖气团主动推进</text><text class="weather-label" x="329" y="218">冷气团</text><text class="weather-label" x="245" y="226">锋线</text><text class="weather-note" x="210" y="264" text-anchor="middle">缓坡 · 暖空气徐徐爬升 · 降水多在锋前</text></svg>`;
    }
    return `<svg class="weather-system-model" viewBox="0 0 420 280" role="img" aria-label="准静止锋剖面与持续降水示意"><defs><marker id="front-still-left" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker><marker id="front-still-right" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="weather-sky" width="420" height="280" rx="18"/><path class="weather-ground" d="M18 236H402"/><path class="front-warm-mass" d="M18 236V80H82Q182 128 223 236Z"/><path class="front-cold-mass" d="M223 236Q282 153 402 146V236Z"/><path class="front-boundary" d="M223 236Q282 153 402 146"/><path class="front-warm-motion" d="M114 207H184" marker-end="url(#front-still-right)"/><path class="front-cold-motion reverse" d="M330 211H258" marker-end="url(#front-still-left)"/>${rain(231, 108)}<text class="weather-label" x="80" y="190">暖湿气团</text><text class="weather-label" x="332" y="213">冷气团</text><text class="weather-label" x="221" y="226">锋线</text><text class="weather-note" x="210" y="264" text-anchor="middle">势力相当或受地形阻挡 · 锋线少动 · 阴雨持续</text></svg>`;
  }

  function radioGroup(name, values) {
    return `<div class="weather-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function resultRow(label, actual, expected, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(actual || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(expected)}`}</small></div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">选择性必修1 · 第三章第一节 · ${esc(scenario.id)}</div><h2 class="page-title">锋面结构与过境天气</h2><p class="page-subtitle">先看谁主动、暖空气怎样抬升，再判断降水位置和测站过境后的变化。</p><section class="weather-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.name)}</strong></div><div><span>天气背景</span><strong>${esc(scenario.context)}</strong></div></section><section class="card weather-system-card"><div class="weather-system-layout"><div><div class="solar-model-head"><div><span class="pill orange">剖面模型</span><h3>${esc(scenario.front_type)}结构</h3></div><span class="pill">图示默认可见</span></div>${model(scenario)}<p class="motion-hint">${esc(lab.model_note)}</p></div><form id="front-weather-form" class="weather-prediction-panel"><div class="notice">五项判断需完成；判断链选填，留空也能提交。</div><fieldset><legend>1. 锋面类型：</legend>${radioGroup("front-type", lab.choices.front_type)}</fieldset><fieldset><legend>2. 主动气团或停滞原因：</legend>${radioGroup("front-active", lab.choices.active_process)}</fieldset><fieldset><legend>3. 暖空气抬升方式：</legend>${radioGroup("front-uplift", lab.choices.uplift_style)}</fieldset><fieldset><legend>4. 主要降水位置：</legend>${radioGroup("front-precipitation", lab.choices.precipitation_zone)}</fieldset><fieldset><legend>5. 测站过境后或持续控制时：</legend>${radioGroup("front-weather", lab.choices.station_weather)}</fieldset><label class="field-label" for="front-reasoning">判断链（选填）</label><textarea id="front-reasoning" name="front-reasoning" placeholder="可选：谁主动 → 怎样抬升 → 雨落哪里 → 过境后谁控制。"></textarea><button class="btn orange motion-submit" type="submit">提交五步判断</button></form></div></section>`;
  }

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    return `<div class="topic-meta">第三章第一节 · 已形成候选诊断</div><h2 class="page-title">把锋面结构连成天气过程</h2><p class="page-subtitle">本轮 ${attempt.score}/5。图示可帮助复盘，但掌握仍需家长确认和48小时后的换锋型复测。</p><section class="card weather-system-card"><div class="weather-system-layout"><div>${model(scenario)}</div><div><div class="lab-check-grid">${resultRow("锋面类型", attempt.answers.front_type, correct.front_type, attempt.checks.front_type)}${resultRow("主动过程", attempt.answers.active_process, correct.active_process, attempt.checks.active_process)}${resultRow("抬升方式", attempt.answers.uplift_style, correct.uplift_style, attempt.checks.uplift_style)}${resultRow("降水位置", attempt.answers.precipitation_zone, correct.precipitation_zone, attempt.checks.precipitation_zone)}${resultRow("天气变化", attempt.answers.station_weather, correct.station_weather, attempt.checks.station_weather)}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${esc(attempt.reasoning || "未填写（选填）")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长遮住标题，要求只看主动气团和降水区反推锋面类型。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-front-weather">换锋型继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  coach.features.frontWeather = Object.freeze({ calculate, model, renderLab, renderResult });
})(typeof window !== "undefined" ? window : globalThis);
