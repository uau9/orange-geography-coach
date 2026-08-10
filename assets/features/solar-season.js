(function registerSolarSeasonFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function degreesToRadians(value) { return value * Math.PI / 180; }

  function calculateDayLength(latitude, declination) {
    const argument = -Math.tan(degreesToRadians(latitude)) * Math.tan(degreesToRadians(declination));
    if (argument <= -1) return 24;
    if (argument >= 1) return 0;
    return (2 * Math.acos(argument) * 180 / Math.PI) / 15;
  }

  function dayRelation(dayLength) {
    if (dayLength >= 23.95) return "极昼";
    if (dayLength <= 0.05) return "极夜";
    if (dayLength > 12.05) return "昼长夜短";
    if (dayLength < 11.95) return "昼短夜长";
    return "昼夜等长";
  }

  function calculate(date, place) {
    const dayLengthHours = calculateDayLength(place.latitude, date.solar_declination);
    return {
      direct: date.direct_answer,
      day_relation: dayRelation(dayLengthHours),
      north_pattern: date.north_pattern_answer,
      noon_altitude: Math.round((90 - Math.abs(place.latitude - date.solar_declination)) * 10) / 10,
      day_length_hours: Math.round(dayLengthHours * 10) / 10
    };
  }

  function latitudeLabel(latitude) {
    if (latitude === 0) return "0°";
    return `${Math.abs(latitude)}°${latitude > 0 ? "N" : "S"}`;
  }

  function renderChoice(name, values) {
    return `<div class="solar-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}" /><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderModel(date, place, result = null) {
    const center = { x: 470, y: 195 };
    const earthRadius = 132;
    const tiltDegrees = date.solar_declination > 0 ? -23.5 : date.solar_declination < 0 ? 23.5 : 0;
    const tilt = degreesToRadians(tiltDegrees);
    const northUnit = { x: Math.sin(tilt), y: -Math.cos(tilt) };
    const eastUnit = { x: Math.cos(tilt), y: Math.sin(tilt) };
    const round = (value) => Math.round(value * 10) / 10;
    const latitudeGeometry = (latitude) => {
      const latitudeRadians = degreesToRadians(latitude);
      const offset = Math.sin(latitudeRadians) * earthRadius;
      const halfWidth = Math.cos(latitudeRadians) * earthRadius;
      const lineCenter = { x: center.x + northUnit.x * offset, y: center.y + northUnit.y * offset };
      const start = { x: lineCenter.x - eastUnit.x * halfWidth, y: lineCenter.y - eastUnit.y * halfWidth };
      const end = { x: lineCenter.x + eastUnit.x * halfWidth, y: lineCenter.y + eastUnit.y * halfWidth };
      return { center: lineCenter, start, end, sunward: start.x <= end.x ? start : end };
    };
    const placeGeometry = latitudeGeometry(place.latitude);
    const directGeometry = latitudeGeometry(date.solar_declination);
    const axisLength = 156;
    const northPole = { x: center.x + northUnit.x * axisLength, y: center.y + northUnit.y * axisLength };
    const southPole = { x: center.x - northUnit.x * axisLength, y: center.y - northUnit.y * axisLength };
    const latitudeLines = [-66.5, -23.5, 0, 23.5, 66.5].map((latitude) => latitudeGeometry(latitude));
    return `
      <svg class="solar-season-svg" viewBox="0 0 720 390" role="img" aria-label="${escapeHtml(date.name)}太阳照射与${escapeHtml(place.name)}纬度位置模型">
        <defs>
          <marker id="solar-ray-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#e6a33e" /></marker>
          <clipPath id="solar-earth-clip"><circle cx="470" cy="195" r="132" /></clipPath>
        </defs>
        <rect class="solar-space-bg" width="720" height="390" rx="24" />
        <g class="season-sun"><circle cx="105" cy="195" r="57" /><circle cx="105" cy="195" r="72" /></g>
        <text class="season-sun-label" x="105" y="201" text-anchor="middle">太阳</text>
        <g class="season-rays">${[115, 155, 195, 235, 275].map((y) => `<line x1="180" y1="${y}" x2="315" y2="${y}" marker-end="url(#solar-ray-arrow)" />`).join("")}</g>
        <circle class="season-earth" cx="470" cy="195" r="132" />
        <path class="season-night" d="M470 63A132 132 0 0 1 470 327Z" />
        <g class="season-latitudes" clip-path="url(#solar-earth-clip)">${latitudeLines.map((line) => `<line x1="${round(line.start.x)}" y1="${round(line.start.y)}" x2="${round(line.end.x)}" y2="${round(line.end.y)}" />`).join("")}</g>
        <line class="season-axis" x1="${round(northPole.x)}" y1="${round(northPole.y)}" x2="${round(southPole.x)}" y2="${round(southPole.y)}" />
        <text class="season-pole-label" x="${round(northPole.x - 12)}" y="${round(northPole.y + 8)}">N</text><text class="season-pole-label" x="${round(southPole.x + 7)}" y="${round(southPole.y + 4)}">S</text>
        <g class="season-place-latitude"><line x1="${round(placeGeometry.start.x)}" y1="${round(placeGeometry.start.y)}" x2="${round(placeGeometry.end.x)}" y2="${round(placeGeometry.end.y)}" /><text x="600" y="34" text-anchor="end">目标纬度：${escapeHtml(place.name)} ${escapeHtml(latitudeLabel(place.latitude))}</text></g>
        ${result ? `<g class="season-direct-marker"><line x1="${round(directGeometry.start.x)}" y1="${round(directGeometry.start.y)}" x2="${round(directGeometry.end.x)}" y2="${round(directGeometry.end.y)}" /><circle cx="${round(directGeometry.sunward.x)}" cy="${round(directGeometry.sunward.y)}" r="7" /><text x="${round(directGeometry.sunward.x + 12)}" y="${round(directGeometry.sunward.y - 9)}">直射：${escapeHtml(result.direct)}</text></g><text class="season-answer-label" x="470" y="374" text-anchor="middle">约${result.day_length_hours}小时白昼 · 正午太阳高度约${result.noon_altitude}°</text>` : `<g class="season-lock"><rect x="366" y="352" width="208" height="29" rx="14" /><text x="470" y="372" text-anchor="middle">直射点与昼长提交后显示</text></g>`}
      </svg>`;
  }

  function renderLab({ lab, date, place }) {
    return `
      <div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(date.id)}-${escapeHtml(place.id)}</div>
      <h2 class="page-title">太阳直射点与昼夜长短实验室</h2>
      <p class="page-subtitle">先从日期定位太阳直射点，再判断昼长空间分布，最后计算正午太阳高度。</p>
      <div class="season-date-tabs" aria-label="选择日期">${lab.dates.map((item) => `<button class="${item.id === date.id ? "active" : ""}" data-action="set-solar-date" data-date-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.date_hint)}</small></button>`).join("")}</div>
      <section class="card solar-season-card">
        <div class="solar-season-layout">
          <div class="solar-model-panel">
            <div class="solar-model-head"><div><span class="pill orange">当前情境</span><h3>${escapeHtml(date.name)} · ${escapeHtml(place.name)}</h3></div><span class="pill">${escapeHtml(place.location_note)}</span></div>
            ${renderModel(date, place)}
            <p class="motion-hint">${escapeHtml(lab.model_note)} 图中直射点和昼长答案将在提交后出现。</p>
            <div class="season-place-grid" aria-label="选择地点">${lab.places.map((item) => `<button class="${item.id === place.id ? "active" : ""}" data-action="set-solar-place" data-place-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location_note)}</small></button>`).join("")}</div>
          </div>
          <form id="solar-season-form" class="solar-prediction-panel">
            <div class="notice">四步都要留下预测；提交前不显示直射纬线、约昼长和正午太阳高度。</div>
            <fieldset><legend>1. ${escapeHtml(date.name)}太阳直射：</legend>${renderChoice("solar-direct", lab.choices.direct)}</fieldset>
            <fieldset><legend>2. ${escapeHtml(place.name)}的昼夜状况：</legend>${renderChoice("solar-day-relation", lab.choices.day_relation)}</fieldset>
            <fieldset><legend>3. 全球昼长由南向北：</legend>${renderChoice("solar-north-pattern", lab.choices.north_pattern)}</fieldset>
            <fieldset><legend>4. ${escapeHtml(place.name)}正午太阳高度约为：</legend><div class="solar-number-answer"><input name="solar-noon-altitude" type="number" min="0" max="90" step="0.5" inputmode="decimal" placeholder="填写0—90" aria-label="正午太阳高度" /><span>°</span></div></fieldset>
            <label class="field-label" for="solar-reasoning">写出判断链</label>
            <textarea id="solar-reasoning" name="solar-reasoning" placeholder="例如：先由日期定直射点；再比较直射点与目标地所在半球；判断昼长空间规律；最后用90°－纬度差计算正午太阳高度。"></textarea>
            <button class="btn orange motion-submit" type="submit">提交预测，解锁光照结果</button>
          </form>
        </div>
      </section>`;
  }

  function answerRow(label, userAnswer, correctAnswer, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer || "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
  }

  function renderResult({ lab, date, place, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks || {};
    return `
      <div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
      <h2 class="page-title">把日期、直射点与昼长连成一条线</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/4。图中的约昼长用于建立空间感，不要求用球面公式计算。</p>
      <section class="card solar-season-card">
        <div class="solar-result-layout">
          <div>${renderModel(date, place, correct)}</div>
          <div>
            <div class="lab-check-grid">
              ${answerRow("直射纬线", attempt.answers.direct, correct.direct, checks.direct)}
              ${answerRow("目标地昼夜", attempt.answers.day_relation, correct.day_relation, checks.day_relation)}
              ${answerRow("全球空间规律", attempt.answers.north_pattern, correct.north_pattern, checks.north_pattern)}
              ${answerRow("正午太阳高度", `${attempt.answers.noon_altitude}°`, `${correct.noon_altitude}°`, checks.noon_altitude)}
            </div>
            <div class="answer-box ${attempt.score === 4 ? "correct" : "wrong"}"><strong>${escapeHtml(date.name)}的判断链</strong><br/>${escapeHtml(date.explanation)} ${escapeHtml(place.name)}约有${correct.day_length_hours}小时白昼，正午太阳高度约为${correct.noon_altitude}°。</div>
            <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning)}</div>
            ${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">四步均正确。请家长追问：换到另一半球同纬度地点，昼长与正午太阳高度分别怎样变化？</div>`}
            <div class="btn-row"><button class="btn orange" data-action="next-solar-season">换日期和地点继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
          </div>
        </div>
      </section>`;
  }

  coach.features.solarSeason = Object.freeze({ calculate, calculateDayLength, renderLab, renderResult, latitudeLabel });
})(typeof window !== "undefined" ? window : globalThis);
