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
        const record = progress[String(page.page)];
        const complete = Boolean(record?.saved_at);
        return `<button class="close-reading-page-chip ${page.page === activePage ? "active" : ""} ${complete ? "complete" : ""}" data-action="select-reading-page" data-page="${page.page}"><span>${page.page}</span><small>${complete ? "已读" : "未读"}</small></button>`;
      }).join("")}
    </div>`;
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

  function render(model) {
    const { module, page, progress, completedPages, questionGroups } = model;
    const record = progress[String(page.page)] || {};
    const unlocked = Boolean(record.saved_at);
    const practiceUnlocked = completedPages === module.pages.length;
    const imageSrc = `${module.textbook_image_base}/${page.image}`;
    return `
      <div class="learning-breadcrumb"><button class="text-button" data-action="goto" data-route="projects">学习目录</button><span>›</span><strong>${escapeHtml(module.chapter)}</strong></div>
      <div class="close-reading-heading">
        <div><span class="section-kicker">选择性必修1 · 第二章 · 第一节</span><h2 class="page-title">逐页精读：塑造地表形态的力量</h2></div>
        <span class="pill ${completedPages === module.pages.length ? "green" : "orange"}">${completedPages}/${module.pages.length}页</span>
      </div>
      <p class="page-subtitle">每页先留下自己的阅读证据，保存后才显示解析与知识发散。第二节尚未开放。</p>
      <details class="card close-reading-method-card">
        <summary><span><span class="section-kicker">精读方法</span><strong>每一页固定做4步</strong></span></summary>
        <ol>${module.method.student_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        <p class="small"><strong>本节完成：</strong>${escapeHtml(module.method.completion_rule)}</p>
      </details>
      ${renderPageNav(module, progress, page.page)}
      <section class="close-reading-workspace">
        <article class="card close-reading-textbook-card">
          <div class="close-reading-page-head"><div><span class="section-kicker">教材第${page.page}页 · PDF第${page.pdf_page}页</span><h3>${escapeHtml(page.title)}</h3></div><span class="pill ${unlocked ? "green" : ""}">${unlocked ? "已保存" : "先精读"}</span></div>
          <p>${escapeHtml(page.focus)}</p>
          <figure class="close-reading-textbook-page"><a href="${escapeHtml(imageSrc)}" target="_blank" rel="noopener"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(module.section)}教材第${page.page}页" /></a><figcaption>点按查看原尺寸；整本教材PDF不随站点发布。</figcaption></figure>
          <div class="region-reading-task"><strong>本页阅读目标</strong><ol>${page.read_targets.map((target) => `<li>${escapeHtml(target)}</li>`).join("")}</ol></div>
        </article>
        <article class="card close-reading-notes-card">
          <span class="section-kicker">橙子的阅读证据</span>
          <h3>先写，再看解析</h3>
          <label>3—6个关键词<input id="reading-keywords" type="text" value="${escapeHtml(record.keywords || "")}" placeholder="例如：内力作用、地壳运动……" /></label>
          <label>一条完整因果链<textarea id="reading-chain" rows="4" placeholder="因为……导致……所以……">${escapeHtml(record.causal_chain || "")}</textarea></label>
          <label>一个真实疑问<textarea id="reading-question" rows="3" placeholder="我还不能解释的是……">${escapeHtml(record.question || "")}</textarea></label>
          <button class="btn orange" data-action="save-reading-page" data-page="${page.page}">保存本页阅读证据</button>
          ${record.saved_at ? `<p class="close-reading-saved-note">已保存：${escapeHtml(new Date(record.saved_at).toLocaleString("zh-CN"))}</p>` : `<p class="small">三个项目都写完才能解锁解析。疑问没有“标准答案”，要保留真实困惑。</p>`}
        </article>
      </section>
      ${unlocked ? `<section class="card close-reading-analysis-card">
        <div class="close-reading-page-head"><div><span class="section-kicker">逐页解析</span><h3>核对你的因果链</h3></div><span class="pill green">已解锁</span></div>
        <ol>${page.analysis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <div class="close-reading-extension"><strong>知识发散</strong>${page.extensions.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>
        <div class="diagnosis"><strong>高考迁移：</strong>${escapeHtml(page.transfer)}</div>
        <div class="close-reading-page-actions">
          ${page.page > module.page_start ? `<button class="btn secondary" data-action="select-reading-page" data-page="${page.page - 1}">上一页</button>` : ""}
          ${page.page < module.page_end ? `<button class="btn orange" data-action="select-reading-page" data-page="${page.page + 1}">进入第${page.page + 1}页</button>` : ""}
        </div>
      </section>` : `<section class="notice">逐页解析和知识发散已锁定。先根据教材图文留下自己的关键词、因果链和疑问。</section>`}
      <section class="close-reading-practice-heading"><div><span class="section-kicker">本节迁移训练</span><h2>真题与资料包例题</h2></div><span class="pill">4题</span></section>
      <p class="page-subtitle">${practiceUnlocked ? "8页阅读证据已完成，可以开始迁移训练。" : `还需完成${module.pages.length - completedPages}页阅读证据，之后开放迁移训练。`}题面与答案分离，提交前不显示答案或完整解析。</p>
      <div class="close-reading-question-list">${questionGroups.map((group) => renderQuestionGroup(group, group.questions, practiceUnlocked)).join("")}</div>
      <details class="card close-reading-parent-card">
        <summary><span><span class="section-kicker">家长介入</span><strong>第一节验收清单</strong></span></summary>
        <ul>${module.parent_checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </details>`;
  }

  coach.features.textbookCloseReading = Object.freeze({ render });
})(typeof window !== "undefined" ? window : globalThis);
