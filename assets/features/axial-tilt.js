(function registerAxialTiltFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const round1 = (value) => Math.round(Number(value) * 10) / 10;
  const deg = (value) => `${Number(value)}°`;

  function calculate(scenario, tiltOverride = scenario.target_tilt_deg, facts = { current_tilt_deg: 23.5 }) {
    const tilt = Math.max(0, Math.min(45, round1(tiltOverride)));
    const current = Number(facts.current_tilt_deg);
    const difference = tilt - current;
    return {
      tilt_deg: tilt,
      tropic_latitude: tilt,
      polar_circle_latitude: round1(90 - tilt),
      tropical_width: round1(2 * tilt),
      polar_width_each: tilt,
      temperate_width_each: round1(Math.max(0, 90 - 2 * tilt)),
      zone_change: Math.abs(difference) < 0.05
        ? "五带范围不变"
        : difference > 0
          ? "热带、寒带变宽，温带变窄"
          : "热带、寒带变窄，温带变宽",
      seasonal_contrast: tilt === 0 ? "无由地轴倾斜造成的季节差异" : difference > 0 ? "比当前更强" : difference < 0 ? "比当前更弱" : "与当前近似相同"
    };
  }

  function latitudeY(latitude) { return 150 - Number(latitude) * (100 / 90); }

  function modelDynamic(result, unlocked) {
    const tiltRad = result.tilt_deg * Math.PI / 180;
    const dx = Math.sin(tiltRad) * 112;
    const dy = Math.cos(tiltRad) * 112;
    const eqDx = Math.cos(tiltRad) * 84;
    const eqDy = Math.sin(tiltRad) * 84;
    const tropicNorthY = latitudeY(result.tropic_latitude);
    const tropicSouthY = latitudeY(-result.tropic_latitude);
    const polarNorthY = latitudeY(result.polar_circle_latitude);
    const polarSouthY = latitudeY(-result.polar_circle_latitude);
    const zoneLabel = (label, top, bottom) => bottom - top >= 13 ? `<text class="axial-zone-label" x="375" y="${(top + bottom) / 2 + 3}" text-anchor="middle">${label}</text>` : "";
    const zones = unlocked ? `
      <g class="axial-zones">
        <rect class="axial-zone polar" x="354" y="50" width="42" height="${polarNorthY - 50}"/>
        <rect class="axial-zone temperate" x="354" y="${polarNorthY}" width="42" height="${tropicNorthY - polarNorthY}"/>
        <rect class="axial-zone tropical" x="354" y="${tropicNorthY}" width="42" height="${tropicSouthY - tropicNorthY}"/>
        <rect class="axial-zone temperate" x="354" y="${tropicSouthY}" width="42" height="${polarSouthY - tropicSouthY}"/>
        <rect class="axial-zone polar" x="354" y="${polarSouthY}" width="42" height="${250 - polarSouthY}"/>
        <line class="axial-boundary tropic" x1="95" y1="${tropicNorthY}" x2="396" y2="${tropicNorthY}"/>
        <line class="axial-boundary tropic" x1="95" y1="${tropicSouthY}" x2="396" y2="${tropicSouthY}"/>
        <line class="axial-boundary polar" x1="95" y1="${polarNorthY}" x2="396" y2="${polarNorthY}"/>
        <line class="axial-boundary polar" x1="95" y1="${polarSouthY}" x2="396" y2="${polarSouthY}"/>
        ${zoneLabel("北寒带", 50, polarNorthY)}
        ${zoneLabel("北温带", polarNorthY, tropicNorthY)}
        ${zoneLabel("热带", tropicNorthY, tropicSouthY)}
        ${zoneLabel("南温带", tropicSouthY, polarSouthY)}
        ${zoneLabel("南寒带", polarSouthY, 250)}
      </g>` : `
      <g class="axial-zone-lock">
        <rect x="340" y="72" width="70" height="156" rx="16"/>
        <text x="375" y="143" text-anchor="middle">五带边界</text>
        <text x="375" y="159" text-anchor="middle">提交后解锁</text>
      </g>`;
    return `
      ${zones}
      <g class="axial-earth">
        <circle cx="220" cy="150" r="91"/>
        <ellipse cx="220" cy="150" rx="91" ry="28"/>
        <ellipse cx="220" cy="150" rx="34" ry="91"/>
      </g>
      <line class="axial-axis" x1="${220 - dx}" y1="${150 + dy}" x2="${220 + dx}" y2="${150 - dy}"/>
      <line class="axial-equator" x1="${220 - eqDx}" y1="${150 - eqDy}" x2="${220 + eqDx}" y2="${150 + eqDy}"/>
      <circle class="axial-pole" cx="${220 + dx * 0.81}" cy="${150 - dy * 0.81}" r="5"/>
      <path class="axial-angle" d="M220 80 A70 70 0 0 1 ${220 + Math.sin(tiltRad) * 70} ${150 - Math.cos(tiltRad) * 70}"/>
      <text class="axial-angle-label" x="${225 + Math.sin(tiltRad / 2) * 78}" y="${143 - Math.cos(tiltRad / 2) * 78}">ε=${deg(result.tilt_deg)}</text>
    `;
  }

  function model(scenario, unlocked, tiltOverride = scenario.target_tilt_deg, facts) {
    const result = calculate(scenario, tiltOverride, facts);
    return `<div class="axial-model-wrap"><svg class="axial-model" viewBox="0 0 430 300" role="img" aria-label="${unlocked ? "黄赤交角与五带联动模型" : "待解锁的黄赤交角模型"}"><defs><radialGradient id="axial-earth-fill"><stop offset="0" stop-color="#d8f2f5"/><stop offset="1" stop-color="#7fc4cd"/></radialGradient></defs><rect class="axial-bg" width="430" height="300" rx="20"/><g class="axial-rays"><path d="M16 92H104M16 122H104M16 152H104M16 182H104M16 212H104"/></g><text class="axial-sun-label" x="18" y="72">太阳光</text><line class="axial-normal" x1="220" y1="38" x2="220" y2="262"/><text class="axial-normal-label" x="226" y="44">黄道面法线</text><g id="axial-dynamic-layer">${modelDynamic(result, unlocked)}</g></svg><div class="axial-readout"><strong id="axial-tilt-readout">ε ${deg(result.tilt_deg)}</strong><span id="axial-tropic-readout">回归线 ${unlocked ? deg(result.tropic_latitude) : "待预测"}</span><span id="axial-polar-readout">极圈 ${unlocked ? deg(result.polar_circle_latitude) : "待预测"}</span></div></div>`;
  }

  function choices(values) {
    return `<div class="axial-choice-grid">${values.map((value) => `<label><input type="radio" name="axial-zone-change" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    return `
      <div class="topic-meta">自然地理 · 地球运动与太阳视运动 · ${esc(scenario.id)}</div>
      <h2 class="page-title">黄赤交角与五带变化实验室</h2>
      <p class="page-subtitle">已知黄赤交角 ε，先求回归线和极圈，再算区域宽度；不要把“边界纬度”和“南北总宽度”混在一起。</p>
      <section class="axial-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>目标黄赤交角 ${deg(scenario.target_tilt_deg)}</strong></div><div><span>当前地球近似值</span><strong>${deg(lab.facts.current_tilt_deg)}</strong></div></section>
      <section class="card axial-tilt-card"><div class="axial-tilt-layout"><div><div class="solar-model-head"><div><span class="pill orange">反事实地球模型</span><h3>倾角—回归线—极圈—五带</h3></div><span class="pill">0°—45°理想推演</span></div>${model(scenario, false, scenario.target_tilt_deg, lab.facts)}<p class="motion-hint">${esc(lab.model_note)} 回归线、极圈和五带边界提交前隐藏。</p></div><form id="axial-tilt-form" class="axial-prediction-panel"><div class="notice">判断链：ε → 回归线纬度 ε → 极圈纬度 90°−ε → 热带总宽 2ε → 每个温带宽 90°−2ε。</div><fieldset><legend>1. 回归线纬度：</legend><output id="axial-tropic-output" class="axial-range-output">23.5°</output><input id="axial-tropic-prediction" name="axial-tropic" type="range" min="0" max="45" step="0.5" value="23.5" aria-label="预测回归线纬度"/></fieldset><fieldset><legend>2. 极圈纬度：</legend><output id="axial-polar-output" class="axial-range-output">66.5°</output><input id="axial-polar-prediction" name="axial-polar" type="range" min="45" max="90" step="0.5" value="66.5" aria-label="预测极圈纬度"/></fieldset><fieldset><legend>3. 南北回归线之间的热带总宽：</legend><output id="axial-tropical-width-output" class="axial-range-output">47°</output><input id="axial-tropical-width-prediction" name="axial-tropical-width" type="range" min="0" max="90" step="1" value="47" aria-label="预测热带总宽"/></fieldset><fieldset><legend>4. 每个温带的纬度宽度：</legend><output id="axial-temperate-output" class="axial-range-output">43°</output><input id="axial-temperate-prediction" name="axial-temperate" type="range" min="0" max="90" step="1" value="43" aria-label="预测每个温带宽度"/></fieldset><fieldset><legend>5. 与当前23.5°相比，五带怎样变化？</legend>${choices(lab.choices.zone_change)}</fieldset><label class="field-label" for="axial-reasoning">写出判断链</label><textarea id="axial-reasoning" name="axial-reasoning" placeholder="例如：ε增大，回归线纬度增大；极圈纬度=90°−ε而减小，因此热带和寒带变宽、温带变窄。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测，解锁五带</button></form></div></section>
    `;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks;
    return `
      <div class="topic-meta">地球运动与太阳视运动 · 已形成候选诊断</div>
      <h2 class="page-title">让一个角度同时改写四条纬线</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/5。拖动0°—45°，观察回归线向两极、极圈向赤道移动时，五带怎样同步伸缩。</p>
      <section class="card axial-tilt-card"><div class="axial-result-layout"><div>${model(scenario, true, scenario.target_tilt_deg, lab.facts)}<label class="axial-progress-caption"><span>0° 无地轴倾斜</span><strong>拖动黄赤交角</strong><span>45° 理想上限</span></label><input id="axial-progress" class="axial-progress-slider" type="range" min="0" max="45" step="0.5" value="${scenario.target_tilt_deg}" aria-label="拖动黄赤交角"/><div class="axial-fact-strip"><div><span>热带总宽</span><strong id="axial-tropical-fact">${deg(correct.tropical_width)}</strong><small>2ε</small></div><div><span>每个寒带</span><strong id="axial-polar-fact">${deg(correct.polar_width_each)}</strong><small>90°−极圈纬度</small></div><div><span>每个温带</span><strong id="axial-temperate-fact">${deg(correct.temperate_width_each)}</strong><small>90°−2ε</small></div></div></div><div><div class="lab-check-grid">${resultRow("回归线纬度", deg(attempt.answers.tropic_latitude), deg(correct.tropic_latitude), checks.tropic_latitude)}${resultRow("极圈纬度", deg(attempt.answers.polar_circle_latitude), deg(correct.polar_circle_latitude), checks.polar_circle_latitude)}${resultRow("热带总宽", deg(attempt.answers.tropical_width), deg(correct.tropical_width), checks.tropical_width)}${resultRow("每个温带", deg(attempt.answers.temperate_width_each), deg(correct.temperate_width_each), checks.temperate_width_each)}${resultRow("五带变化", attempt.answers.zone_change, correct.zone_change, checks.zone_change)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>ε=${deg(correct.tilt_deg)}</strong><br/>回归线${deg(correct.tropic_latitude)}，极圈${deg(correct.polar_circle_latitude)}；热带总宽${deg(correct.tropical_width)}，每个寒带宽${deg(correct.polar_width_each)}，每个温带宽${deg(correct.temperate_width_each)}。</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning)}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长把滑轨拖到0°，追问为什么没有极昼极夜、也没有由地轴倾斜造成的季节变化。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-axial-tilt">换倾角继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>
    `;
  }

  function setText(selector, text) { if (typeof document !== "undefined") { const element = document.querySelector(selector); if (element) element.textContent = text; } }
  function updateProgress(value, scenario, facts) {
    if (typeof document === "undefined") return;
    const result = calculate(scenario, value, facts);
    const layer = document.querySelector("#axial-dynamic-layer");
    if (layer) layer.innerHTML = modelDynamic(result, true);
    setText("#axial-tilt-readout", `ε ${deg(result.tilt_deg)}`);
    setText("#axial-tropic-readout", `回归线 ${deg(result.tropic_latitude)}`);
    setText("#axial-polar-readout", `极圈 ${deg(result.polar_circle_latitude)}`);
    setText("#axial-tropical-fact", deg(result.tropical_width));
    setText("#axial-polar-fact", deg(result.polar_width_each));
    setText("#axial-temperate-fact", deg(result.temperate_width_each));
  }

  coach.features.axialTilt = Object.freeze({
    calculate,
    renderLab,
    renderResult,
    updateProgress,
    updateTropic: (value) => setText("#axial-tropic-output", deg(value)),
    updatePolar: (value) => setText("#axial-polar-output", deg(value)),
    updateTropicalWidth: (value) => setText("#axial-tropical-width-output", deg(value)),
    updateTemperate: (value) => setText("#axial-temperate-output", deg(value))
  });
})(typeof window !== "undefined" ? window : globalThis);
