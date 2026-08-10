(function registerCelestialScaleFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

  function calculate(lab) { return { ...lab.answers }; }
  function getLevel(lab, levelId) { return lab.levels.find((level) => level.id === levelId) || lab.levels[0]; }

  function modelDynamic(lab, levelIndex, unlocked) {
    const index = Math.max(0, Math.min(lab.levels.length - 1, Math.round(Number(levelIndex) || 0)));
    const level = lab.levels[index];
    const steps = lab.levels.map((item, itemIndex) => `<g class="celestial-step ${unlocked && itemIndex === index ? "active" : ""} ${unlocked && itemIndex < index ? "passed" : ""}"><circle cx="${55 + itemIndex * 98}" cy="224" r="${unlocked && itemIndex === index ? 15 : 10}"/><text x="${55 + itemIndex * 98}" y="254" text-anchor="middle">${unlocked ? esc(item.short_name) : `第${itemIndex + 1}级`}</text>${itemIndex < lab.levels.length - 1 ? `<path d="M${73 + itemIndex * 98} 224H${133 + itemIndex * 98}"/>` : ""}</g>`).join("");
    const visual = index === 0
      ? `<g class="celestial-earth-moon"><circle class="earth" cx="198" cy="116" r="34"/><circle class="moon-orbit" cx="198" cy="116" r="74"/><circle class="moon" cx="272" cy="116" r="10"/><text x="198" y="121" text-anchor="middle">地球</text><text x="272" y="94" text-anchor="middle">月球</text></g>`
      : index === 1
        ? `<g class="celestial-solar"><circle class="sun" cx="198" cy="116" r="24"/><ellipse class="planet-orbit" cx="198" cy="116" rx="112" ry="65"/><circle class="earth" cx="294" cy="149" r="9"/><text x="198" y="121" text-anchor="middle">太阳</text><text x="294" y="169" text-anchor="middle">地球</text></g>`
        : index === 2
          ? `<g class="celestial-galaxy"><ellipse class="galaxy-disc" cx="198" cy="116" rx="126" ry="68"/><path class="galaxy-arm" d="M198 116c32-44 97-18 78 24-22 47-126 54-168 0-41-54 29-109 88-84 42 18 43 54 17 76-25 22-74 13-70-15 3-24 42-31 55-1"/><circle class="sun-location" cx="270" cy="91" r="8"/><path class="location-line" d="M276 86l35-26"/><text x="316" y="57">太阳系</text><text x="198" y="204" text-anchor="middle">银河系（猎户臂）</text></g>`
          : `<g class="celestial-universe"><circle class="universe-field" cx="198" cy="116" r="105"/>${[[130,75],[178,62],[240,76],[115,128],[176,130],[240,135],[285,115],[205,92]].map(([x,y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 23})"><ellipse class="mini-galaxy" rx="20" ry="7"/><circle r="3"/></g>`).join("")}<text x="198" y="204" text-anchor="middle">可观测宇宙中的众多星系</text></g>`;
    return `<g class="celestial-visual">${unlocked ? visual : `<rect class="celestial-lock" x="66" y="40" width="264" height="148" rx="22"/><text class="celestial-lock-text" x="198" y="105" text-anchor="middle">尺度与位置</text><text class="celestial-lock-text small" x="198" y="128" text-anchor="middle">提交五步预测后解锁</text>`}</g><g class="celestial-stepper">${steps}</g><text class="celestial-scale-note" x="198" y="286" text-anchor="middle">${unlocked ? esc(level.scale_anchor) : "示意图不按真实比例绘制"}</text>`;
  }

  function model(lab, levelIndex, unlocked) {
    const level = lab.levels[Math.max(0, Math.min(lab.levels.length - 1, Math.round(Number(levelIndex) || 0)))];
    return `<div class="celestial-model-wrap"><svg class="celestial-model" viewBox="0 0 396 304" role="img" aria-label="${unlocked ? `当前缩放到${esc(level.name)}` : "待解锁的天体系统层级模型"}"><defs><radialGradient id="celestial-space"><stop offset="0" stop-color="#173f63"/><stop offset="1" stop-color="#071a31"/></radialGradient></defs><rect class="celestial-bg" width="396" height="304" rx="20"/><g id="celestial-dynamic-layer">${modelDynamic(lab, levelIndex, unlocked)}</g></svg><div class="celestial-readout"><strong id="celestial-level-name">${unlocked ? esc(level.name) : "层级待预测"}</strong><span id="celestial-level-unit">${unlocked ? esc(level.unit) : "单位待判断"}</span></div></div>`;
  }

  function radioGroup(name, values) {
    return `<div class="celestial-choice-grid">${values.map((value) => `<label><input type="radio" name="${esc(name)}" value="${esc(value)}"/><span>${esc(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, scenario, scenarioIndex = 0 }) {
    const target = getLevel(lab, scenario.target_level_id);
    return `
      <div class="topic-meta">自然地理 · 宇宙中的地球 · ${esc(scenario.id)}</div>
      <h2 class="page-title">天体系统尺度与地球宇宙位置实验室</h2>
      <p class="page-subtitle">先建立“包含关系”，再给每一级匹配合适单位和位置；不要把一张压缩图当成真实比例图。</p>
      <section class="celestial-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${esc(scenario.challenge)}</strong></div><div><span>本轮聚焦</span><strong>${esc(target.name)}</strong></div></section>
      <section class="card celestial-card"><div class="celestial-layout"><div><div class="solar-model-head"><div><span class="pill orange">四级缩放模型</span><h3>从地月系逐级退远</h3></div><span class="pill">先预测后解锁</span></div>${model(lab, target.order, false)}<p class="motion-hint">${esc(lab.model_note)} 层级内容和尺度锚点提交前隐藏。</p></div><form id="celestial-scale-form" class="celestial-prediction-panel"><div class="notice">判断链：先看谁围绕谁运动 → 确定系统包含关系 → 再匹配 km、AU、ly → 最后判断太阳系在银河系中的位置。</div><fieldset><legend>1. 从小到大的系统顺序：</legend>${radioGroup("celestial-order", lab.choices.system_order)}</fieldset><fieldset><legend>2. 地月平均距离最接近：</legend>${radioGroup("celestial-moon", lab.choices.moon_distance)}</fieldset><fieldset><legend>3. 日地平均距离最适合写成：</legend>${radioGroup("celestial-au", lab.choices.earth_sun_unit)}</fieldset><fieldset><legend>4. 太阳系在银河系中的位置：</legend>${radioGroup("celestial-location", lab.choices.galactic_location)}</fieldset><fieldset><legend>5. 应怎样阅读左侧层级图？</legend>${radioGroup("celestial-diagram", lab.choices.diagram_rule)}</fieldset><label class="field-label" for="celestial-reasoning">写出判断链</label><textarea id="celestial-reasoning" name="celestial-reasoning" placeholder="例如：月球绕地球，地球绕太阳；太阳是银河系中的一颗恒星，所以从小到大是……单位也要随尺度变化。"></textarea><button class="btn orange motion-submit" type="submit">提交五步预测，解锁宇宙位置</button></form></div></section>`;
  }

  const resultRow = (label, user, correct, passed) => `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${esc(label)}</span><strong>${esc(user)}</strong><small>${passed ? "判断正确" : `正确应为 ${esc(correct)}`}</small></div>`;

  function renderResult({ lab, scenario, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks;
    const target = getLevel(lab, scenario.target_level_id);
    return `
      <div class="topic-meta">宇宙中的地球 · 已形成候选诊断</div>
      <h2 class="page-title">把地球放回四级宇宙坐标</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/5。拖动缩放尺，比较不同层级的成员、位置与合适单位。</p>
      <section class="card celestial-card"><div class="celestial-result-layout"><div>${model(lab, target.order, true)}<label class="celestial-progress-caption"><span>地月系</span><strong>拖动宇宙缩放尺</strong><span>可观测宇宙</span></label><input id="celestial-progress" class="celestial-progress-slider" type="range" min="0" max="3" step="1" value="${target.order}" aria-label="拖动查看天体系统层级"/><div class="celestial-fact-strip"><div><span>所在层级</span><strong id="celestial-location-readout">${esc(target.location)}</strong></div><div><span>尺度锚点</span><strong id="celestial-scale-readout">${esc(target.scale_anchor)}</strong></div><div><span>关键辨析</span><strong id="celestial-note-readout">${esc(target.object_note)}</strong></div></div></div><div><div class="lab-check-grid">${resultRow("系统顺序", attempt.answers.system_order, correct.system_order, checks.system_order)}${resultRow("地月距离", attempt.answers.moon_distance, correct.moon_distance, checks.moon_distance)}${resultRow("日地单位", attempt.answers.earth_sun_unit, correct.earth_sun_unit, checks.earth_sun_unit)}${resultRow("银河系位置", attempt.answers.galactic_location, correct.galactic_location, checks.galactic_location)}${resultRow("示意图规则", attempt.answers.diagram_rule, correct.diagram_rule, checks.diagram_rule)}</div><div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>地球的宇宙位置链</strong><br/>${esc(correct.system_order)}。地月约38.4万 km，日地约1 AU，银河系尺度用光年。</div><p><strong>橙子的判断链</strong></p><div class="quote">${esc(attempt.reasoning)}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${esc(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长把缩放尺拖到银河系，追问“太阳系为什么不是银河系中心”。</div>`}<div class="btn-row"><button class="btn orange" data-action="next-celestial-scale">换层级继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div></div></div></section>`;
  }

  function setText(selector, value) { if (typeof document !== "undefined") { const element = document.querySelector(selector); if (element) element.textContent = value; } }
  function updateProgress(value, lab) {
    if (typeof document === "undefined") return;
    const index = Math.max(0, Math.min(lab.levels.length - 1, Math.round(Number(value) || 0)));
    const level = lab.levels[index];
    const layer = document.querySelector("#celestial-dynamic-layer");
    if (layer) layer.innerHTML = modelDynamic(lab, index, true);
    setText("#celestial-level-name", level.name);
    setText("#celestial-level-unit", level.unit);
    setText("#celestial-location-readout", level.location);
    setText("#celestial-scale-readout", level.scale_anchor);
    setText("#celestial-note-readout", level.object_note);
  }

  coach.features.celestialScale = Object.freeze({ calculate, getLevel, renderLab, renderResult, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
