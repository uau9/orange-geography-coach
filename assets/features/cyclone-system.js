(function registerCycloneSystemFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  function calculate(scenario) { return { ...scenario.answers }; }

  function rotationPaths(clockwise, markerId) {
    const cw = ["M210 42A108 108 0 0 1 318 150", "M318 150A108 108 0 0 1 210 258", "M210 258A108 108 0 0 1 102 150", "M102 150A108 108 0 0 1 210 42"];
    const ccw = ["M210 42A108 108 0 0 0 102 150", "M102 150A108 108 0 0 0 210 258", "M210 258A108 108 0 0 0 318 150", "M318 150A108 108 0 0 0 210 42"];
    return (clockwise ? cw : ccw).map((d) => `<path class="cyclone-rotation" d="${d}" marker-end="url(#${markerId})"/>`).join("");
  }

  function radialPaths(inward, markerId) {
    const pairs = inward
      ? [[210, 18, 210, 111], [402, 150, 309, 150], [210, 282, 210, 189], [18, 150, 111, 150]]
      : [[210, 111, 210, 18], [309, 150, 402, 150], [210, 189, 210, 282], [111, 150, 18, 150]];
    return pairs.map(([x1, y1, x2, y2]) => `<path class="cyclone-radial" d="M${x1} ${y1}L${x2} ${y2}" marker-end="url(#${markerId})"/>`).join("");
  }

  function model(scenario) {
    const low = scenario.answers.pressure_center.startsWith("中心低");
    const inward = scenario.answers.surface_flow.includes("向中心");
    const clockwise = scenario.answers.rotation === "顺时针";
    const centerLabel = low ? "低" : "高";
    const pressureValues = low ? ["1000", "1005", "1010"] : ["1020", "1015", "1010"];
    const markerId = `cyclone-arrow-${scenario.id.toLowerCase()}`;
    return `<svg class="weather-system-model cyclone-model" viewBox="0 0 420 310" role="img" aria-label="${esc(scenario.name)}近地面气流和中心天气示意"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs><rect class="weather-sky" width="420" height="310" rx="18"/><circle class="isobar" cx="210" cy="150" r="48"/><circle class="isobar" cx="210" cy="150" r="78"/><circle class="isobar" cx="210" cy="150" r="108"/>${rotationPaths(clockwise, markerId)}${radialPaths(inward, markerId)}<circle class="pressure-center ${low ? "low" : "high"}" cx="210" cy="150" r="34"/><text class="pressure-letter" x="210" y="160" text-anchor="middle">${centerLabel}</text><text class="isobar-value" x="244" y="113">${pressureValues[0]}</text><text class="isobar-value" x="271" y="92">${pressureValues[1]}</text><text class="isobar-value" x="302" y="68">${pressureValues[2]}</text><g class="vertical-weather"><path class="vertical-arrow" d="M355 ${low ? 246 : 185}V${low ? 185 : 246}" marker-end="url(#${markerId})"/><text class="weather-label" x="355" y="174" text-anchor="middle">${esc(scenario.answers.vertical_motion)}</text><text class="weather-symbol" x="355" y="278" text-anchor="middle">${low ? "☁ 雨" : "☀ 晴"}</text></g><text class="weather-note" x="210" y="298" text-anchor="middle">${esc(scenario.hemisphere)} · ${esc(scenario.answers.rotation)}${inward ? "辐合" : "辐散"} · ${esc(scenario.answers.weather)}</text></svg>`;
  }

  function radioGroup(name, values) {
    return `<div class="weather-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function resultRow(label, actual, expected, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(actual || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(expected)}`}</small></div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">选择性必修1 · 第三章第一节 · ${esc(scenario.id)}</div><h2 class="page-title">气旋与反气旋</h2><p class="page-subtitle">先认高低压，再判断辐合辐散；半球只决定旋转方向，中心垂直运动决定阴晴。</p><section class="weather-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.name)}</strong></div><div><span>两种描述</span><strong>${esc(scenario.system)}</strong></div></section><section class="card weather-system-card"><div class="weather-system-layout"><div><div class="solar-model-head"><div><span class="pill orange">平面＋垂直</span><h3>${esc(scenario.hemisphere)}天气系统</h3></div><span class="pill">图示默认可见</span></div>${model(scenario)}<p class="motion-hint">${esc(lab.model_note)}</p></div><form id="cyclone-system-form" class="weather-prediction-panel"><div class="notice">五项判断需完成；判断链选填，留空也能提交。</div><fieldset><legend>1. 中心与四周的气压关系：</legend>${radioGroup("cyclone-pressure", lab.choices.pressure_center)}</fieldset><fieldset><legend>2. 近地面辐合或辐散：</legend>${radioGroup("cyclone-flow", lab.choices.surface_flow)}</fieldset><fieldset><legend>3. 俯视旋转方向：</legend>${radioGroup("cyclone-rotation", lab.choices.rotation)}</fieldset><fieldset><legend>4. 中心垂直运动：</legend>${radioGroup("cyclone-vertical", lab.choices.vertical_motion)}</fieldset><fieldset><legend>5. 中心常见天气：</legend>${radioGroup("cyclone-weather", lab.choices.weather)}</fieldset><label class="field-label" for="cyclone-reasoning">判断链（选填）</label><textarea id="cyclone-reasoning" name="cyclone-reasoning" placeholder="可选：高低压 → 辐合辐散 → 半球偏转 → 上升下沉 → 阴晴。"></textarea><button class="btn orange motion-submit" type="submit">提交五步判断</button></form></div></section>`;
  }

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    return `<div class="topic-meta">第三章第一节 · 已形成候选诊断</div><h2 class="page-title">把高低压、气流与阴晴连起来</h2><p class="page-subtitle">本轮 ${attempt.score}/5。一次满分仍需家长确认和48小时后的换半球、换系统复测。</p><section class="card weather-system-card"><div class="weather-system-layout"><div>${model(scenario)}</div><div><div class="lab-check-grid">${resultRow("气压中心", attempt.answers.pressure_center, correct.pressure_center, attempt.checks.pressure_center)}${resultRow("水平气流", attempt.answers.surface_flow, correct.surface_flow, attempt.checks.surface_flow)}${resultRow("旋转方向", attempt.answers.rotation, correct.rotation, attempt.checks.rotation)}${resultRow("垂直运动", attempt.answers.vertical_motion, correct.vertical_motion, attempt.checks.vertical_motion)}${resultRow("中心天气", attempt.answers.weather, correct.weather, attempt.checks.weather)}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${esc(attempt.reasoning || "未填写（选填）")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长换半球追问：哪些关系不变，只有哪一步改变？</div>`}<div class="btn-row"><button class="btn orange" data-action="next-cyclone-system">换系统继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  coach.features.cycloneSystem = Object.freeze({ calculate, model, renderLab, renderResult });
})(typeof window !== "undefined" ? window : globalThis);
