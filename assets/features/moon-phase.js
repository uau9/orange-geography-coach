(function registerMoonPhaseFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  function getPhase(lab, id) { return (lab.phases || []).find((phase) => phase.id === id) || lab.phases?.[0] || null; }
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

  function illuminatedShape(phase, x, y, radius) {
    const angle = Number(phase.angle_deg) || 0;
    if (angle === 0) return "";
    if (angle === 180) return `<circle class="moon-face-lit" cx="${x}" cy="${y}" r="${radius}"/>`;
    const rx = Math.max(0.01, Math.abs(Math.cos(angle * Math.PI / 180)) * radius).toFixed(2);
    if (angle < 180) {
      const sweep = angle <= 90 ? 0 : 1;
      return `<path class="moon-face-lit" d="M${x} ${y - radius}A${radius} ${radius} 0 0 1 ${x} ${y + radius}A${rx} ${radius} 0 0 ${sweep} ${x} ${y - radius}Z"/>`;
    }
    const sweep = angle <= 270 ? 0 : 1;
    return `<path class="moon-face-lit" d="M${x} ${y - radius}A${radius} ${radius} 0 0 0 ${x} ${y + radius}A${rx} ${radius} 0 0 ${sweep} ${x} ${y - radius}Z"/>`;
  }

  function phaseModel(lab, phase, unlocked) {
    const angle = Number(phase.angle_deg) || 0;
    const rad = angle * Math.PI / 180;
    const moonX = 214 + Math.cos(rad) * 92;
    const moonY = 125 - Math.sin(rad) * 92;
    return `<svg class="moon-phase-model" viewBox="0 0 430 310" role="img" aria-label="${unlocked ? `${esc(phase.name)}的日地月位置与月面受光模型` : "待判读的日地月相对位置"}"><rect class="moon-space-bg" width="430" height="310" rx="20"/><g class="moon-sun-rays"><path d="M390 70H335M390 105H335M390 140H335M390 175H335"/></g><circle class="moon-sun" cx="396" cy="122" r="27"/><text class="moon-model-label" x="396" y="165" text-anchor="middle">太阳</text><circle class="moon-orbit" cx="214" cy="125" r="92"/><path class="moon-orbit-arrow" d="M210 33a92 92 0 0 0-86 58"/><path class="moon-orbit-head" d="M124 91l1-13 11 8z"/><circle class="moon-earth" cx="214" cy="125" r="25"/><path class="moon-earth-land" d="M202 112l12-7 12 8-4 9 10 5-8 12-8-5-7 9-10-8 4-9-8-5z"/><text class="moon-model-label" x="214" y="163" text-anchor="middle">地球</text><line class="moon-position-line" x1="214" y1="125" x2="${moonX.toFixed(1)}" y2="${moonY.toFixed(1)}"/><circle class="moon-position ${unlocked ? "unlocked" : "locked"}" cx="${moonX.toFixed(1)}" cy="${moonY.toFixed(1)}" r="15"/>${unlocked ? `<path class="moon-position-lit" d="M${moonX.toFixed(1)} ${(moonY - 15).toFixed(1)}A15 15 0 0 1 ${moonX.toFixed(1)} ${(moonY + 15).toFixed(1)}V${(moonY - 15).toFixed(1)}Z"/><text class="moon-position-name" x="${moonX.toFixed(1)}" y="${(moonY - 23).toFixed(1)}" text-anchor="middle">${esc(phase.name)}</text><g class="earth-view-disk"><circle class="moon-face-dark" cx="87" cy="256" r="37"/>${illuminatedShape(phase, 87, 256, 37)}<circle class="moon-face-outline" cx="87" cy="256" r="37"/><text class="moon-model-label" x="87" y="304" text-anchor="middle">从地球看</text></g><g class="phase-answer-label"><rect x="140" y="220" width="252" height="69" rx="13"/><text x="156" y="241">${esc(phase.name)} · ${esc(phase.lunar_date)}</text><text x="156" y="260">${esc(phase.illumination)} · ${esc(phase.trend)}</text><text x="156" y="279">升 ${esc(phase.rise)} · 中天 ${esc(phase.transit)} · 落 ${esc(phase.set)}</text></g>` : `<g class="moon-phase-lock"><rect x="118" y="225" width="274" height="58" rx="14"/><text x="255" y="249" text-anchor="middle">月相、亮面与可见时段</text><text x="255" y="269" text-anchor="middle">提交五步预测后解锁</text></g>`}</svg>`;
  }

  function phaseReadout(phase) {
    return `<div class="moon-phase-readout"><div><span>月相</span><strong>${esc(phase.name)}</strong><small>${esc(phase.lunar_date)}</small></div><div><span>亮面变化</span><strong>${esc(phase.illumination)}</strong><small>${esc(phase.trend)}</small></div><div><span>近似时刻</span><strong>中天 ${esc(phase.transit)}</strong><small>升 ${esc(phase.rise)} · 落 ${esc(phase.set)}</small></div><div><span>观察提示</span><strong>${esc(phase.observation)}</strong><small>实际时刻随日期、地点和轨道略变</small></div></div>`;
  }

  function radioGroup(name, values, seed) {
    return `<div class="moon-phase-choice-grid">${stableShuffle(values, seed).map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, phase, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div><h2 class="page-title">月相位置与可见时段实验室</h2><p class="page-subtitle">先从日地月位置判月相，再判断亮面、盈亏和可见时段；月相通常不是地球影子造成的。</p><section class="moon-phase-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>轨道位置 ${esc(String(phase.angle_deg))}°</strong></div><div><span>本轮任务</span><strong>${esc(scenario.challenge)}</strong></div></section><section class="card moon-phase-card"><div class="moon-phase-layout"><div><div class="solar-model-head"><div><span class="pill orange">地月系统</span><h3>日地月位置—月面—可见时段</h3></div><span class="pill">图示默认可见</span></div>${phaseModel(lab, phase, true)}<div class="activity-observation-list">${scenario.observations.map((item, index) => `<div><span>观测 ${index + 1}</span><strong>${esc(item)}</strong></div>`).join("")}</div><p class="motion-hint">${esc(lab.model_note)} 月相名称、月面亮暗和时段答案默认可见。</p></div><form id="moon-phase-form" class="moon-phase-prediction-panel"><div class="notice">判断链：相对位置 → 月相 → 可见亮面 → 盈亏变化 → 中天时刻 → 证据边界。</div><fieldset><legend>1. 该轨道位置最接近哪种月相？</legend>${radioGroup("moon-phase-name", scenario.choices.phase, `${scenario.id}-phase`)}</fieldset><fieldset><legend>2. 从地球看到的受光部分约为：</legend>${radioGroup("moon-phase-illumination", scenario.choices.illumination, `${scenario.id}-illumination`)}</fieldset><fieldset><legend>3. 此时亮面变化趋势是：</legend>${radioGroup("moon-phase-trend", scenario.choices.trend, `${scenario.id}-trend`)}</fieldset><fieldset><legend>4. 该月相大约何时过中天？</legend>${radioGroup("moon-phase-transit", scenario.choices.transit, `${scenario.id}-transit`)}</fieldset><fieldset><legend>5. 最稳妥的证据结论是：</legend>${radioGroup("moon-phase-conclusion", scenario.choices.conclusion, `${scenario.id}-conclusion`)}</fieldset><label class="field-label" for="moon-phase-reasoning">判断链（选填）</label><textarea id="moon-phase-reasoning" name="moon-phase-reasoning" placeholder="例如：月球在日地夹角约90°的位置，对应半圆月面；再由它位于满月之前判断渐盈，并用太阳中天12时加约6小时推到18时。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, phase, attempt }) {
    const correct = attempt.correct_answers;
    const phaseIndex = Math.max(0, lab.phases.findIndex((item) => item.id === phase.id));
    return `<div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div><h2 class="page-title">把月相还原成一个月的空间过程</h2><p class="page-subtitle">本轮 ${attempt.score}/5。拖动八相月轨，检查同一个“半面受光”的月球，为什么从地球看会连续改变。</p><section class="card moon-phase-card"><div class="moon-phase-result-layout"><div><div id="moon-phase-cycle-model">${phaseModel(lab, phase, true)}</div><div id="moon-phase-cycle-readout">${phaseReadout(phase)}</div><label class="moon-phase-progress-caption"><span>新月</span><strong>拖动八相月轨</strong><span>残月</span></label><input id="moon-phase-progress" class="moon-phase-progress-slider" type="range" min="0" max="${lab.phases.length - 1}" step="1" value="${phaseIndex}" aria-label="拖动查看八种月相"/></div><div><div class="lab-check-grid">${resultRow("月相", attempt.answers.phase, correct.phase, attempt.checks.phase)}${resultRow("可见亮面", attempt.answers.illumination, correct.illumination, attempt.checks.illumination)}${resultRow("盈亏变化", attempt.answers.trend, correct.trend, attempt.checks.trend)}${resultRow("过中天时刻", attempt.answers.transit, correct.transit, attempt.checks.transit)}${resultRow("证据结论", attempt.answers.conclusion, correct.conclusion, attempt.checks.conclusion)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${esc(phase.name)} · ${esc(phase.lunar_date)}</strong><br/>${esc(correct.conclusion)}</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长把月轨拖到亮面比例相同的另一侧，追问为什么盈凸月与亏凸月的可见时段不同。</div>`}<div class="notice moon-boundary-note"><strong>模型边界</strong><br/>月相来自观察半面受光月球的视角变化；只有月食才是地球影子进入月面。南北半球看到同一月相，但视盘朝向不同。</div><div class="btn-row"><button class="btn orange" data-action="next-moon-phase">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function updateCycle(value, lab) {
    if (typeof document === "undefined") return;
    const index = Math.max(0, Math.min((lab.phases || []).length - 1, Math.round(Number(value) || 0)));
    const phase = lab.phases?.[index];
    if (!phase) return;
    const model = document.querySelector("#moon-phase-cycle-model");
    const readout = document.querySelector("#moon-phase-cycle-readout");
    if (model) model.innerHTML = phaseModel(lab, phase, true);
    if (readout) readout.innerHTML = phaseReadout(phase);
  }

  coach.features.moonPhase = Object.freeze({ calculate, getPhase, renderLab, renderResult, updateCycle });
})(typeof window !== "undefined" ? window : globalThis);
