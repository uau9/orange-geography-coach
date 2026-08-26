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
        <button class="text-button" data-action="goto" data-route="projects">打开学习目录</button>
      </div>
      <p class="page-subtitle">首页只回答“今天先做什么”。底部“学习”进入课程，“题目”进入全题库。</p>
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

  function renderProjectCard(project) {
    return `
      <article class="card project-card" data-accent="${escapeHtml(project.accent || "teal")}">
        <div class="project-card-head"><div><span class="project-type">${escapeHtml(project.eyebrow)}</span><h3>${escapeHtml(project.title)}</h3></div><span class="pill ${escapeHtml(project.status_tone || "")}">${escapeHtml(project.status_label)}</span></div>
        <p>${escapeHtml(project.summary)}</p>
        <div class="project-evidence">${escapeHtml(project.status_detail)}</div>
        <div class="project-card-actions">
          <button class="btn ${project.accent === "orange" ? "orange" : "secondary"}" ${actionAttributes(project)}>${escapeHtml(project.cta)}</button>
          ${project.id === "diagnostic-questions" ? `<button class="btn secondary" data-action="open-diagnostic-catalog">查看题目目录</button>` : ""}
        </div>
      </article>`;
  }

  function renderProjects(model) {
    const projects = model.projects || [];
    const utilities = model.utilities || [];
    const books = model.books || [];
    const supplemental = model.supplemental;
    const focus = projects.find((project) => project.id === "region-development-review");
    const withoutFocus = (items = []) => items.filter((project) => project.id !== focus?.id);
    const navigableBooks = books.map((book) => ({
      ...book,
      chapters: book.chapters.filter((chapter) => chapter.sections.some((section) => withoutFocus(section.projects).length))
    })).filter((book) => book.chapters.length);
    const structured = utilities.length || navigableBooks.length || supplemental?.projects?.length;
    return `
      <div class="projects-heading"><div><span class="section-kicker">学习</span><h2 class="page-title">学习目录</h2></div><span class="pill">${projects.length} 个项目</span></div>
      <p class="page-subtitle">先继续正在学习的内容；需要查找其他专题时，再按教材章节展开。每次只展开一层。</p>
      ${focus ? `<section class="project-directory-section learning-focus-section"><div class="section-head"><div><span class="section-kicker">正在学习</span><h3>选择性必修2·区域发展</h3></div></div>${renderProjectCard(focus)}</section>` : ""}
      ${structured ? `
        <section class="project-directory-section">
          <div class="section-head"><div><span class="section-kicker">快捷工具</span><h3>题目与掌握验证</h3></div></div>
          <div class="project-grid">${utilities.map(renderProjectCard).join("")}</div>
        </section>
        ${navigableBooks.map((book) => `
          <section class="curriculum-book-block project-book-block">
            <div class="curriculum-book-heading"><div><span class="section-kicker">教材学习</span><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.publisher)}</p></div></div>
            <div class="curriculum-chapter-list">
              ${book.chapters.map((chapter) => {
                const chapterCount = chapter.sections.reduce((sum, section) => sum + withoutFocus(section.projects).length, 0);
                return `<details class="curriculum-chapter project-chapter">
                  <summary><span><small>第${chapter.number}章</small><strong>${escapeHtml(chapter.title)}</strong></span><span class="curriculum-summary-meta"><span class="pill ${escapeHtml(chapter.status_model.tone)}">${escapeHtml(chapter.status_model.label)}</span><span class="pill">${chapterCount} 个项目</span></span></summary>
                  <div class="curriculum-chapter-body">
                    ${chapter.sections.map((section) => { const sectionProjects = withoutFocus(section.projects); return `<div class="curriculum-project-section"><div class="curriculum-section-heading"><span>第${section.number}节</span><strong>${escapeHtml(section.title)}</strong><small>${sectionProjects.length} 个项目</small></div>${sectionProjects.length ? `<div class="project-grid">${sectionProjects.map(renderProjectCard).join("")}</div>` : `<div class="curriculum-empty">本节内容已并入上方主学习任务或尚未登记。</div>`}</div>`; }).join("")}
                    <div class="curriculum-research"><span>问题研究</span>${escapeHtml(chapter.research_task)}</div>
                  </div>
                </details>`;
              }).join("")}
            </div>
          </section>`).join("")}
        ${supplemental ? `<details class="curriculum-chapter supplemental-chapter project-supplemental"><summary><span><small>教材外与跨章</small><strong>${escapeHtml(supplemental.title)}</strong></span><span class="pill">${withoutFocus(supplemental.projects).length} 个项目</span></summary><div class="curriculum-chapter-body"><p class="small">${escapeHtml(supplemental.description)}</p><div class="project-grid">${withoutFocus(supplemental.projects).map(renderProjectCard).join("")}</div></div></details>` : ""}
      ` : `<section class="project-grid">${projects.map(renderProjectCard).join("")}</section>`}
      <section class="card project-principle-card">
        <span class="section-kicker">共同规则</span>
        <h3>所有项目共用一条掌握标准</h3>
        <p>先留下真实判断，再形成候选错因；家长确认后安排延迟复测。一次答对或看过解析，都不直接算“已掌握”。</p>
      </section>
    `;
  }

  coach.features.home = Object.freeze({ renderToday, renderProjects });
})(typeof window !== "undefined" ? window : globalThis);
