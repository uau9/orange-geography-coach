(function registerEclipseFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  function getCase(lab, id) { return (lab.cases || []).find((item) => item.id === id) || lab.cases?.[0] || null; }
  function calculate(scenario) { return { ...scenario.answers }; }

  function stableShuffle(values, seed) {
    const shuffled = [...values];
    let hash = [...String(seed)].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
      const swapIndex = hash % (index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function solarDiagram(item, unlocked) {
    const moonY = 120 + Number(item.offset || 0);
    const moonR = (14 * Number(item.moon_scale || 1)).toFixed(1);
    const central = Math.abs(Number(item.offset || 0)) < 15;
    const annular = item.id === "annular-solar";
    const shadows = unlocked ? `<path class="eclipse-penumbra" d="M205 ${moonY - 14}L410 ${moonY - 72}L410 ${moonY + 72}L205 ${moonY + 14}Z"/>${annular ? `<path class="eclipse-umbra" d="M205 ${moonY - 11}L300 ${moonY}L205 ${moonY + 11}Z"/><path class="eclipse-antumbra" d="M300 ${moonY}L410 ${moonY - 19}L410 ${moonY + 19}Z"/>` : `<path class="eclipse-umbra" d="M205 ${moonY - 11}L410 ${moonY - 4}L410 ${moonY + 4}L205 ${moonY + 11}Z"/>`}<text class="eclipse-shadow-label" x="282" y="${moonY - 38}">半影</text><text class="eclipse-shadow-label" x="292" y="${moonY + (annular ? 18 : 2)}">${annular ? "伪本影" : "本影"}</text>` : "";
    const observer = unlocked && central ? `<circle class="eclipse-observer" cx="326" cy="120" r="5"/><text class="eclipse-shadow-label" x="326" y="105" text-anchor="middle">中心带</text>` : "";
    return `<g><circle class="eclipse-sun" cx="55" cy="120" r="34"/><text class="eclipse-label" x="55" y="168" text-anchor="middle">太阳</text><line class="eclipse-orbit-plane" x1="105" y1="120" x2="410" y2="120"/>${shadows}<circle class="eclipse-moon" cx="205" cy="${moonY}" r="${moonR}"/><text class="eclipse-label" x="205" y="${moonY - 24}" text-anchor="middle">月球</text><circle class="eclipse-earth" cx="355" cy="120" r="30"/><path class="eclipse-earth-day" d="M355 90A30 30 0 0 0 355 150Z"/><text class="eclipse-label" x="355" y="168" text-anchor="middle">地球</text>${observer}</g>`;
  }

  function lunarDiagram(item, unlocked) {
    const moonY = 120 + Number(item.offset || 0);
    const shadows = unlocked ? `<path class="eclipse-penumbra" d="M205 88L420 42L420 198L205 152Z"/><path class="eclipse-umbra" d="M205 98L420 108L420 132L205 142Z"/><text class="eclipse-shadow-label" x="282" y="75">半影</text><text class="eclipse-shadow-label" x="296" y="124">本影</text>` : "";
    return `<g><circle class="eclipse-sun" cx="55" cy="120" r="34"/><text class="eclipse-label" x="55" y="168" text-anchor="middle">太阳</text><line class="eclipse-orbit-plane" x1="105" y1="120" x2="410" y2="120"/>${shadows}<circle class="eclipse-earth" cx="205" cy="120" r="30"/><path class="eclipse-earth-day" d="M205 90A30 30 0 0 0 205 150Z"/><text class="eclipse-label" x="205" y="168" text-anchor="middle">地球</text><circle class="eclipse-moon" cx="355" cy="${moonY}" r="15"/><text class="eclipse-label" x="355" y="${moonY - 24}" text-anchor="middle">月球</text></g>`;
  }

  function model(item, unlocked) {
    return `<svg class="eclipse-model" viewBox="0 0 430 300" role="img" aria-label="${unlocked ? `${esc(item.name)}的日地月与影锥模型` : "待判读的日地月位置与影锥模型"}"><rect class="eclipse-space" width="430" height="300" rx="20"/>${item.diagram_mode === "solar" ? solarDiagram(item, unlocked) : lunarDiagram(item, unlocked)}${unlocked ? `<g class="eclipse-answer-panel"><rect x="28" y="205" width="374" height="70" rx="14"/><text x="45" y="228">${esc(item.name)} · ${esc(item.phase)}</text><text x="45" y="248">${esc(item.shadow)}</text><text x="45" y="267">${esc(item.visibility)}</text></g>` : `<g class="eclipse-lock"><rect x="79" y="213" width="272" height="58" rx="14"/><text x="215" y="237" text-anchor="middle">影区、食象与可见范围</text><text x="215" y="257" text-anchor="middle">提交五步预测后解锁</text></g>`}</svg>`;
  }

  function readout(item) {
    return `<div class="eclipse-readout"><div><span>位置条件</span><strong>${esc(item.alignment)}</strong><small>${esc(item.phase)}</small></div><div><span>关键影区</span><strong>${esc(item.shadow)}</strong><small>${esc(item.name)}</small></div><div><span>地表可见范围</span><strong>${esc(item.visibility)}</strong><small>食相由观察者所在影区决定</small></div></div>`;
  }

  function radioGroup(name, values, seed) {
    return `<div class="eclipse-choice-grid">${stableShuffle(values, seed).map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, item, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div><h2 class="page-title">日月食几何与可见范围实验室</h2><p class="page-subtitle">先判新月或满月位置，再追踪本影、半影与伪本影；食相是观察者所在影区的结果。</p><section class="eclipse-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(item.phase)} · 轨道交点判读</strong></div><div><span>本轮任务</span><strong>${esc(scenario.challenge)}</strong></div></section><section class="card eclipse-card"><div class="eclipse-layout"><div><div class="solar-model-head"><div><span class="pill orange">日地月剖面</span><h3>位置—影锥—食象—可见范围</h3></div><span class="pill">图示默认可见</span></div>${model(item, true)}<div class="activity-observation-list">${scenario.observations.map((observation, index) => `<div><span>观测 ${index + 1}</span><strong>${esc(observation)}</strong></div>`).join("")}</div><p class="motion-hint">${esc(lab.model_note)} 影区名称、食象与范围答案默认可见。</p></div><form id="eclipse-form" class="eclipse-prediction-panel"><div class="notice">判断链：月相与交点 → 日地月次序 → 影区 → 食象 → 地表可见范围 → 证据边界。</div><fieldset><legend>1. 最符合观测的位置条件是：</legend>${radioGroup("eclipse-alignment", scenario.choices.alignment, `${scenario.id}-alignment`)}</fieldset><fieldset><legend>2. 决定食象的关键影区是：</legend>${radioGroup("eclipse-shadow", scenario.choices.shadow, `${scenario.id}-shadow`)}</fieldset><fieldset><legend>3. 该情境对应的现象是：</legend>${radioGroup("eclipse-phenomenon", scenario.choices.phenomenon, `${scenario.id}-phenomenon`)}</fieldset><fieldset><legend>4. 最合理的地表可见范围是：</legend>${radioGroup("eclipse-visibility", scenario.choices.visibility, `${scenario.id}-visibility`)}</fieldset><fieldset><legend>5. 最稳妥的证据结论是：</legend>${radioGroup("eclipse-conclusion", scenario.choices.conclusion, `${scenario.id}-conclusion`)}</fieldset><label class="field-label" for="eclipse-reasoning">判断链（选填）</label><textarea id="eclipse-reasoning" name="eclipse-reasoning" placeholder="例如：新月接近交点，日—月—地近似成线；月球本影到达地表，所以本影带内见日全食，周围半影区只见偏食。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, item, attempt }) {
    const correct = attempt.correct_answers;
    const caseIndex = Math.max(0, lab.cases.findIndex((entry) => entry.id === item.id));
    return `<div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div><h2 class="page-title">把一次食象还原成影锥与观察位置</h2><p class="page-subtitle">本轮 ${attempt.score}/5。拖动八种几何情境，对比“天体确实成线”与“某地看见哪种食相”不是同一个判断。</p><section class="card eclipse-card"><div class="eclipse-result-layout"><div><div id="eclipse-cycle-model">${model(item, true)}</div><div id="eclipse-cycle-readout">${readout(item)}</div><label class="eclipse-progress-caption"><span>日食</span><strong>拖动八种食象</strong><span>月食</span></label><input id="eclipse-progress" class="eclipse-progress-slider" type="range" min="0" max="${lab.cases.length - 1}" step="1" value="${caseIndex}" aria-label="拖动查看八种日月食几何情境"/></div><div><div class="lab-check-grid">${resultRow("位置条件", attempt.answers.alignment, correct.alignment, attempt.checks.alignment)}${resultRow("关键影区", attempt.answers.shadow, correct.shadow, attempt.checks.shadow)}${resultRow("食象", attempt.answers.phenomenon, correct.phenomenon, attempt.checks.phenomenon)}${resultRow("可见范围", attempt.answers.visibility, correct.visibility, attempt.checks.visibility)}${resultRow("证据结论", attempt.answers.conclusion, correct.conclusion, attempt.checks.conclusion)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${esc(item.name)} · ${esc(item.phase)}</strong><br/>${esc(correct.conclusion)}</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长切换日全食与月全食，追问为什么一个只有狭窄影带可见，另一个可由广大夜半球观察。</div>`}<div class="notice eclipse-boundary-note"><strong>模型边界</strong><br/>新月或满月只是必要条件；还要接近交点。日食类型随观察地点和月球视大小改变，月食则由月球穿过地影的位置决定。示意图不按真实尺度。</div><div class="btn-row"><button class="btn orange" data-action="next-eclipse">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function updateCycle(value, lab) {
    if (typeof document === "undefined") return;
    const index = Math.max(0, Math.min((lab.cases || []).length - 1, Math.round(Number(value) || 0)));
    const item = lab.cases?.[index];
    if (!item) return;
    const modelHost = document.querySelector("#eclipse-cycle-model");
    const readoutHost = document.querySelector("#eclipse-cycle-readout");
    if (modelHost) modelHost.innerHTML = model(item, true);
    if (readoutHost) readoutHost.innerHTML = readout(item);
  }

  coach.features.eclipse = Object.freeze({ calculate, getCase, renderLab, renderResult, updateCycle });
})(typeof window !== "undefined" ? window : globalThis);
