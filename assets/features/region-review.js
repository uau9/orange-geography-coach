(function registerRegionReviewFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
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

  function renderDay(day) {
    return `<section class="card region-day-card">
      <div class="region-day-head">
        <div><span class="section-kicker">DAY ${day.day}</span><h3>${escapeHtml(day.title)}</h3></div>
        <span class="pill ${day.completed === day.total ? "green" : "orange"}">${day.completed}/${day.total} 道</span>
      </div>
      <p>${escapeHtml(day.goal)}</p>
      <div class="region-reading-card">
        <div><strong>${escapeHtml(day.textbook_pages)}</strong><small>${escapeHtml(day.pdf_pages)} · ${escapeHtml(day.source_label)}</small></div>
        ${day.textbook_href ? `<a class="btn secondary" href="${escapeHtml(day.textbook_href)}" target="_blank" rel="noopener">打开教材页</a>` : `<span class="pill">教材PDF不随站点发布</span>`}
      </div>
      <ol class="region-reading-prompts">${day.reading_prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol>
      <div class="region-question-list">${day.questions.map(renderQuestion).join("")}</div>
    </section>`;
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
    return `
      <div class="region-review-heading">
        <div><span class="section-kicker">选择性必修2 · 四章</span><h2 class="page-title">${escapeHtml(module.title)}</h2></div>
        <span class="pill orange">橙子专用 · 14天</span>
      </div>
      <p class="page-subtitle">${escapeHtml(module.subtitle)} · 先读教材和完整材料，再作答；提交前不显示答案或评分点。</p>
      <section class="card region-source-card">
        <div><span class="section-kicker">材料边界</span><h3>教材页 + 资料包原题</h3></div>
        <p>${escapeHtml(module.source_note)}</p>
        ${module.textbook.path ? `<a class="btn secondary" href="${escapeHtml(module.textbook.path)}#page=7" target="_blank" rel="noopener">打开教材</a>` : `<div class="notice">网页保留教材页码索引；请在家中资料目录打开教材PDF对照阅读。</div>`}
      </section>
      <section class="card region-method-card">
        <span class="section-kicker">区域分析证据链</span><h3>每题都按7步找证据</h3>
        <div class="region-reasoning-steps">${module.reasoning_steps.map((step) => `<div><span>${step.order}</span><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.prompt)}</small></div>`).join("")}</div>
      </section>
      <div class="region-day-list">${model.days.map(renderDay).join("")}</div>
      <section class="card region-retest-card">
        <div class="section-head"><div><span class="section-kicker">延迟复测</span><h3>换材料验证迁移</h3></div><span class="pill">先间隔再做</span></div>
        <p class="small">第一组建议完成14天诊断后间隔2天，第二组建议间隔5天。复测题同样来自资料包，图表和文字材料完整保留。</p>
        <div class="region-retest-list">${model.retests.map(renderRetest).join("")}</div>
      </section>
      <section class="card region-parent-card">
        <span class="section-kicker">家长介入</span><h3>只审核证据，不提前讲答案</h3>
        <ul>${module.parent_checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>`;
  }

  coach.features.regionReview = Object.freeze({ render });
})(typeof window !== "undefined" ? window : globalThis);
