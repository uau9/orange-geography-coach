(function registerHabitabilityFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  function getBody(lab, id) { return lab.bodies.find((body) => body.id === id) || lab.bodies[0]; }
  function calculate(scenario) { return { ...scenario.answers }; }

  function orbitX(distance) { return 78 + (Number(distance) / 1.6) * 270; }

  function orbitModel(bodyA, bodyB, unlocked) {
    const bodies = [bodyA, bodyB];
    return `<svg class="habitability-model" viewBox="0 0 390 238" role="img" aria-label="${unlocked ? `${esc(bodyA.name)}与${esc(bodyB.name)}宜居条件对照` : "待解锁的行星表面条件对照"}"><defs><radialGradient id="habitability-space"><stop offset="0" stop-color="#173f63"/><stop offset="1" stop-color="#071a31"/></radialGradient></defs><rect class="habitability-bg" width="390" height="238" rx="20"/><circle class="habitability-sun" cx="43" cy="106" r="24"/><text class="habitability-sun-label" x="43" y="142" text-anchor="middle">太阳</text><g class="habitability-orbits"><path d="M70 56H365M70 106H365M70 156H365"/></g>${bodies.map((body, index) => `<g class="habitability-body" transform="translate(${orbitX(body.distance_au)} ${82 + index * 76})"><circle r="18" style="fill:${esc(body.color)}"/><text x="0" y="4" text-anchor="middle">${esc(body.name)}</text><text class="habitability-au" x="0" y="34" text-anchor="middle">${body.distance_au} AU</text></g>`).join("")}${unlocked ? "" : `<g class="habitability-lock"><rect x="111" y="74" width="204" height="70" rx="16"/><text x="213" y="104" text-anchor="middle">表面温度与液态水</text><text x="213" y="122" text-anchor="middle">提交五步预测后解锁</text></g>`}<text class="habitability-formula" x="195" y="220" text-anchor="middle">同一太阳下：接收辐射约与日距²成反比</text></svg>`;
  }

  function evidencePanel(bodyA, bodyB, layer, unlocked) {
    const level = Math.max(0, Math.min(3, Math.round(Number(layer) || 0)));
    const row = (label, getter) => `<div class="habitability-evidence-row"><span>${esc(label)}</span>${[bodyA, bodyB].map((body) => `<strong>${esc(getter(body))}</strong>`).join("")}</div>`;
    return `<div class="habitability-evidence-head"><span>证据层 ${level + 1}/4</span><strong>${["轨道与辐射", "大气与气压", "温度与水", "推理边界"][level]}</strong></div><div class="habitability-evidence-table"><div class="habitability-evidence-row head"><span>变量</span><strong>${esc(bodyA.name)}</strong><strong>${esc(bodyB.name)}</strong></div>${row("日距", (body) => `${body.distance_au} AU`)}${row("接收太阳辐射", (body) => `约地球的${body.solar_flux_percent}%`)}${level >= 1 ? `${row("地表气压", (body) => body.pressure_label)}${row("大气", (body) => body.atmosphere)}` : ""}${level >= 2 && unlocked ? `${row("温度", (body) => body.temperature)}${row("地表水", (body) => body.surface_water)}` : ""}${level >= 3 && unlocked ? `${row("关键证据", (body) => body.evidence_note)}<div class="habitability-boundary">宜居条件只能提高“适合已知生命”的可能性；发现水、适温或大气成分，都不能单独证明生命存在。</div>` : ""}</div>`;
  }

  function model(lab, scenario, unlocked, layer = unlocked ? 2 : 1) {
    const bodyA = getBody(lab, scenario.body_a);
    const bodyB = getBody(lab, scenario.body_b);
    return `<div class="habitability-model-wrap">${orbitModel(bodyA, bodyB, unlocked)}<div id="habitability-evidence-layer">${evidencePanel(bodyA, bodyB, layer, unlocked)}</div></div>`;
  }

  function radioGroup(name, values) {
    return `<div class="habitability-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    const bodyA = getBody(lab, scenario.body_a);
    const bodyB = getBody(lab, scenario.body_b);
    const compareChoices = [bodyA.name, bodyB.name, "近似相同"];
    return `<div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div><h2 class="page-title">地球宜居条件对照实验室</h2><p class="page-subtitle">像做对照实验一样分变量：先比日距和辐射，再比大气与气压，最后才讨论温度、液态水和生命证据。</p><section class="habitability-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.challenge)}</strong></div><div><span>对照组</span><strong>${esc(bodyA.name)} vs ${esc(bodyB.name)}</strong></div></section><section class="card habitability-card"><div class="habitability-layout"><div><div class="solar-model-head"><div><span class="pill orange">变量对照</span><h3>轨道—大气—温度—液态水</h3></div><span class="pill">图示默认可见</span></div>${model(lab, scenario, true, 3)}<p class="motion-hint">${esc(lab.model_note)} 温度、地表水和结论默认可见。</p></div><form id="habitability-form" class="habitability-prediction-panel"><div class="notice">判断链：日距 → 接收太阳辐射 → 大气总量与成分 → 温室效应和温度 → 水的相态 → 证据边界。</div><fieldset><legend>1. 接收太阳辐射较多的是：</legend>${radioGroup("habitability-solar", compareChoices)}</fieldset><fieldset><legend>2. 地表气压较高的是：</legend>${radioGroup("habitability-pressure", compareChoices)}</fieldset><fieldset><legend>3. 综合日距和大气信息，当前表面温度更接近液态水温度窗口的是：</legend>${radioGroup("habitability-temperature", [bodyA.name, bodyB.name, "两者都不接近"])}</fieldset><fieldset><legend>4. 当前有地表长期稳定液态水证据的是：</legend>${radioGroup("habitability-water", [bodyA.name, bodyB.name, "两者都缺少地表长期稳定液态水"])}</fieldset><fieldset><legend>5. 由这组对照最合理的推论是：</legend>${radioGroup("habitability-inference", scenario.inference_choices)}</fieldset><label class="field-label" for="habitability-reasoning">判断链（选填）</label><textarea id="habitability-reasoning" name="habitability-reasoning" placeholder="例如：先按日距判断太阳辐射，再比较气压和温室效应；有水冰不等于有稳定液态水，更不能直接证明生命。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, attempt }) {
    const bodyA = getBody(lab, scenario.body_a);
    const bodyB = getBody(lab, scenario.body_b);
    const checks = attempt.checks;
    const correct = attempt.correct_answers;
    return `<div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div><h2 class="page-title">用对照变量检验“地球为什么宜居”</h2><p class="page-subtitle">本轮 ${attempt.score}/5。拖动证据尺，逐层加入变量；观察加入哪一层后，原先的单因解释被推翻。</p><section class="card habitability-card"><div class="habitability-result-layout"><div>${model(lab, scenario, true, 2)}<label class="habitability-progress-caption"><span>轨道</span><strong>拖动证据尺</strong><span>推理边界</span></label><input id="habitability-progress" class="habitability-progress-slider" type="range" min="0" max="3" step="1" value="2" aria-label="拖动查看宜居条件证据层"/></div><div><div class="lab-check-grid">${resultRow("太阳辐射", attempt.answers.higher_solar, correct.higher_solar, checks.higher_solar)}${resultRow("地表气压", attempt.answers.higher_pressure, correct.higher_pressure, checks.higher_pressure)}${resultRow("温度窗口", attempt.answers.temperature_window, correct.temperature_window, checks.temperature_window)}${resultRow("稳定液态水", attempt.answers.stable_liquid_water, correct.stable_liquid_water, checks.stable_liquid_water)}${resultRow("合理推论", attempt.answers.best_inference, correct.best_inference, checks.best_inference)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${esc(bodyA.name)} vs ${esc(bodyB.name)}</strong><br/>${esc(correct.best_inference)}。宜居性是多变量结论，不是生命存在证明。</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长把证据尺退回“轨道”，追问为什么只看宜居带仍不足以下结论。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-habitability">换对照组继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function updateProgress(value, lab, scenario) {
    if (typeof document === "undefined") return;
    const panel = document.querySelector("#habitability-evidence-layer");
    if (!panel) return;
    panel.innerHTML = evidencePanel(getBody(lab, scenario.body_a), getBody(lab, scenario.body_b), value, true);
  }

  coach.features.habitability = Object.freeze({ getBody, calculate, renderLab, renderResult, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
