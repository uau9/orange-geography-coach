(function registerTerminatorLinkFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function normalizeMinutes(value) {
    return ((Math.round(Number(value)) % 1440) + 1440) % 1440;
  }

  function formatClock(totalMinutes) {
    const minutes = normalizeMinutes(totalMinutes);
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }

  function normalizeLongitude(value) {
    const normalized = ((Number(value) + 180) % 360 + 360) % 360 - 180;
    return Math.abs(normalized + 180) < 1e-9 && Number(value) > 0 ? 180 : normalized;
  }

  function longitudeLabel(value) {
    const longitude = round(normalizeLongitude(value), 1);
    if (Math.abs(longitude) < 0.05) return "0°";
    if (Math.abs(Math.abs(longitude) - 180) < 0.05) return "180°";
    return `${Math.abs(longitude)}°${longitude > 0 ? "E" : "W"}`;
  }

  function latitudeLabel(value) {
    const latitude = round(Number(value), 1);
    if (Math.abs(latitude) < 0.05) return "0°";
    return `${Math.abs(latitude)}°${latitude > 0 ? "N" : "S"}`;
  }

  function dayLengthHours(latitude, declination) {
    const phi = Number(latitude) * Math.PI / 180;
    const delta = Number(declination) * Math.PI / 180;
    const cosHourAngle = -Math.tan(phi) * Math.tan(delta);
    if (cosHourAngle <= -1) return 24;
    if (cosHourAngle >= 1) return 0;
    return 24 * Math.acos(cosHourAngle) / Math.PI;
  }

  function polarPattern(declination) {
    if (Number(declination) > 0.1) return "北极圈及其以北极昼、南极圈及其以南极夜";
    if (Number(declination) < -0.1) return "北极圈及其以北极夜、南极圈及其以南极昼";
    return "两极圈内均无极昼极夜";
  }

  function circularMinuteDifference(a, b) {
    const difference = Math.abs(normalizeMinutes(a) - normalizeMinutes(b));
    return Math.min(difference, 1440 - difference);
  }

  function calculate(date, place, utcMinutes, lineToleranceMinutes = 5) {
    const utc = normalizeMinutes(utcMinutes);
    const directLongitude = normalizeLongitude((720 - utc) / 4);
    const localMinutes = normalizeMinutes(utc + Number(place.longitude) * 4);
    const exactDayLength = dayLengthHours(place.latitude, date.declination);
    const scoredDayLength = Math.round(exactDayLength * 2) / 2;
    const sunriseMinutes = exactDayLength === 24 ? null : exactDayLength === 0 ? null : (12 - exactDayLength / 2) * 60;
    const sunsetMinutes = exactDayLength === 24 ? null : exactDayLength === 0 ? null : (12 + exactDayLength / 2) * 60;
    let status;
    if (exactDayLength >= 23.999) status = "白昼区";
    else if (exactDayLength <= 0.001) status = "黑夜区";
    else if (circularMinuteDifference(localMinutes, sunriseMinutes) <= lineToleranceMinutes) status = "晨线";
    else if (circularMinuteDifference(localMinutes, sunsetMinutes) <= lineToleranceMinutes) status = "昏线";
    else status = localMinutes > sunriseMinutes && localMinutes < sunsetMinutes ? "白昼区" : "黑夜区";
    return {
      utc_minutes: utc,
      utc_time: formatClock(utc),
      direct_longitude: round(directLongitude, 1),
      direct_longitude_label: longitudeLabel(directLongitude),
      local_minutes: localMinutes,
      local_time: formatClock(localMinutes),
      day_length_hours: scoredDayLength,
      day_length_exact: round(exactDayLength, 1),
      sunrise_time: sunriseMinutes === null ? (exactDayLength === 24 ? "全天不落" : "全天不升") : formatClock(sunriseMinutes),
      sunset_time: sunsetMinutes === null ? (exactDayLength === 24 ? "全天不落" : "全天不升") : formatClock(sunsetMinutes),
      status,
      polar_pattern: polarPattern(date.declination)
    };
  }

  function hourAngleDegrees(latitude, declination) {
    const phi = Number(latitude) * Math.PI / 180;
    const delta = Number(declination) * Math.PI / 180;
    const cosHourAngle = -Math.tan(phi) * Math.tan(delta);
    if (cosHourAngle <= -1) return 180;
    if (cosHourAngle >= 1) return 0;
    return Math.acos(cosHourAngle) * 180 / Math.PI;
  }

  function daylightStrips(declination, directLongitude) {
    const strips = [];
    for (let latitude = -90; latitude < 90; latitude += 2) {
      const middleLatitude = latitude + 1;
      const hourAngle = hourAngleDegrees(middleLatitude, declination);
      const y = 90 - (latitude + 2);
      if (hourAngle >= 179.999) {
        strips.push(`<rect x="0" y="${y}" width="360" height="2.2"/>`);
        continue;
      }
      if (hourAngle <= 0.001) continue;
      const start = normalizeLongitude(directLongitude - hourAngle);
      const end = normalizeLongitude(directLongitude + hourAngle);
      if (start <= end) {
        strips.push(`<rect x="${round(start + 180, 2)}" y="${y}" width="${round(end - start, 2)}" height="2.2"/>`);
      } else {
        strips.push(`<rect x="0" y="${y}" width="${round(end + 180, 2)}" height="2.2"/>`);
        strips.push(`<rect x="${round(start + 180, 2)}" y="${y}" width="${round(180 - start, 2)}" height="2.2"/>`);
      }
    }
    return strips.join("");
  }

  function boundaryPolylines(declination, directLongitude, side) {
    const segments = [];
    let current = [];
    let previousX = null;
    for (let latitude = -89; latitude <= 89; latitude += 1) {
      const hourAngle = hourAngleDegrees(latitude, declination);
      if (hourAngle <= 0.001 || hourAngle >= 179.999) {
        if (current.length > 1) segments.push(current);
        current = [];
        previousX = null;
        continue;
      }
      const longitude = normalizeLongitude(directLongitude + side * hourAngle);
      const x = round(longitude + 180, 2);
      const y = 90 - latitude;
      if (previousX !== null && Math.abs(x - previousX) > 180) {
        if (current.length > 1) segments.push(current);
        current = [];
      }
      current.push(`${x},${y}`);
      previousX = x;
    }
    if (current.length > 1) segments.push(current);
    return segments.map((points) => `<polyline points="${points.join(" ")}"/>`).join("");
  }

  function landPaths() {
    return `<g class="terminator-land" aria-hidden="true">
      <path d="M18 36L39 20 70 15 103 28 117 44 105 59 90 70 78 76 64 65 59 52 39 50 25 60 10 53Z"/>
      <path d="M86 86L110 91 126 108 123 135 109 165 99 149 94 121Z"/>
      <path d="M135 13L161 7 175 22 162 39 142 33Z"/>
      <path d="M166 43L191 34 209 47 201 60 180 61 165 53Z"/>
      <path d="M177 64L203 58 224 78 216 113 198 145 182 124 171 91Z"/>
      <path d="M200 39L228 23 266 26 305 38 338 56 344 73 318 85 287 76 267 94 244 88 225 69 207 62Z"/>
      <path d="M281 116L316 109 341 129 332 151 300 154 283 136Z"/>
      <path d="M0 168L360 168 341 179 21 179Z"/>
    </g>`;
  }

  function gridPaths() {
    return `<g class="terminator-grid" aria-hidden="true"><path d="M60 0V180M120 0V180M180 0V180M240 0V180M300 0V180"/><path d="M0 30H360M0 60H360M0 90H360M0 120H360M0 150H360"/></g>`;
  }

  function dynamicMapLayer(date, place, utcMinutes) {
    const result = calculate(date, place, utcMinutes);
    const directX = round(result.direct_longitude + 180, 2);
    return `<rect class="terminator-night" width="360" height="180"/>
      <g class="terminator-day">${daylightStrips(date.declination, result.direct_longitude)}</g>
      <g class="terminator-morning" aria-label="晨线">${boundaryPolylines(date.declination, result.direct_longitude, -1)}</g>
      <g class="terminator-evening" aria-label="昏线">${boundaryPolylines(date.declination, result.direct_longitude, 1)}</g>
      <line class="terminator-direct-meridian" x1="${directX}" y1="0" x2="${directX}" y2="180"/>`;
  }

  function renderMap(date, place, utcMinutes, unlocked = false) {
    const result = calculate(date, place, utcMinutes);
    const targetX = round(Number(place.longitude) + 180, 2);
    const targetY = round(90 - Number(place.latitude), 2);
    return `<div class="terminator-map-wrap">
      <svg class="terminator-map" viewBox="0 0 360 180" role="img" aria-label="${unlocked ? "全球昼夜分布、晨线和昏线联动图" : "待解锁的全球晨昏线联动图"}">
        <rect class="terminator-map-base" width="360" height="180" rx="12"/>
        <g id="terminator-dynamic-layer">${unlocked ? dynamicMapLayer(date, place, utcMinutes) : ""}</g>
        ${landPaths()}${gridPaths()}
        <g class="terminator-target"><circle cx="${targetX}" cy="${targetY}" r="4"/><text x="${Math.min(targetX + 7, 328)}" y="${Math.max(targetY - 7, 12)}">${escapeHtml(place.name)}</text></g>
        ${unlocked ? "" : `<g class="terminator-lock"><rect x="72" y="68" width="216" height="44" rx="22"/><text x="180" y="86" text-anchor="middle">昼夜范围与晨昏线已隐藏</text><text x="180" y="102" text-anchor="middle">完成五步预测后解锁</text></g>`}
      </svg>
      <div class="terminator-map-legend"><span><i class="day"></i>白昼</span><span><i class="night"></i>黑夜</span><span><i class="morning"></i>晨线</span><span><i class="evening"></i>昏线</span></div>
      <div class="terminator-map-readout"><strong id="terminator-map-utc">UTC ${result.utc_time}</strong><span id="terminator-map-direct">直射经线 ${unlocked ? result.direct_longitude_label : "待预测"}</span><span id="terminator-map-local">${escapeHtml(place.name)}地方时 ${unlocked ? result.local_time : "待预测"}</span></div>
    </div>`;
  }

  function renderChoice(name, values) {
    return `<div class="terminator-choice-grid">${values.map((value) => `<label><input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"/><span>${escapeHtml(value)}</span></label>`).join("")}</div>`;
  }

  function renderLab({ lab, date, place, scenario, scenarioIndex = 0 }) {
    return `<div class="topic-meta">自然地理 · 宇宙中的地球及运动 · ${escapeHtml(scenario.id)}</div>
      <h2 class="page-title">晨昏线综合联动实验室</h2>
      <p class="page-subtitle">全球昼夜图默认可见；请在同一时刻完成五步预测，不要把所有晨线点都机械记成地方时6:00。</p>
      <section class="terminator-scene-bar"><div><span>情境 ${scenarioIndex + 1}/${lab.scenarios.length}</span><strong>${escapeHtml(date.name)} · UTC ${formatClock(scenario.utc_minutes)}</strong></div><div><span>目标地点</span><strong>${escapeHtml(place.name)} · ${latitudeLabel(place.latitude)}，${longitudeLabel(place.longitude)}</strong></div></section>
      <section class="card terminator-link-card"><div class="terminator-link-layout">
        <div class="terminator-model-panel">
          <div class="solar-model-head"><div><span class="pill orange">待推理情境</span><h3>${escapeHtml(scenario.focus)}</h3></div><span class="pill">${escapeHtml(date.date_hint)}</span></div>
          ${renderMap(date, place, scenario.utc_minutes, true)}
          <p class="motion-hint">${escapeHtml(lab.model_note)} 昼夜分布、直射经线和晨昏线默认可见。</p>
        </div>
        <form id="terminator-link-form" class="terminator-prediction-panel">
          <div class="notice">判断链：UTC → 直射经线地方时12:00 → 目标地地方时 → 当日昼长与日出日落 → 晨昏状态 → 极昼极夜。</div>
          <fieldset><legend>1. 太阳直射经线是：</legend><output id="terminator-direct-output" class="terminator-range-output">0°</output><input id="terminator-direct-prediction" name="terminator-direct" type="range" min="-180" max="180" step="1" value="0" aria-label="预测太阳直射经线"/></fieldset>
          <fieldset><legend>2. ${escapeHtml(place.name)}的地方时是：</legend><div class="time-parts"><input class="time-input" name="terminator-local-hour" data-time-part inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="时" autocomplete="off" aria-label="地方时小时"/><span class="time-separator" aria-hidden="true">:</span><input class="time-input" name="terminator-local-minute" data-time-part inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="分" autocomplete="off" aria-label="地方时分钟"/></div></fieldset>
          <fieldset><legend>3. ${escapeHtml(place.name)}当日昼长约为：</legend><output id="terminator-day-output" class="terminator-range-output">12.0小时</output><input id="terminator-day-prediction" name="terminator-day-length" type="range" min="0" max="24" step="0.5" value="12" aria-label="预测当日昼长"/></fieldset>
          <fieldset><legend>4. 此刻目标地点位于：</legend>${renderChoice("terminator-status", lab.choices.status)}</fieldset>
          <fieldset><legend>5. 此时全球极昼极夜分布：</legend>${renderChoice("terminator-polar", lab.choices.polar_pattern)}</fieldset>
          <label class="field-label" for="terminator-reasoning">判断链（选填）</label><textarea id="terminator-reasoning" name="terminator-reasoning" placeholder="例如：先由UTC找到地方时12时所在经线；再按经度差求目标地地方时；由日期和纬度估计昼长，推出日出日落；最后判断目标点和极圈范围。"></textarea>
          <button class="btn orange motion-submit" type="submit">提交五步预测</button>
        </form>
      </div></section>`;
  }

  function answerRow(label, userAnswer, correctAnswer, passed) {
    return `<div class="lab-check ${passed ? "passed" : "failed"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(userAnswer ?? "未填写")}</strong><small>${passed ? "判断正确" : `正确应为 ${escapeHtml(correctAnswer)}`}</small></div>`;
  }

  function renderResult({ lab, date, place, scenario, attempt }) {
    const correct = attempt.correct_answers;
    const checks = attempt.checks || {};
    return `<div class="topic-meta">宇宙中的地球及运动 · 已形成候选诊断</div>
      <h2 class="page-title">让五条信息在全球图上同时成立</h2>
      <p class="page-subtitle">本轮 ${attempt.score}/5。拖动UTC时刻，观察直射经线、晨昏线和${escapeHtml(place.name)}的昼夜状态如何同步改变。</p>
      <section class="card terminator-link-card"><div class="terminator-result-layout">
        <div>${renderMap(date, place, scenario.utc_minutes, true)}<label class="terminator-progress-caption" for="terminator-progress"><span>UTC 00:00</span><strong>拖动一天</strong><span>UTC 23:59</span></label><input id="terminator-progress" class="terminator-progress-slider" type="range" min="0" max="1439" step="1" value="${scenario.utc_minutes}" aria-label="拖动UTC时刻"/><p class="motion-hint">橙色虚线为太阳直射经线（地方时12:00）；绿色为晨线，红色为昏线。目标地点跨过两条线时，昼夜状态随之改变。</p></div>
        <div><div class="lab-check-grid">${answerRow("直射经线", longitudeLabel(attempt.answers.direct_longitude), correct.direct_longitude_label, checks.direct_longitude)}${answerRow(`${place.name}地方时`, attempt.answers.local_time, correct.local_time, checks.local_time)}${answerRow("当日昼长", `${Number(attempt.answers.day_length_hours).toFixed(1)}小时`, `${correct.day_length_hours.toFixed(1)}小时`, checks.day_length_hours)}${answerRow("此刻位置", attempt.answers.status, correct.status, checks.status)}${answerRow("极昼极夜", attempt.answers.polar_pattern, correct.polar_pattern, checks.polar_pattern)}</div>
          <div class="terminator-fact-strip"><div><span>日出地方时</span><strong>${escapeHtml(correct.sunrise_time)}</strong></div><div><span>日落地方时</span><strong>${escapeHtml(correct.sunset_time)}</strong></div><div><span>理论昼长</span><strong>${correct.day_length_exact.toFixed(1)}h</strong></div></div>
          <div class="answer-box ${attempt.score === 5 ? "correct" : "wrong"}"><strong>${escapeHtml(date.name)} · UTC ${correct.utc_time}</strong><br/>直射经线是${escapeHtml(correct.direct_longitude_label)}，${escapeHtml(place.name)}地方时${correct.local_time}，位于${escapeHtml(correct.status)}。只有赤道与晨昏线的交点稳定对应地方时6:00和18:00；其他纬度须由昼长反推日出日落。</div>
          <p><strong>橙子的判断链</strong></p><div class="quote">${escapeHtml(attempt.reasoning || "未填写")}</div>${attempt.error_tags.length ? `<div class="diagnosis"><strong>候选错因</strong><div class="tag-row">${attempt.error_tags.map((tag) => `<span class="pill orange">${escapeHtml(lab.error_tags[tag] || tag)}</span>`).join("")}</div></div>` : `<div class="notice">五步均正确。请家长拖动UTC滑轨到另一个时刻，追问“哪些量改变、哪些量只由日期和纬度决定”，检验是否真正理解联动关系。</div>`}
          <div class="btn-row"><button class="btn orange" data-action="next-terminator-link">换情境继续</button><button class="btn secondary" data-action="goto" data-route="parent">交给家长确认</button></div>
        </div>
      </div></section>`;
  }

  function updateDirectPrediction(rawLongitude) {
    if (typeof document === "undefined") return;
    const output = document.querySelector("#terminator-direct-output");
    if (output) output.textContent = longitudeLabel(Number(rawLongitude));
  }

  function updateDayPrediction(rawHours) {
    if (typeof document === "undefined") return;
    const output = document.querySelector("#terminator-day-output");
    if (output) output.textContent = `${Number(rawHours).toFixed(1)}小时`;
  }

  function updateProgress(rawUtcMinutes, date, place) {
    if (typeof document === "undefined" || !date || !place) return;
    const result = calculate(date, place, Number(rawUtcMinutes));
    const layer = document.querySelector("#terminator-dynamic-layer");
    if (layer) layer.innerHTML = dynamicMapLayer(date, place, Number(rawUtcMinutes));
    const utc = document.querySelector("#terminator-map-utc");
    const direct = document.querySelector("#terminator-map-direct");
    const local = document.querySelector("#terminator-map-local");
    if (utc) utc.textContent = `UTC ${result.utc_time}`;
    if (direct) direct.textContent = `直射经线 ${result.direct_longitude_label}`;
    if (local) local.textContent = `${place.name}地方时 ${result.local_time} · ${result.status}`;
  }

  coach.features.terminatorLink = Object.freeze({
    calculate, dayLengthHours, hourAngleDegrees, longitudeLabel, renderLab, renderResult,
    updateDirectPrediction, updateDayPrediction, updateProgress
  });
})(typeof window !== "undefined" ? window : globalThis);
