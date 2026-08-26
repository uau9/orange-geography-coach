(function registerRegionReviewFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function textbookPageImages(module, day) {
    const base = module.textbook.image_base;
    return Array.from({ length: day.pdf_page_end - day.pdf_page_start + 1 }, (_, index) => {
      const pdfPage = day.pdf_page_start + index;
      const textbookPage = day.textbook_page_start + index;
      return {
        pdfPage,
        textbookPage,
        src: `${base}/page-${String(pdfPage).padStart(3, "0")}.jpg`
      };
    });
  }

  function renderTextbookPages(module, day, options = {}) {
    const images = textbookPageImages(module, day);
    const prompt = options.prompt || `查看${day.textbook_pages}图片`;
    const idPrefix = options.idPrefix || `day-${day.day}`;
    return `<details class="textbook-inline-viewer" data-textbook-day="${day.day}">
      <summary><span class="textbook-summary-icon">课本</span><span><strong>${escapeHtml(prompt)}</strong><small>${images.length}页 · 点按页面可查看原尺寸</small></span></summary>
      <div class="textbook-page-grid">
        ${images.map((image) => `<figure class="textbook-page-card" id="${escapeHtml(idPrefix)}-page-${image.textbookPage}">
          <a href="${escapeHtml(image.src)}" target="_blank" rel="noopener"><img src="${escapeHtml(image.src)}" alt="区域发展教材第${image.textbookPage}页" loading="lazy" decoding="async" /></a>
          <figcaption>教材第${image.textbookPage}页 · PDF第${image.pdfPage}页</figcaption>
        </figure>`).join("")}
      </div>
    </details>`;
  }

  function renderQuestion(question) {
    const status = question.attempt
      ? question.attempt.parent_review_status === "已确认"
        ? { label: "已确认", tone: "green" }
        : { label: question.attempt.is_correct ? "已作答" : "待复盘", tone: "orange" }
      : { label: "未作答", tone: "" };
    return `<div class="region-question-row">
      <div><strong>${escapeHtml(question.title)}</strong><small>${escapeHtml(question.source)}</small></div>
      <span class="pill ${status.tone}">${status.label}</span>
      <button class="btn secondary" data-action="start-question" data-question-id="${escapeHtml(question.id)}">${question.attempt ? "再做一次" : "开始作答"}</button>
    </div>`;
  }

  function renderDay(module, day, activeDay) {
    return `<details class="region-day-card" data-region-day="${day.day}" ${day.day === activeDay ? "open" : ""}>
      <summary class="region-day-summary">
        <span class="region-day-number">DAY ${day.day}</span>
        <span class="region-day-title"><strong>${escapeHtml(day.title)}</strong><small>${escapeHtml(day.textbook_pages)} · ${day.total}道题</small></span>
        <span class="pill ${day.completed === day.total ? "green" : "orange"}">${day.completed}/${day.total}</span>
      </summary>
      <div class="region-day-body">
        <p>${escapeHtml(day.goal)}</p>
        <div class="region-day-primary-actions">
          <button class="btn orange" data-action="start-region-day-question" data-day="${day.day}">${day.completed ? "继续本日题目" : "开始本日题目"}</button>
        </div>
        ${renderTextbookPages(module, day, { prompt: `先看教材第${day.textbook_page_start}—${day.textbook_page_end}页`, idPrefix: `review-day-${day.day}` })}
        <div class="region-reading-task"><strong>读教材时完成两件事</strong><ol>${day.reading_prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol></div>
        <div class="region-question-list">${day.questions.map(renderQuestion).join("")}</div>
      </div>
    </details>`;
  }

  function renderChapter(module, chapter, activeDay) {
    const containsActiveDay = activeDay >= chapter.day_start && activeDay <= chapter.day_end;
    const completed = chapter.days.reduce((sum, day) => sum + day.completed, 0);
    const total = chapter.days.reduce((sum, day) => sum + day.total, 0);
    return `<details class="region-chapter-card" ${containsActiveDay ? "open" : ""}>
      <summary class="region-chapter-summary"><span><small>第${chapter.number}章</small><strong>${escapeHtml(chapter.title)}</strong></span><span class="curriculum-summary-meta"><span class="pill ${completed === total ? "green" : ""}">${completed}/${total}题</span><span class="pill">DAY ${chapter.day_start}—${chapter.day_end}</span></span></summary>
      <div class="region-chapter-body">${chapter.days.map((day) => renderDay(module, day, activeDay)).join("")}</div>
    </details>`;
  }

  function renderRetest(retest) {
    return `<div class="region-retest-row">
      <div><strong>${escapeHtml(retest.title)}</strong><small>${escapeHtml(retest.source_label)} · ${escapeHtml(retest.review_label)}</small></div>
      <span class="pill ${retest.attempt?.parent_review_status === "已掌握" ? "green" : ""}">${escapeHtml(retest.attempt?.parent_review_status || "待复测")}</span>
      <button class="btn secondary" data-action="start-retest" data-retest-id="${escapeHtml(retest.id)}">开始复测</button>
    </div>`;
  }

  function render(model) {
    const module = model.module;
    const focusDay = model.days.find((day) => day.day === model.activeDay) || model.days[0];
    return `
      <div class="learning-breadcrumb"><button class="text-button" data-action="goto" data-route="projects">学习目录</button><span>›</span><strong>选择性必修2·区域发展</strong></div>
      <div class="region-review-heading">
        <div><span class="section-kicker">选择性必修2 · 四章</span><h2 class="page-title">区域发展14天复习</h2></div>
        <span class="pill orange">${model.completedQuestions}/${model.totalQuestions}题</span>
      </div>
      <p class="page-subtitle">先看教材页面，再做资料包原题；页面只展开当前章与当前学习日。</p>
      <section class="card region-focus-card">
        <div><span class="section-kicker">继续学习</span><h3>DAY ${focusDay.day} · ${escapeHtml(focusDay.title)}</h3><p>${escapeHtml(focusDay.goal)}</p></div>
        <div class="region-focus-actions">
          <button class="btn secondary" data-action="open-region-day" data-day="${focusDay.day}">查看本日安排</button>
          <button class="btn orange" data-action="start-region-day-question" data-day="${focusDay.day}">${focusDay.completed ? "继续做题" : "开始本日"}</button>
        </div>
      </section>
      <section class="region-chapter-list" aria-label="区域发展四章学习目录">${model.chapters.map((chapter) => renderChapter(module, chapter, model.activeDay)).join("")}</section>
      <details class="card region-method-card">
        <summary><span><span class="section-kicker">区域分析证据链</span><strong>需要时展开7步分析法</strong></span></summary>
        <div class="region-reasoning-steps">${module.reasoning_steps.map((step) => `<div><span>${step.order}</span><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.prompt)}</small></div>`).join("")}</div>
      </details>
      <details class="card region-retest-card">
        <summary><span><span class="section-kicker">延迟复测</span><strong>完成14天后再展开</strong></span><span class="pill">2组资料包题</span></summary>
        <p class="small">第一组建议完成14天诊断后间隔2天，第二组建议间隔5天。复测题同样来自资料包。</p>
        <div class="region-retest-list">${model.retests.map(renderRetest).join("")}</div>
      </details>
      <details class="card region-parent-card">
        <summary><span><span class="section-kicker">家长介入</span><strong>审核证据清单</strong></span></summary>
        <ul>${module.parent_checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </details>`;
  }

  coach.features.regionReview = Object.freeze({ render, renderTextbookPages, textbookPageImages });
})(typeof window !== "undefined" ? window : globalThis);
