(function registerHomeFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function actionAttributes(item) {
    const route = item.route ? ` data-route="${escapeHtml(item.route)}"` : "";
    return `data-action="${escapeHtml(item.action)}"${route}`;
  }

  function renderToday(model) {
    const recommendation = model.recommendation || {};
    const recent = model.recent || [];
    return `
      <div class="today-heading">
        <div><span class="section-kicker">今日建议</span><h2 class="page-title">先完成一条有价值的学习证据</h2></div>
        <button class="text-button" data-action="goto" data-route="projects">查看全部项目</button>
      </div>
      <p class="page-subtitle">首页只回答“今天先做什么”。诊断题可从底部“诊断”直接进入，全部学习内容仍可在“项目”页查看。</p>
      <section class="card today-focus-card" data-accent="${escapeHtml(recommendation.accent || "teal")}">
        <div class="today-focus-copy">
          <span class="pill orange">${escapeHtml(recommendation.eyebrow || "下一步")}</span>
          <h2>${escapeHtml(recommendation.title || "暂无学习项目")}</h2>
          <p>${escapeHtml(recommendation.reason || "项目数据加载后，这里会给出可解释的下一步建议。")}</p>
          ${recommendation.status ? `<div class="evidence-line">依据：${escapeHtml(recommendation.status)}</div>` : ""}
        </div>
        ${recommendation.action ? `<button class="btn orange today-primary-action" ${actionAttributes(recommendation)}>${escapeHtml(recommendation.cta || "开始")}</button>` : ""}
      </section>
      <section class="stat-grid home-stat-grid" aria-label="学习概况">
        ${(model.stats || []).map((stat) => `<div class="stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`).join("")}
      </section>
      <section class="card compact-card">
        <div class="section-head"><div><span class="section-kicker">学习证据</span><h3>最近记录</h3></div><button class="text-button" data-action="goto" data-route="parent">家长审核</button></div>
        ${recent.length ? `<div class="evidence-list">${recent.map((item) => `
          <div class="evidence-item">
            <div><strong>${escapeHtml(item.title)}</strong><div class="topic-meta">${escapeHtml(item.meta)}</div></div>
            <span class="pill ${escapeHtml(item.tone || "")}">${escapeHtml(item.status)}</span>
          </div>`).join("")}</div>` : `<div class="empty">还没有记录。第一条记录不需要完美，只需要真实。</div>`}
      </section>
      <div class="notice">家长提示：先问“你为什么这样判断”，不要在橙子作答前直接讲答案。</div>
    `;
  }

  function renderProjects(model) {
    const projects = model.projects || [];
    return `
      <div class="projects-heading"><div><span class="section-kicker">学习项目</span><h2 class="page-title">把专题、诊断与复测分开管理</h2></div><span class="pill">${projects.length} 个项目</span></div>
      <p class="page-subtitle">每个项目都有独立目标和证据记录。新增专题时只需登记到项目清单，不再继续堆叠首页。</p>
      <section class="project-grid">
        ${projects.map((project) => `
          <article class="card project-card" data-accent="${escapeHtml(project.accent || "teal")}">
            <div class="project-card-head"><div><span class="project-type">${escapeHtml(project.eyebrow)}</span><h3>${escapeHtml(project.title)}</h3></div><span class="pill ${escapeHtml(project.status_tone || "")}">${escapeHtml(project.status_label)}</span></div>
            <p>${escapeHtml(project.summary)}</p>
            <div class="project-evidence">${escapeHtml(project.status_detail)}</div>
            <button class="btn ${project.accent === "orange" ? "orange" : "secondary"}" ${actionAttributes(project)}>${escapeHtml(project.cta)}</button>
          </article>`).join("")}
      </section>
      <section class="card project-principle-card">
        <span class="section-kicker">共同规则</span>
        <h3>所有项目共用一条掌握标准</h3>
        <p>先留下真实判断，再形成候选错因；家长确认后安排延迟复测。一次答对或看过解析，都不直接算“已掌握”。</p>
      </section>
    `;
  }

  coach.features.home = Object.freeze({ renderToday, renderProjects });
})(typeof window !== "undefined" ? window : globalThis);
