(function registerSolarPathFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function radians(value) { return value * Math.PI / 180; }

  function calculate(date, place) {
    const declination = Number(date.solar_declination);
    const latitude = Number(place.latitude);
    const latitudeDifference = declination - latitude;
    const overhead = Math.abs(latitudeDifference) < 0.05;
    const noonAltitude = clamp(90 - Math.abs(latitude - declination), 0, 90);
    const noonDirection = overhead ? "头顶" : latitudeDifference > 0 ? "正北" : "正南";
    const noonShadow = overhead ? "几乎没有" : noonDirection === "正北" ? "正南" : "正北";
    return {
      sunrise: declination > 0 ? "东北" : declination < 0 ? "东南" : "正东",
      noon_sun: noonDirection,
      sunset: declination > 0 ? "西北" : declination < 0 ? "西南" : "正西",
      noon_shadow: noonShadow,
      noon_altitude: Math.round(noonAltitude * 10) / 10,
      arc_level: noonAltitude >= 60 ? "高弧线" : noonAltitude >= 35 ? "中弧线" : "低弧线"
    };
  }

  const AZIMUTHS = Object.freeze({
    "正北": 0, "东北": 45, "正东": 90, "东南": 135,
    "正南": 180, "西南": 225, "正西": 270, "西北": 315
  });

  function pathPoint(result, progress) {
    const p = clamp(progress, 0, 1);
    const center = { x: 320, y: 218 };
    const horizonRadius = 158;
    const startAzimuth = AZIMUTHS[result.sunrise];
    const endBase = AZIMUTHS[result.sunset];
    let endAzimuth = endBase;
    if (result.noon_sun === "正北") endAzimuth = endBase - 360;
    if (result.noon_sun === "头顶") endAzimuth = 270;
    const azimuth = startAzimuth + (endAzimuth - startAzimuth) * p;
    const altitude = result.noon_altitude * Math.sin(Math.PI * p);
    const radialDistance = horizonRadius * (1 - altitude / 90);
    return {
      x: center.x + radialDistance * Math.sin(radians(azimuth)),
      y: center.y - radialDistance * Math.cos(radians(azimuth)),
      altitude,
      azimuth,
      center,
      horizonRadius
    };
  }

  function pathPoints(result) {
    return Array.from({ length: 49 }, (_, index) => pathPoint(result, index / 48));
  }

  function formatNumber(value) { return Math.round(value * 10) / 10; }
  function coordinates(points) { return points.map((point) => `${formatNumber(point.x)},${formatNumber(point.y)}`).join(" "); }

  function shadowEnd(point) {
    const dx = point.x - point.center.x;
    const dy = point.y - point.center.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return { x: point.center.x, y: point.center.y + 5 };
    const length = Math.max(5, 105 * (1 - point.altitude / 90));
    return {
      x: point.center.x - dx / distance * length,
      y: point.center.y - dy / distance * length
    };
  }

  function renderSkyModel(result = null, progress = 0.5) {
    const points = result ? pathPoints(result) : [];
    const moving = result ? pathPoint(result, progress) : null;
    const shadow = moving ? shadowEnd(moving) : null;
    const noon = result ? pathPoint(result, 0.5) : null;
    const start = points[0];
    const end = points[points.length - 1];
    return `
      <svg class="solar-path-svg" viewBox="0 0 640 450" role="img" aria-label="抬头观察的太阳视运动天空罗盘图">
        <defs>
          <radialGradient id="sky-dome-gradient" cx="50%" cy="48%" r="58%"><stop offset="0" stop-color="#dff4ff"/><stop offset="1" stop-color="#8fc5df"/></radialGradient>
          <filter id="path-sun-glow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#efb42e" flood-opacity=".85"/></filter>
        </defs>
        <rect class="solar-path-bg" width="640" height="450" rx="24" />
        <circle class="sky-dome" cx="320" cy="218" r="158" />
        <g class="sky-grid" aria-hidden="true"><circle cx="320" cy="218" r="105"/><circle cx="320" cy="218" r="52"/><path d="M162 218H478M320 60V376"/></g>
        <g class="sky-compass"><text x="320" y="44" text-anchor="middle">N 北</text><text x="502" y="223" text-anchor="middle">E 东</text><text x="320" y="407" text-anchor="middle">S 南</text><text x="138" y="223" text-anchor="middle">W 西</text></g>
        <g class="sky-observer"><circle cx="320" cy="218" r="8"/><text x="320" y="240" text-anchor="middle">观察者</text></g>
        ${result ? `
          <line id="solar-path-shadow" class="sky-shadow" x1="320" y1="218" x2="${formatNumber(shadow.x)}" y2="${formatNumber(shadow.y)}" />
          <polyline class="sky-sun-path" points="${coordinates(points)}" />
          <g class="sky-key-point"><circle cx="${formatNumber(start.x)}" cy="${formatNumber(start.y)}" r="7"/><text x="${formatNumber(start.x + 12)}" y="${formatNumber(start.y - 9)}">日出</text></g>
          <g class="sky-key-point"><circle cx="${formatNumber(noon.x)}" cy="${formatNumber(noon.y)}" r="7"/><text x="${formatNumber(noon.x + 12)}" y="${formatNumber(noon.y - 9)}">正午</text></g>
          <g class="sky-key-point"><circle cx="${formatNumber(end.x)}" cy="${formatNumber(end.y)}" r="7"/><text x="${formatNumber(end.x - 12)}" y="${formatNumber(end.y - 9)}" text-anchor="end">日落</text></g>
          <g id="solar-path-moving-sun" class="sky-moving-sun" transform="translate(${formatNumber(moving.x)} ${formatNumber(moving.y)})" filter="url(#path-sun-glow)"><circle r="12"/><path d="M0-21V-28M0 21V28M-21 0H-28M21 0H28M-15-15L-20-20M15 15L20 20M15-15L20-20M-15 15L-20 20"/></g>
          <g class="sky-answer-band"><rect x="188" y="414" width="264" height="28" rx="14"/><text id="solar-path-time-label" x="320" y="433" text-anchor="middle">正午 · 太阳高度约${result.noon_altitude}° · ${result.arc_level}</text></g>
        ` : `<g class="sky-lock"><rect x="196" y="197" width="248" height="42" rx="21"/><text x="320" y="223" text-anchor="middle">太阳轨迹与影子提交后显示</text></g>`}
      </svg>`;
  }

  function renderChoice(name, values) {
    return `<div class="solar-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"/><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderScenarioTabs(items, selectedId, action, idAttribute) {
    return items.map((item) => `<button class="${item.id === selectedId ? "active" : ""}" data-action="${action}" ${idAttribute}="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.date_hint || item.location_note)}</small></button>`).join("");
  }

  function renderLab({ lab, date, place }) {
    return `
      <div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(date.id)}-${escapeHtml(place.id)}</div>
      <h2 class="page-title">日出日落与太阳视运动实验室</h2>
      <p class="page-subtitle">先定太阳直射纬度，再把一天的太阳轨迹和影子方向落到天空罗盘上。</p>
      <div class="season-date-tabs" aria-label="选择日期">${renderScenarioTabs(lab.dates, date.id, "set-solar-path-date", "data-date-id")}</div>
      <section class="card solar-path-card">
        <div class="solar-path-layout">
          <div class="solar-model-panel">
            <div class="solar-model-head"><div><span class="pill orange">当前情境</span><h3>${escapeHtml(date.name)} · ${escapeHtml(place.name)}</h3></div><span class="pill">${escapeHtml(place.location_note)}</span></div>
            ${renderSkyModel(calculate(date, place))}
            <p class="motion-hint">${escapeHtml(lab.model_note)} 太阳轨迹、方位答案和影子默认可见。</p>
            <div class="season-place-grid" aria-label="选择地点">${renderScenarioTabs(lab.places, place.id, "set-solar-path-place", "data-place-id")}</div>
          </div>
          <form id="solar-path-form" class="solar-prediction-panel">
            <div class="notice">四步都要先预测；日出日落看直射点南北，正午方位要比较“当地纬度”和“直射纬度”。</div>
            <fieldset><legend>1. ${escapeHtml(place.name)}日出方位：</legend>${renderChoice("path-sunrise", lab.choices.sunrise)}</fieldset>
            <fieldset><legend>2. 正午太阳位于观察者：</legend>${renderChoice("path-noon-sun", lab.choices.noon_sun)}</fieldset>
            <fieldset><legend>3. ${escapeHtml(place.name)}日落方位：</legend>${renderChoice("path-sunset", lab.choices.sunset)}</fieldset>
            <fieldset><legend>4. 正午影子指向：</legend>${renderChoice("path-noon-shadow", lab.choices.noon_shadow)}</fieldset>
            <label class="field-label" for="solar-path-reasoning">判断链（选填）</label>
            <textarea id="solar-path-reasoning" name="solar-path-reasoning" placeholder="例如：先由日期确定直射纬度；用直射点南北判断日出日落；比较当地纬度和直射纬度判断正午太阳；影子取反方向。"></textarea>
            <button class="btn orange motion-submit" type="submit">提交预测</button>
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
      <h2 class="page-title">让太阳沿一天轨迹走一遍</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/4。拖动时间轴，观察太阳位置与影子方向如何同步变化。</p>
      <section class="card solar-path-card">
        <div class="solar-path-result-layout">
          <div>
            ${renderSkyModel(correct)}
            <label class="solar-path-slider-label" for="solar-path-progress"><span>日出</span><strong>拖动太阳</strong><span>日落</span></label>
            <input id="solar-path-progress" class="solar-path-slider" type="range" min="0" max="100" value="50" step="1" aria-label="一天中的太阳位置" />
            <p class="motion-hint">天空罗盘：N在上、E在右。太阳越靠近中心，高度越高；地面影子始终背向太阳。</p>
          </div>
          <div>
            <div class="lab-check-grid">
              ${answerRow("日出方位", attempt.answers.sunrise, correct.sunrise, checks.sunrise)}
              ${answerRow("正午太阳", attempt.answers.noon_sun, correct.noon_sun, checks.noon_sun)}
              ${answerRow("日落方位", attempt.answers.sunset, correct.sunset, checks.sunset)}
              ${answerRow("正午影子", attempt.answers.noon_shadow, correct.noon_shadow, checks.noon_shadow)}
            </div>
            <div class="answer-box ${attempt.score === 4 ? "correct" : "wrong"}"><strong>${escapeHtml(date.name)} · ${escapeHtml(place.name)}</strong><br/>${escapeHtml(date.explanation)} 此地正午太阳在${escapeHtml(correct.noon_sun)}，高度约${correct.noon_altitude}°，影子指向${escapeHtml(correct.noon_shadow)}。</div>
            <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning || "未填写")}</div>
            ${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">四步均正确。请家长追问：日出在东北，为什么正午太阳不一定在北方？</div>`}
            <div class="btn-row"><button class="btn orange" data-action="next-solar-path">换日期和地点继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
          </div>
        </div>
      </section>`;
  }

  function updateProgress(rawProgress, date, place) {
    if (typeof document === "undefined") return;
    const progress = clamp(Number(rawProgress) / 100, 0, 1);
    const result = calculate(date, place);
    const point = pathPoint(result, progress);
    const shadow = shadowEnd(point);
    const sun = document.querySelector("#solar-path-moving-sun");
    const shadowLine = document.querySelector("#solar-path-shadow");
    const label = document.querySelector("#solar-path-time-label");
    if (sun) sun.setAttribute("transform", `translate(${formatNumber(point.x)} ${formatNumber(point.y)})`);
    if (shadowLine) {
      shadowLine.setAttribute("x2", String(formatNumber(shadow.x)));
      shadowLine.setAttribute("y2", String(formatNumber(shadow.y)));
    }
    if (label) {
      const moment = progress <= 0.02 ? "日出" : progress >= 0.98 ? "日落" : Math.abs(progress - 0.5) < 0.02 ? "正午" : progress < 0.5 ? "上午" : "下午";
      label.textContent = `${moment} · 太阳高度约${formatNumber(point.altitude)}° · ${result.arc_level}`;
    }
  }

  coach.features.solarPath = Object.freeze({ calculate, pathPoint, renderLab, renderResult, updateProgress });
})(typeof window !== "undefined" ? window : globalThis);
