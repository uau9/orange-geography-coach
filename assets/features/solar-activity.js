(function registerSolarActivityFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  function calculate(scenario) { return { ...scenario.answers }; }

  function pathModel(lab, scenario, unlocked) {
    const paths = lab.paths || [];
    return `<svg class="solar-activity-model" viewBox="0 0 430 248" role="img" aria-label="${unlocked ? "太阳活动从太阳传播到地球的三条路径" : "待解锁的太阳活动传播路径"}"><defs><radialGradient id="activity-sun"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f09a3e"/></radialGradient><filter id="activity-glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect class="solar-activity-bg" width="430" height="248" rx="20"/><circle class="activity-sun" cx="58" cy="118" r="38"/><text class="activity-label" x="58" y="172" text-anchor="middle">太阳</text><circle class="activity-earth" cx="378" cy="118" r="21"/><path class="activity-land" d="M367 105l10-6 9 5-2 9 9 5-8 8-6-4-6 9-8-7 4-8-7-4z"/><text class="activity-label" x="378" y="159" text-anchor="middle">地球</text>${paths.map((path, index) => { const y = 62 + index * 56; return `<g class="activity-path ${unlocked ? "unlocked" : "locked"}"><line x1="105" y1="${y}" x2="342" y2="${y}" style="--path-color:${esc(path.color)}"/><path d="M342 ${y}l-12-7v14z" style="fill:${esc(path.color)}"/>${unlocked ? `<text x="222" y="${y - 8}" text-anchor="middle">${esc(path.name)}</text><text class="activity-time" x="222" y="${y + 15}" text-anchor="middle">${esc(path.time)}</text>` : `<rect x="153" y="${y - 18}" width="138" height="35" rx="11"/><text x="222" y="${y + 4}" text-anchor="middle">路径 ${index + 1} · 提交后解锁</text>`}</g>`; }).join("")}<text class="activity-model-note" x="215" y="231" text-anchor="middle">同一次爆发可产生不同载体，抵达时刻并不相同</text></svg>`;
  }

  function evidencePanel(lab, scenario, layer, unlocked) {
    const level = Math.max(0, Math.min(3, Math.round(Number(layer) || 0)));
    const answers = scenario.answers;
    const path = (lab.paths || []).find((item) => answers.transport.includes(item.name) || answers.transport.includes(item.id));
    const layerNames = ["太阳源现象", "传播载体与时标", "地球响应", "证据边界"];
    return `<div class="solar-activity-evidence"><div class="activity-evidence-head"><span>证据层 ${level + 1}/4</span><strong>${layerNames[level]}</strong></div>${level === 0 ? `<div class="activity-fact"><span>最直接判读</span><strong>${esc(answers.phenomenon)}</strong><small>${esc(scenario.observations[0])}</small></div>` : ""}${level === 1 && unlocked ? `<div class="activity-fact"><span>传播链</span><strong>${esc(answers.transport)} · ${esc(answers.arrival)}</strong><small>${esc(path?.note || "复合情境需按先后两段分别判读。")}</small></div>` : ""}${level === 2 && unlocked ? `<div class="activity-fact"><span>地球响应</span><strong>${esc(answers.impact)}</strong><small>影响对象与强度需要结合事件等级、方向和地球环境继续判断。</small></div>` : ""}${level === 3 && unlocked ? `<div class="activity-fact boundary"><span>最稳妥结论</span><strong>${esc(answers.conclusion)}</strong><small>观测到相关现象，只能支持证据范围内的判断。</small></div>` : ""}</div>`;
  }

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

  function radioGroup(name, values, seed) {
    return `<div class="solar-activity-choice-grid">${stableShuffle(values, seed).map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div><h2 class="page-title">太阳活动证据判读实验室</h2><p class="page-subtitle">先认太阳源现象，再分传播载体和时间尺度，最后才判断地球影响；“可能、伴随、相关”都不能直接改写成“必然”。</p><section class="solar-activity-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.headline)}</strong></div><div><span>本轮任务</span><strong>${esc(scenario.challenge)}</strong></div></section><section class="card solar-activity-card"><div class="solar-activity-layout"><div><div class="solar-model-head"><div><span class="pill orange">空间天气</span><h3>太阳源—传播—地球响应</h3></div><span class="pill">先预测后解锁</span></div>${pathModel(lab, scenario, false)}<div class="activity-observation-list">${scenario.observations.map((item, index) => `<div><span>观测 ${index + 1}</span><strong>${esc(item)}</strong></div>`).join("")}</div><p class="motion-hint">${esc(lab.model_note)} 三条传播路径、时标与结论提交前隐藏。</p></div><form id="solar-activity-form" class="solar-activity-prediction-panel"><div class="notice">判断链：太阳源现象 → 传播载体 → 到达时标 → 地球影响 → 证据边界。</div><fieldset><legend>1. 观测最直接对应的太阳源现象是：</legend>${radioGroup("solar-activity-phenomenon", scenario.choices.phenomenon, `${scenario.id}-phenomenon`)}</fieldset><fieldset><legend>2. 这条证据链中的主要传播载体是：</legend>${radioGroup("solar-activity-transport", scenario.choices.transport, `${scenario.id}-transport`)}</fieldset><fieldset><legend>3. 最合理的到达或统计时标是：</legend>${radioGroup("solar-activity-arrival", scenario.choices.arrival, `${scenario.id}-arrival`)}</fieldset><fieldset><legend>4. 更符合证据的地球影响是：</legend>${radioGroup("solar-activity-impact", scenario.choices.impact, `${scenario.id}-impact`)}</fieldset><fieldset><legend>5. 最稳妥的结论是：</legend>${radioGroup("solar-activity-conclusion", scenario.choices.conclusion, `${scenario.id}-conclusion`)}</fieldset><label class="field-label" for="solar-activity-reasoning">写出判断链</label><textarea id="solar-activity-reasoning" name="solar-activity-reasoning" placeholder="例如：先识别耀斑，再判断电磁辐射约8分钟到达；无线电影响先出现，但不能据此断言CME一定撞击地球。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测，解锁传播路径</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    return `<div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div><h2 class="page-title">用载体和时标拆开太阳活动影响</h2><p class="page-subtitle">本轮 ${attempt.score}/5。拖动证据尺，检查从哪一步开始把不同现象或不同时间尺度混在了一起。</p><section class="card solar-activity-card"><div class="solar-activity-result-layout"><div>${pathModel(lab, scenario, true)}<div id="solar-activity-evidence-layer">${evidencePanel(lab, scenario, 1, true)}</div><label class="activity-progress-caption"><span>太阳源</span><strong>拖动证据尺</strong><span>证据边界</span></label><input id="solar-activity-progress" class="solar-activity-progress-slider" type="range" min="0" max="3" step="1" value="1" aria-label="拖动查看太阳活动证据层"/></div><div><div class="lab-check-grid">${resultRow("太阳源现象", attempt.answers.phenomenon, correct.phenomenon, attempt.checks.phenomenon)}${resultRow("传播载体", attempt.answers.transport, correct.transport, attempt.checks.transport)}${resultRow("到达/统计时标", attempt.answers.arrival, correct.arrival, attempt.checks.arrival)}${resultRow("地球影响", attempt.answers.impact, correct.impact, attempt.checks.impact)}${resultRow("证据结论", attempt.answers.conclusion, correct.conclusion, attempt.checks.conclusion)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${esc(scenario.headline)}</strong><br/>${esc(correct.conclusion)}</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning)}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长把证据尺停在“传播载体”，追问为什么耀斑、粒子事件和CME不能用同一个到达时间。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-solar-activity">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function updateProgress(value, lab, scenario) {
    if (typeof document === "undefined") return;
    const panel = document.querySelector("#solar-activity-evidence-layer");
    if (panel && scenario) panel.innerHTML = evidencePanel(lab, scenario, value, true);
  }

  coach.features.solarActivity = Object.freeze({ calculate, renderLab, renderResult, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
