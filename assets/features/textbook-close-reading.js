(function registerTextbookCloseReadingFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'\"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;"
    })[char]);
  }

  function renderPageNav(module, progress, activePage) {
    return `<div class="close-reading-page-nav" aria-label="教材页码">
      ${module.pages.map((page) => {
        const complete = Boolean(progress[String(page.page)]?.read_at);
        return `<button class="close-reading-page-chip ${page.page === activePage ? "active" : ""} ${complete ? "complete" : ""}" data-action="select-reading-page" data-page="${page.page}"><span>${page.page}</span><small>${complete ? "已读" : "未读"}</small></button>`;
      }).join("")}
    </div>`;
  }

  function renderImageReading(items) {
    return `<div class="close-reading-image-list">${items.map((item) => `
      <article class="close-reading-image-item">
        <h4>${escapeHtml(item.figure)}</h4>
        <p><strong>先看：</strong>${escapeHtml(item.observe)}</p>
        <p><strong>再想：</strong>${escapeHtml(item.interpret)}</p>
        <p><strong>高考怎么问：</strong>${escapeHtml(item.exam_link)}</p>
      </article>`).join("")}</div>`;
  }

  function renderDetail(label, title, body, tone = "") {
    return `<details class="close-reading-insight ${tone}">
      <summary><span><small>${escapeHtml(label)}</small><strong>${escapeHtml(title)}</strong></span><span class="close-reading-toggle-hint"><span class="when-closed">点击展开</span><span class="when-open">点击收起</span></span></summary>
      <div class="close-reading-insight-body">${body}</div>
    </details>`;
  }

  function renderQuestionGroup(group, questions, enabled) {
    return `<article class="card close-reading-question-group">
      <div class="close-reading-group-head"><div><span class="section-kicker">${escapeHtml(group.label)}</span><h3>${escapeHtml(group.title)}</h3></div><span class="pill">${questions.length}题</span></div>
      <p>${escapeHtml(group.purpose)}</p>
      <div class="region-question-list">
        ${questions.map((question) => `<div class="region-question-row">
          <div><strong>${escapeHtml(question.title)}</strong><small>${escapeHtml(question.source)}</small></div>
          <span class="pill ${question.attempt?.is_correct ? "green" : question.attempt ? "orange" : ""}">${question.attempt ? (question.attempt.is_correct ? "已作答" : "待复盘") : "未作答"}</span>
          <button class="btn secondary" data-action="start-question" data-question-id="${escapeHtml(question.id)}" data-return-route="textbook-close-reading" ${enabled ? "" : "disabled"}>${enabled ? (question.attempt ? "再做一次" : "开始作答") : "完成8页后开放"}</button>
        </div>`).join("")}
      </div>
    </article>`;
  }

  function renderChapterMap(module) {
    const map = module.chapter_map;
    return `<details class="card close-reading-chapter-map">
      <summary><span><span class="section-kicker">全章地图</span><strong>${escapeHtml(map.guiding_question)}</strong></span><span class="close-reading-toggle-hint"><span class="when-closed">展开全章</span><span class="when-open">收起地图</span></span></summary>
      <div class="close-reading-chapter-map-body">
        <div class="close-reading-chapter-path">${map.sections.map((section) => `<article class="${section.status === "active" ? "active" : ""}"><small>第${section.number}节</small><strong>${escapeHtml(section.title)}</strong><p>${escapeHtml(section.role)}</p><span>${section.status === "active" ? "正在学习" : "后续学习"}</span></article>`).join("")}</div>
        <div class="close-reading-research"><small>问题研究</small><strong>${escapeHtml(map.research.title)}</strong><p>${escapeHtml(map.research.role)}</p></div>
      </div>
    </details>`;
  }

  function renderPageCheck(page, question) {
    if (!question) return "";
    const status = question.attempt ? (question.attempt.is_correct ? "已答对" : "待复盘") : "未作答";
    return `<section class="close-reading-page-check">
      <div><span class="section-kicker">本页连接题 · 第${page.page}页</span><h3>读完马上用一次</h3><p>只考这一页的核心关系。进入题目后先看“课本桥”，再判断选项。</p></div>
      <span class="pill ${question.attempt?.is_correct ? "green" : question.attempt ? "orange" : ""}">${status}</span>
      <button class="btn orange" data-action="start-question" data-question-id="${escapeHtml(question.id)}" data-return-route="textbook-close-reading">${question.attempt ? "再做一次" : "做本页1题"}</button>
    </section>`;
  }

  function render(model) {
    const { module, page, progress, completedPages, questionGroups, pageQuestion } = model;
    const read = Boolean(progress[String(page.page)]?.read_at);
    const practiceUnlocked = completedPages === module.pages.length;
    const imageSrc = `${module.textbook_image_base}/${page.image}`;
    const summary = page.summary;
    return `
      <div class="learning-breadcrumb"><button class="text-button" data-action="goto" data-route="projects">学习目录</button><span>›</span><strong>${escapeHtml(module.chapter)}</strong></div>
      <div class="close-reading-heading">
        <div><span class="section-kicker">选择性必修1 · 第二章 · 第一节</span><h2 class="page-title">逐页精读：塑造地表形态的力量</h2></div>
        <span class="pill ${practiceUnlocked ? "green" : "orange"}">${completedPages}/${module.pages.length}页</span>
      </div>
      <p class="page-subtitle">教材原页是主角。先独立读图文，再按需展开图片解读、逐页解析、知识发散和本页总结；每项都可再次点击收起。</p>
      ${renderChapterMap(module)}
      <details class="card close-reading-method-card">
        <summary><span><span class="section-kicker">精读方法</span><strong>每页建议用8—12分钟</strong></span></summary>
        <ol>${module.method.student_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        <p class="small"><strong>本节完成：</strong>${escapeHtml(module.method.completion_rule)}</p>
      </details>
      ${renderPageNav(module, progress, page.page)}
      <article class="card close-reading-textbook-card">
        <div class="close-reading-page-head"><div><span class="section-kicker">教材第${page.page}页 · PDF第${page.pdf_page}页</span><h3>${escapeHtml(page.title)}</h3></div><span class="pill ${read ? "green" : ""}">${read ? "本页已读" : "正在精读"}</span></div>
        <p class="close-reading-focus">${escapeHtml(page.focus)}</p>
        <div class="close-reading-page-layout">
          <figure class="close-reading-textbook-page"><a href="${escapeHtml(imageSrc)}" target="_blank" rel="noopener"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(module.section)}教材第${page.page}页" /></a><figcaption>点按教材页可查看原尺寸；先观察标题、图名、图注与正文的对应关系。</figcaption></figure>
          <aside class="close-reading-reading-guide">
            <span class="section-kicker">带着问题读</span>
            <h3>本页三问</h3>
            <ol>${page.read_targets.map((target) => `<li>${escapeHtml(target)}</li>`).join("")}</ol>
            <div class="close-reading-route"><strong>建议顺序</strong><span>原页通读</span><span>图片解读</span><span>逐页解析</span><span>知识发散</span><span>合上后复述</span></div>
            <button class="btn ${read ? "secondary" : "orange"}" data-action="toggle-reading-page" data-page="${page.page}">${read ? "取消本页已读" : "读完后标记本页已读"}</button>
            <p class="small">“已读”只记录阅读进度，不代表已经掌握。</p>
          </aside>
        </div>
        <section class="close-reading-insights" aria-label="本页辅助解读">
          ${renderDetail("01 · 图片解读", "先从图像提取证据", renderImageReading(page.image_reading), "image")}
          ${renderDetail("02 · 逐页解析", "把课本句子连成因果链", `<ol>${page.analysis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`, "analysis")}
          ${renderDetail("03 · 知识发散", "连接考法、边界和易错点", `<ul>${page.extensions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><div class="diagnosis"><strong>迁移提醒：</strong>${escapeHtml(page.transfer)}</div>`, "extension")}
          ${renderDetail("04 · 本页总结", "合上课本前只记住这四点", `<dl class="close-reading-summary"><div><dt>核心结论</dt><dd>${escapeHtml(summary.core)}</dd></div><div><dt>因果链</dt><dd>${escapeHtml(summary.chain)}</dd></div><div><dt>关键词</dt><dd>${escapeHtml(summary.terms.join("、"))}</dd></div><div><dt>最易混淆</dt><dd>${escapeHtml(summary.pitfall)}</dd></div></dl>`, "summary")}
        </section>
        ${renderPageCheck(page, pageQuestion)}
        <div class="close-reading-page-actions">
          ${page.page > module.page_start ? `<button class="btn secondary" data-action="select-reading-page" data-page="${page.page - 1}">上一页</button>` : "<span></span>"}
          ${page.page < module.page_end ? `<button class="btn orange" data-action="select-reading-page" data-page="${page.page + 1}">进入第${page.page + 1}页</button>` : ""}
        </div>
      </article>
      <section class="close-reading-practice-heading"><div><span class="section-kicker">本节分层训练</span><h2>先连接课本，再迁移到真题</h2></div><span class="pill">12题</span></section>
      <p class="page-subtitle">8道本页连接题随读随做；${practiceUnlocked ? "8页已读，4道进阶迁移题已经开放。" : `还需读完${module.pages.length - completedPages}页，之后开放4道进阶迁移题。`}提交前不显示答案或完整解析。</p>
      <div class="close-reading-question-list">${questionGroups.map((group) => renderQuestionGroup(group, group.questions, group.unlock === "always" || practiceUnlocked)).join("")}</div>
      <details class="card close-reading-parent-card">
        <summary><span><span class="section-kicker">家长介入</span><strong>第一节验收清单</strong></span></summary>
        <ul>${module.parent_checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </details>`;
  }

  coach.features.textbookCloseReading = Object.freeze({ render });
})(typeof window !== "undefined" ? window : globalThis);
