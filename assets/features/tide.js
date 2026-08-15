(function registerTideFeature(root) {
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

  function orbitPoint(angleDeg, radius = 92) {
    const angle = Number(angleDeg) * Math.PI / 180;
    return { x: 220 - (Math.cos(angle) * radius), y: 135 - (Math.sin(angle) * radius) };
  }

  function model(item, unlocked) {
    const moon = orbitPoint(item.angle_deg);
    const tideRx = item.category === "spring" ? 58 : item.category === "neap" ? 46 : 52;
    const tideRy = item.category === "spring" ? 31 : item.category === "neap" ? 38 : 35;
    const rotation = item.category === "neap" ? Number(item.angle_deg) / 2 : item.category === "transition" ? Number(item.angle_deg) / 3 : 0;
    const tideLayer = unlocked
      ? `<ellipse class="tide-water ${esc(item.category)}" cx="220" cy="135" rx="${tideRx}" ry="${tideRy}" transform="rotate(${-rotation} 220 135)"/><g class="tide-force moon"><line x1="220" y1="135" x2="${moon.x.toFixed(1)}" y2="${moon.y.toFixed(1)}"/><text x="${((220 + moon.x) / 2).toFixed(1)}" y="${(((135 + moon.y) / 2) - 7).toFixed(1)}">月球引潮方向</text></g><g class="tide-force sun"><line x1="220" y1="135" x2="102" y2="135"/><text x="150" y="124">太阳引潮方向</text></g>`
      : `<circle class="tide-water locked" cx="220" cy="135" r="43"/><g class="tide-lock"><rect x="91" y="222" width="258" height="54" rx="13"/><text x="220" y="244" text-anchor="middle">潮型、潮差与周期</text><text x="220" y="263" text-anchor="middle">提交五步预测后解锁</text></g>`;
    return `<svg class="tide-model" viewBox="0 0 440 300" role="img" aria-label="${unlocked ? `${esc(item.name)}的日地月与潮差模型` : "待判读的日地月相对位置模型"}"><rect class="tide-space" width="440" height="300" rx="20"/><circle class="tide-sun" cx="48" cy="135" r="31"/><text class="tide-label" x="48" y="179" text-anchor="middle">太阳</text><circle class="tide-orbit" cx="220" cy="135" r="92"/>${tideLayer}<circle class="tide-earth" cx="220" cy="135" r="35"/><path class="tide-land" d="M199 121q15-17 29-7l9 13-9 9-3 20-17 2-8-13-12-8z"/><circle class="tide-moon" cx="${moon.x.toFixed(1)}" cy="${moon.y.toFixed(1)}" r="13"/><text class="tide-label" x="${moon.x.toFixed(1)}" y="${(moon.y - 21).toFixed(1)}" text-anchor="middle">月球</text><line class="tide-sun-axis" x1="82" y1="135" x2="329" y2="135"/><text class="tide-phase-label" x="220" y="28" text-anchor="middle">${esc(item.phase)} · 日月夹角 ${esc(item.angle_deg)}°</text>${unlocked ? `<g class="tide-answer-panel"><rect x="81" y="222" width="278" height="54" rx="13"/><text x="220" y="244" text-anchor="middle">${esc(item.tide_type)} · ${esc(item.range)}</text><text x="220" y="263" text-anchor="middle">${esc(item.trend)}</text></g>` : ""}</svg>`;
  }

  function readout(item) {
    return `<div class="tide-readout"><div><span>月相几何</span><strong>${esc(item.geometry)}</strong><small>${esc(item.phase)}</small></div><div><span>潮型与潮差</span><strong>${esc(item.tide_type)} · ${esc(item.range)}</strong><small>${esc(item.trend)}</small></div><div><span>证据边界</span><strong>规律不等于港口预报</strong><small>准确潮时潮高需查当地潮汐资料</small></div></div>`;
  }

  function radioGroup(name, values, seed) {
    return `<div class="tide-choice-grid">${stableShuffle(values, seed).map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, item, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div><h2 class="page-title">潮汐周期与月相实验室</h2><p class="page-subtitle">先把月相还原成日地月方向，再判断引潮作用如何组合；最后区分“总体潮差规律”和“当地准确潮位”。</p><section class="tide-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(item.phase)} · 日月夹角 ${esc(item.angle_deg)}°</strong></div><div><span>本轮任务</span><strong>${esc(scenario.challenge)}</strong></div></section><section class="card tide-card"><div class="tide-layout"><div><div class="solar-model-head"><div><span class="pill orange">日地月俯视模型</span><h3>月相—引潮方向—潮差—局地边界</h3></div><span class="pill">图示默认可见</span></div>${model(item, true)}<div class="activity-observation-list">${scenario.observations.map((observation, index) => `<div><span>观测 ${index + 1}</span><strong>${esc(observation)}</strong></div>`).join("")}</div><p class="motion-hint">图示采用高中理想模型，只表达日地月相对方向；不按真实距离和大小绘制，也不预测某港口的准确潮时与潮高。潮型、潮差与周期答案默认可见。</p></div><form id="tide-form" class="tide-prediction-panel"><div class="notice">判断链：月相 → 日月方向 → 引潮作用组合 → 潮型 → 潮差 → 周期与局地边界。</div><fieldset><legend>1. 最符合该月相的几何关系是：</legend>${radioGroup("tide-geometry", scenario.choices.geometry, `${scenario.id}-geometry`)}</fieldset><fieldset><legend>2. 该阶段最合理的潮型是：</legend>${radioGroup("tide-type", scenario.choices.tide_type, `${scenario.id}-type`)}</fieldset><fieldset><legend>3. 潮差的总体特征是：</legend>${radioGroup("tide-range", scenario.choices.range, `${scenario.id}-range`)}</fieldset><fieldset><legend>4. 最合理的周期判断是：</legend>${radioGroup("tide-cycle", scenario.choices.cycle, `${scenario.id}-cycle`)}</fieldset><fieldset><legend>5. 最稳妥的证据结论是：</legend>${radioGroup("tide-conclusion", scenario.choices.conclusion, `${scenario.id}-conclusion`)}</fieldset><label class="field-label" for="tide-reasoning">判断链（选填）</label><textarea id="tide-reasoning" name="tide-reasoning" placeholder="请依次写月相位置、日月方向、潮型、潮差，再说明能否据此预报某港口的准确潮时潮高。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, item, attempt }) {
    const correct = attempt.correct_answers;
    const caseIndex = Math.max(0, lab.cases.findIndex((entry) => entry.id === item.id));
    return `<div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div><h2 class="page-title">把一次潮差变化还原成日月引潮关系</h2><p class="page-subtitle">本轮 ${attempt.score}/5。拖动一个朔望月，对比大潮、小潮和两者之间的过渡趋势。</p><section class="card tide-card"><div class="tide-result-layout"><div><div id="tide-cycle-model">${model(item, true)}</div><div id="tide-cycle-readout">${readout(item)}</div><label class="tide-progress-caption"><span>新月大潮</span><strong>拖动八个月相</strong><span>残月过渡</span></label><input id="tide-progress" class="tide-progress-slider" type="range" min="0" max="${lab.cases.length - 1}" step="1" value="${caseIndex}" aria-label="拖动查看八个月相与潮差阶段"/></div><div><div class="lab-check-grid">${resultRow("月相几何", attempt.answers.geometry, correct.geometry, attempt.checks.geometry)}${resultRow("潮型", attempt.answers.tide_type, correct.tide_type, attempt.checks.tide_type)}${resultRow("潮差", attempt.answers.range, correct.range, attempt.checks.range)}${resultRow("周期", attempt.answers.cycle, correct.cycle, attempt.checks.cycle)}${resultRow("证据边界", attempt.answers.conclusion, correct.conclusion, attempt.checks.conclusion)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${esc(item.name)} · ${esc(item.phase)}</strong><br/>${esc(correct.conclusion)}</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长切换新月大潮与上弦月小潮，追问“潮差较小为什么不等于没有潮汐”。</div>`}<div class="notice tide-boundary-note"><strong>模型边界</strong><br/>多数海岸常见一个太阴日内两次高潮，但不同海岸可呈半日潮、全日潮或混合潮；海盆形状、水深、摩擦、风和气压都会改变实测潮时潮高。模型不能替代当地潮汐表。</div><div class="btn-row"><button class="btn orange" data-action="next-tide">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function updateCycle(value, lab) {
    if (typeof document === "undefined") return;
    const index = Math.max(0, Math.min((lab.cases || []).length - 1, Math.round(Number(value) || 0)));
    const item = lab.cases?.[index];
    if (!item) return;
    const modelHost = document.querySelector("#tide-cycle-model");
    const readoutHost = document.querySelector("#tide-cycle-readout");
    if (modelHost) modelHost.innerHTML = model(item, true);
    if (readoutHost) readoutHost.innerHTML = readout(item);
  }

  coach.features.tide = Object.freeze({ calculate, getCase, renderLab, renderResult, updateCycle });
})(typeof window !== "undefined" ? window : globalThis);
