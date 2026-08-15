(function registerLearningExportFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function pad(value) { return String(value).padStart(2, "0"); }

  function localTimestamp(date) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`;
  }

  function compactTimestamp(date) {
    return localTimestamp(date).replace(/:/g, "-");
  }

  function exportFilename(date = new Date()) {
    return `orange-geography-records-${compactTimestamp(date)}.json`;
  }

  function aggregateErrorTags(state) {
    const counts = new Map();
    const add = (tag) => {
      if (!tag || tag === "答对，仍需检查是否理解") return;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    };
    (state.attempts || []).forEach((attempt) => add(attempt.error_tag_candidate));
    (state.timeLabAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.earthMotionAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.solarSeasonAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.solarPathAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.annualSunAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.orbitSpeedAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.terminatorLinkAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.rotationSpeedAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.dateRangeAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.axialTiltAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.celestialScaleAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.habitabilityAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.solarActivityAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.moonPhaseAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.eclipseAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.tideAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    (state.coriolisAttempts || []).forEach((attempt) => (attempt.error_tags || []).forEach(add));
    return [...counts.entries()]
      .map(([error_tag, count]) => ({ error_tag, count }))
      .sort((a, b) => b.count - a.count || a.error_tag.localeCompare(b.error_tag));
  }

  function buildTopicSummary(state, context) {
    const questionById = new Map((context.questions || []).map((question) => [question.id, question]));
    const topicById = new Map((context.topics || []).map((topic) => [topic.id, topic]));
    const grouped = new Map();
    (state.attempts || []).forEach((attempt) => {
      const topicId = questionById.get(attempt.question_id)?.topic_id || "unknown";
      const entry = grouped.get(topicId) || { topic_id: topicId, topic_name: topicById.get(topicId)?.name || topicId, attempts: 0, correct: 0, confirmed: 0 };
      entry.attempts += 1;
      entry.correct += attempt.is_correct ? 1 : 0;
      entry.confirmed += attempt.parent_review_status === "已确认" ? 1 : 0;
      grouped.set(topicId, entry);
    });
    return [...grouped.values()].map((entry) => ({
      ...entry,
      correct_rate: entry.attempts ? Math.round((entry.correct / entry.attempts) * 100) : 0
    }));
  }

  function countPendingReview(state) {
    const all = [
      ...(state.attempts || []),
      ...(state.retestAttempts || []),
      ...(state.timeLabAttempts || []),
      ...(state.earthMotionAttempts || []),
      ...(state.solarSeasonAttempts || []),
      ...(state.solarPathAttempts || []),
      ...(state.annualSunAttempts || []),
      ...(state.orbitSpeedAttempts || []),
      ...(state.terminatorLinkAttempts || []),
      ...(state.rotationSpeedAttempts || []),
      ...(state.dateRangeAttempts || []),
      ...(state.axialTiltAttempts || []),
      ...(state.celestialScaleAttempts || []),
      ...(state.habitabilityAttempts || []),
      ...(state.solarActivityAttempts || []),
      ...(state.moonPhaseAttempts || []),
      ...(state.eclipseAttempts || []),
      ...(state.tideAttempts || []),
      ...(state.coriolisAttempts || [])
    ];
    return all.filter((attempt) => String(attempt.parent_review_status || "").startsWith("待")).length;
  }

  function latestByTime(records) {
    return [...records].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0] || null;
  }

  function buildProjectSummary(state) {
    const diagnostic = state.attempts || [];
    const retests = state.retestAttempts || [];
    const timeLab = state.timeLabAttempts || [];
    const earthMotion = state.earthMotionAttempts || [];
    const solarSeason = state.solarSeasonAttempts || [];
    const solarPath = state.solarPathAttempts || [];
    const annualSun = state.annualSunAttempts || [];
    const orbitSpeed = state.orbitSpeedAttempts || [];
    const terminatorLink = state.terminatorLinkAttempts || [];
    const rotationSpeed = state.rotationSpeedAttempts || [];
    const dateRange = state.dateRangeAttempts || [];
    const axialTilt = state.axialTiltAttempts || [];
    const celestialScale = state.celestialScaleAttempts || [];
    const habitability = state.habitabilityAttempts || [];
    const solarActivity = state.solarActivityAttempts || [];
    const moonPhase = state.moonPhaseAttempts || [];
    const eclipse = state.eclipseAttempts || [];
    const tide = state.tideAttempts || [];
    const coriolis = state.coriolisAttempts || [];
    const latestTime = latestByTime(timeLab);
    const latestMotion = latestByTime(earthMotion);
    const latestSolar = latestByTime(solarSeason);
    const latestPath = latestByTime(solarPath);
    const latestAnnual = latestByTime(annualSun);
    const latestOrbit = latestByTime(orbitSpeed);
    const latestLink = latestByTime(terminatorLink);
    const latestRotation = latestByTime(rotationSpeed);
    const latestDateRange = latestByTime(dateRange);
    const latestAxialTilt = latestByTime(axialTilt);
    const latestCelestialScale = latestByTime(celestialScale);
    const latestHabitability = latestByTime(habitability);
    const latestSolarActivity = latestByTime(solarActivity);
    const latestMoonPhase = latestByTime(moonPhase);
    const latestEclipse = latestByTime(eclipse);
    const latestTide = latestByTime(tide);
    const latestCoriolis = latestByTime(coriolis);
    return [
      {
        project_id: "diagnostic-questions",
        records: diagnostic.length,
        correct: diagnostic.filter((attempt) => attempt.is_correct).length,
        confirmed: diagnostic.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "time-zone-lab",
        records: timeLab.length,
        latest_score: latestTime?.score ?? null,
        confirmed: timeLab.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "earth-motion-lab",
        records: earthMotion.length,
        latest_score: latestMotion?.score ?? null,
        confirmed: earthMotion.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "solar-season-lab",
        records: solarSeason.length,
        latest_score: latestSolar?.score ?? null,
        confirmed: solarSeason.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "solar-path-lab",
        records: solarPath.length,
        latest_score: latestPath?.score ?? null,
        confirmed: solarPath.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "annual-sun-lab",
        records: annualSun.length,
        latest_score: latestAnnual?.score ?? null,
        confirmed: annualSun.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "orbit-speed-lab",
        records: orbitSpeed.length,
        latest_score: latestOrbit?.score ?? null,
        confirmed: orbitSpeed.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "terminator-link-lab",
        records: terminatorLink.length,
        latest_score: latestLink?.score ?? null,
        confirmed: terminatorLink.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "rotation-speed-lab",
        records: rotationSpeed.length,
        latest_score: latestRotation?.score ?? null,
        confirmed: rotationSpeed.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "date-range-lab",
        records: dateRange.length,
        latest_score: latestDateRange?.score ?? null,
        confirmed: dateRange.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "axial-tilt-lab",
        records: axialTilt.length,
        latest_score: latestAxialTilt?.score ?? null,
        confirmed: axialTilt.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "celestial-scale-lab",
        records: celestialScale.length,
        latest_score: latestCelestialScale?.score ?? null,
        confirmed: celestialScale.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "habitability-lab",
        records: habitability.length,
        latest_score: latestHabitability?.score ?? null,
        confirmed: habitability.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "solar-activity-lab",
        records: solarActivity.length,
        latest_score: latestSolarActivity?.score ?? null,
        confirmed: solarActivity.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "moon-phase-lab",
        records: moonPhase.length,
        latest_score: latestMoonPhase?.score ?? null,
        confirmed: moonPhase.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "eclipse-lab",
        records: eclipse.length,
        latest_score: latestEclipse?.score ?? null,
        confirmed: eclipse.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "tide-lab",
        records: tide.length,
        latest_score: latestTide?.score ?? null,
        confirmed: tide.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "coriolis-lab",
        records: coriolis.length,
        latest_score: latestCoriolis?.score ?? null,
        confirmed: coriolis.filter((attempt) => attempt.parent_review_status === "已确认").length
      },
      {
        project_id: "delayed-retests",
        records: retests.length,
        mastered: retests.filter((attempt) => attempt.parent_review_status === "已掌握").length
      }
    ];
  }

  function activityWindow(state) {
    const timestamps = [
      ...(state.attempts || []),
      ...(state.retestAttempts || []),
      ...(state.timeLabAttempts || []),
      ...(state.earthMotionAttempts || []),
      ...(state.solarSeasonAttempts || []),
      ...(state.solarPathAttempts || []),
      ...(state.annualSunAttempts || []),
      ...(state.orbitSpeedAttempts || []),
      ...(state.terminatorLinkAttempts || []),
      ...(state.rotationSpeedAttempts || []),
      ...(state.dateRangeAttempts || []),
      ...(state.axialTiltAttempts || []),
      ...(state.celestialScaleAttempts || []),
      ...(state.habitabilityAttempts || []),
      ...(state.solarActivityAttempts || []),
      ...(state.moonPhaseAttempts || []),
      ...(state.eclipseAttempts || []),
      ...(state.tideAttempts || []),
      ...(state.coriolisAttempts || [])
    ].map((attempt) => attempt.submitted_at).filter(Boolean).sort();
    return { first_recorded_at: timestamps[0] || null, last_recorded_at: timestamps[timestamps.length - 1] || null };
  }

  function canonicalJson(value) {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function mergeAnnotatedArchive(currentState, importedState) {
    const groups = ["attempts", "retestAttempts", "timeLabAttempts", "earthMotionAttempts", "solarSeasonAttempts", "solarPathAttempts", "annualSunAttempts", "orbitSpeedAttempts", "terminatorLinkAttempts", "rotationSpeedAttempts", "dateRangeAttempts", "axialTiltAttempts", "celestialScaleAttempts", "habitabilityAttempts", "solarActivityAttempts", "moonPhaseAttempts", "eclipseAttempts", "tideAttempts", "coriolisAttempts"];
    for (const group of groups) {
      const currentById = new Map((currentState[group] || []).map((record) => [record.id, record]));
      for (const importedRecord of importedState[group] || []) {
        const currentRecord = currentById.get(importedRecord.id);
        if (!currentRecord || canonicalJson(currentRecord) !== canonicalJson(importedRecord)) {
          return { ok: false, reason: `原始记录 ${importedRecord.id || "缺少编号"} 与当前浏览器不一致，已停止导入，避免覆盖学习证据。` };
        }
      }
    }
    const existingIds = new Set((currentState.coachAnnotations || []).map((annotation) => annotation.id));
    const additions = (importedState.coachAnnotations || []).filter((annotation) => annotation?.id && !existingIds.has(annotation.id));
    return { ok: true, coachAnnotations: [...(currentState.coachAnnotations || []), ...additions], added: additions.length };
  }

  function buildPacket({ state, context = {}, now = new Date(), config = {} }) {
    const attempts = state.attempts || [];
    const retestAttempts = state.retestAttempts || [];
    const timeLabAttempts = state.timeLabAttempts || [];
    const earthMotionAttempts = state.earthMotionAttempts || [];
    const solarSeasonAttempts = state.solarSeasonAttempts || [];
    const solarPathAttempts = state.solarPathAttempts || [];
    const annualSunAttempts = state.annualSunAttempts || [];
    const orbitSpeedAttempts = state.orbitSpeedAttempts || [];
    const terminatorLinkAttempts = state.terminatorLinkAttempts || [];
    const rotationSpeedAttempts = state.rotationSpeedAttempts || [];
    const dateRangeAttempts = state.dateRangeAttempts || [];
    const axialTiltAttempts = state.axialTiltAttempts || [];
    const celestialScaleAttempts = state.celestialScaleAttempts || [];
    const habitabilityAttempts = state.habitabilityAttempts || [];
    const solarActivityAttempts = state.solarActivityAttempts || [];
    const moonPhaseAttempts = state.moonPhaseAttempts || [];
    const eclipseAttempts = state.eclipseAttempts || [];
    const tideAttempts = state.tideAttempts || [];
    const coriolisAttempts = state.coriolisAttempts || [];
    const allCount = attempts.length + retestAttempts.length + timeLabAttempts.length + earthMotionAttempts.length + solarPathAttempts.length + solarSeasonAttempts.length + annualSunAttempts.length + orbitSpeedAttempts.length + terminatorLinkAttempts.length + rotationSpeedAttempts.length + dateRangeAttempts.length + axialTiltAttempts.length + celestialScaleAttempts.length + habitabilityAttempts.length + solarActivityAttempts.length + moonPhaseAttempts.length + eclipseAttempts.length + tideAttempts.length + coriolisAttempts.length;
    const exportedAt = now.toISOString();
    const compactId = exportedAt.replace(/[-:.Z]/g, "");
    return {
      version: state.version,
      export_schema_version: config.EXPORT_SCHEMA_VERSION || "0.21.2",
      export_id: `EXPORT-${compactId}`,
      exported_at: exportedAt,
      exported_at_local: localTimestamp(now),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      app_version: config.APP_VERSION || "0.21.2",
      student_alias: config.STUDENT_ALIAS || "橙子",
      privacy_note: "档案默认不含姓名、学校、班级和联系方式；交给AI或教师前仍请人工检查自由文本。",
      summary: {
        total_learning_records: allCount,
        diagnostic_attempts: attempts.length,
        diagnostic_correct: attempts.filter((attempt) => attempt.is_correct).length,
        retest_attempts: retestAttempts.length,
        time_lab_attempts: timeLabAttempts.length,
        earth_motion_attempts: earthMotionAttempts.length,
        solar_season_attempts: solarSeasonAttempts.length,
        solar_path_attempts: solarPathAttempts.length,
        annual_sun_attempts: annualSunAttempts.length,
        orbit_speed_attempts: orbitSpeedAttempts.length,
        terminator_link_attempts: terminatorLinkAttempts.length,
        rotation_speed_attempts: rotationSpeedAttempts.length,
        date_range_attempts: dateRangeAttempts.length,
        axial_tilt_attempts: axialTiltAttempts.length,
        celestial_scale_attempts: celestialScaleAttempts.length,
        habitability_attempts: habitabilityAttempts.length,
        solar_activity_attempts: solarActivityAttempts.length,
        moon_phase_attempts: moonPhaseAttempts.length,
        eclipse_attempts: eclipseAttempts.length,
        tide_attempts: tideAttempts.length,
        coriolis_attempts: coriolisAttempts.length,
        pending_parent_reviews: countPendingReview(state),
        activity_window: activityWindow(state),
        by_project: buildProjectSummary(state),
        by_topic: buildTopicSummary(state, context),
        candidate_error_tags: aggregateErrorTags(state)
      },
      attempts,
      retest_attempts: retestAttempts,
      time_lab_attempts: timeLabAttempts,
      earth_motion_attempts: earthMotionAttempts,
      solar_season_attempts: solarSeasonAttempts,
      solar_path_attempts: solarPathAttempts,
      annual_sun_attempts: annualSunAttempts,
      orbit_speed_attempts: orbitSpeedAttempts,
      terminator_link_attempts: terminatorLinkAttempts,
      rotation_speed_attempts: rotationSpeedAttempts,
      date_range_attempts: dateRangeAttempts,
      axial_tilt_attempts: axialTiltAttempts,
      celestial_scale_attempts: celestialScaleAttempts,
      habitability_attempts: habitabilityAttempts,
      solar_activity_attempts: solarActivityAttempts,
      moon_phase_attempts: moonPhaseAttempts,
      eclipse_attempts: eclipseAttempts,
      tide_attempts: tideAttempts,
      coriolis_attempts: coriolisAttempts,
      coach_annotations: state.coachAnnotations || [],
      annotation_guide: {
        purpose: "请基于学习证据批注进展，并把批注追加到 coach_annotations；不要修改原始作答记录。",
        principles: [
          "错因只能标为候选或已确认，证据不足时必须明确说明。",
          "不把一次答对、一次满分或看过解析当成稳定掌握。",
          "下一步应是可执行的微任务或延迟复测，并说明依据。"
        ],
        expected_annotation_shape: {
          id: "COACH-唯一编号",
          created_at: "ISO 8601 时间",
          coach: "批注者或AI名称",
          scope: "本次批注覆盖的主题或记录",
          evidence_refs: ["引用的作答或实验记录 id"],
          status: "候选|已确认|需教师复核",
          observation: "基于证据的进展判断",
          next_step: "下一步微任务或复测建议",
          follow_up_at: "可选，ISO 8601 复测时间"
        }
      }
    };
  }

  coach.features.learningExport = Object.freeze({ buildPacket, exportFilename, localTimestamp, mergeAnnotatedArchive });
})(typeof window !== "undefined" ? window : globalThis);
