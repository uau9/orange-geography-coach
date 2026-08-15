(function registerCoriolisFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const directions = { "向北": [0, -1], "向东": [1, 0], "向南": [0, 1], "向西": [-1, 0] };

  function calculate(scenario) { return { ...scenario.answers }; }

  function model(scenario) {
    const [dx, dy] = directions[scenario.direction] || [0, -1];
    const side = scenario.answers.relative_side === "运动方向右侧" ? 1 : scenario.answers.relative_side === "运动方向左侧" ? -1 : 0;
    const sx = 210; const sy = 145;
    const straightX = sx + dx * 92; const straightY = sy + dy * 92;
    const sideX = -dy * side; const sideY = dx * side;
    const endX = straightX + sideX * 54; const endY = straightY + sideY * 54;
    const controlX = sx + dx * 65; const controlY = sy + dy * 65;
    return `<svg class="coriolis-model" viewBox="0 0 420 300" role="img" aria-label="${esc(scenario.name)}偏转示意"><defs><marker id="cf-gray" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#7c8793"/></marker><marker id="cf-orange" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#f38b35"/></marker></defs><rect width="420" height="300" rx="20" fill="#eef7fb"/><g class="coriolis-compass"><text x="210" y="25">北</text><text x="396" y="151">东</text><text x="210" y="286">南</text><text x="24" y="151">西</text><path d="M210 35V265M35 145H385"/></g><circle cx="210" cy="145" r="7" fill="#143b5d"/><path d="M${sx} ${sy}L${straightX} ${straightY}" stroke="#7c8793" stroke-width="5" stroke-dasharray="8 7" fill="none" marker-end="url(#cf-gray)"/><path d="M${sx} ${sy}Q${controlX} ${controlY} ${endX} ${endY}" stroke="#f38b35" stroke-width="7" fill="none" marker-end="url(#cf-orange)"/><g class="coriolis-answer"><rect x="30" y="215" width="360" height="48" rx="13" fill="#fff"/><text x="210" y="236" text-anchor="middle">${esc(scenario.hemisphere)} · ${esc(scenario.direction)}运动 → ${esc(scenario.answers.relative_side)}</text><text x="210" y="254" text-anchor="middle">地图上${esc(scenario.answers.final_direction)} · 赤道上不偏</text></g></svg>`;
  }

  function radioGroup(name, values, seed) {
    return `<div class="coriolis-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function resultRow(label, actual, expected, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(actual || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(expected)}`}</small></div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 地球的运动 · ${esc(scenario.id)}</div><h2 class="page-title">地转偏向力实验室</h2><p class="page-subtitle">先把“北右南左、赤道不偏”放到运动方向上，再把相对左右转换为地图方位。</p><section class="coriolis-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.name)}</strong></div><div><span>运动对象</span><strong>${esc(scenario.context)}</strong></div></section><section class="card coriolis-card"><div class="coriolis-layout"><div><div class="solar-model-head"><div><span class="pill orange">俯视示意</span><h3>${esc(scenario.hemisphere)} · 初始${esc(scenario.direction)}</h3></div><span class="pill">图示默认可见</span></div>${model(scenario)}<p class="motion-hint">${esc(lab.model_note)} 灰色虚线为原方向，橙色曲线为实际偏转路径。</p></div><form id="coriolis-form" class="coriolis-prediction-panel"><div class="notice">五项预测需完成；判断链选填，不影响提交。</div><fieldset><legend>1. 半球规律：</legend>${radioGroup("coriolis-rule", lab.choices.hemisphere_rule)}</fieldset><fieldset><legend>2. 相对运动方向偏向：</legend>${radioGroup("coriolis-side", lab.choices.relative_side)}</fieldset><fieldset><legend>3. 换成地图方位：</legend>${radioGroup("coriolis-final", lab.choices.final_direction)}</fieldset><fieldset><legend>4. 对运动速度的作用：</legend>${radioGroup("coriolis-speed", lab.choices.speed_effect)}</fieldset><fieldset><legend>5. 最合适的应用范围：</legend>${radioGroup("coriolis-application", lab.choices.application)}</fieldset><label class="field-label" for="coriolis-reasoning">判断链（选填）</label><textarea id="coriolis-reasoning" name="coriolis-reasoning" placeholder="可选：先定半球，再面向运动方向判断左右，最后转换为东南西北。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测</button></form></div></section>`;
  }

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    return `<div class="topic-meta">地球的运动 · 已形成候选诊断</div><h2 class="page-title">把相对左右转换成地图方向</h2><p class="page-subtitle">本轮 ${attempt.score}/5。一次满分仍需家长确认和48小时后的换方向复测。</p><section class="card coriolis-card"><div class="coriolis-layout"><div>${model(scenario)}</div><div><div class="lab-check-grid">${resultRow("半球规律", attempt.answers.hemisphere_rule, correct.hemisphere_rule, attempt.checks.hemisphere_rule)}${resultRow("相对偏向", attempt.answers.relative_side, correct.relative_side, attempt.checks.relative_side)}${resultRow("地图方位", attempt.answers.final_direction, correct.final_direction, attempt.checks.final_direction)}${resultRow("速度作用", attempt.answers.speed_effect, correct.speed_effect, attempt.checks.speed_effect)}${resultRow("应用范围", attempt.answers.application, correct.application, attempt.checks.application)}</div><p><strong>橙子的判断链（选填）</strong></p><div class="quote">${esc(attempt.reasoning || "未填写（选填）")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长换一个初始方向，追问“右偏”为什么不总是“向东偏”。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-coriolis">换方向继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  coach.features.coriolis = Object.freeze({ calculate, model, renderLab, renderResult });
})(typeof window !== "undefined" ? window : globalThis);
