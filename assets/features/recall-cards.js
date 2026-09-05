(function registerRecallCardsFeature(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function progressModel(progress = {}) {
    if (progress.status === "recited") return { label: "已口头复述", tone: "green" };
    if (progress.status === "review") return { label: "需再背", tone: "orange" };
    if (progress.reveal_count) return { label: `已查看${progress.reveal_count}次`, tone: "orange" };
    return { label: "未开始", tone: "" };
  }

  function renderBlank(blank, page, cropBottom, lessonId) {
    const top = (blank.y / cropBottom) * 100;
    const height = (blank.height / cropBottom) * 100;
    return `<button
      class="recall-blank"
      type="button"
      data-action="toggle-recall-answer"
      data-lesson-id="${escapeHtml(lessonId)}"
      data-blank-id="${escapeHtml(blank.id)}"
      data-kind="${escapeHtml(blank.kind)}"
      style="left:${blank.x * 100}%;top:${top}%;width:${blank.width * 100}%;height:${height}%"
      aria-expanded="false"
      aria-label="原讲义第${page.page_number}页第${blank.number}个空，点击显示或隐藏本空答案"
    ><span class="recall-blank-answer" hidden>${escapeHtml(blank.answer)}</span></button>`;
  }

  function renderQuestionPage(page, lessonId) {
    const cropBottom = page.crop_bottom || 1;
    const ratioWidth = page.width;
    const ratioHeight = page.height * cropBottom;
    return `<article class="recall-page-card">
      <div class="recall-page-toolbar">
        <span>原讲义第 ${page.page_number} 页</span>
        <button class="text-button" type="button" data-action="zoom-recall-page" data-page="${page.page_number}">放大背诵</button>
      </div>
      <div class="recall-page-crop" style="aspect-ratio:${ratioWidth}/${ratioHeight}">
        <img src="${escapeHtml(page.image)}" loading="lazy" alt="高中地理基础知识挖空复习原讲义第${page.page_number}页" />
        ${page.blanks.map((blank) => renderBlank(blank, page, cropBottom, lessonId)).join("")}
      </div>
    </article>`;
  }

  function renderDirectory(module, activeLesson, progressByLesson) {
    const lessonsById = new Map(module.lessons.map((lesson) => [lesson.id, lesson]));
    return `<nav class="recall-directory" aria-label="背诵卡课时目录">
      <div class="recall-directory-head"><strong>原目录</strong><small>${module.lessons.length} 个课时</small></div>
      ${module.chapters.map((chapter) => `<details ${chapter.lesson_ids.includes(activeLesson.id) ? "open" : ""}>
        <summary>${escapeHtml(chapter.title)}</summary>
        <div class="recall-lesson-links">${chapter.lesson_ids.map((id) => {
          const lesson = lessonsById.get(id);
          const status = progressModel(progressByLesson[id]);
          return `<button type="button" class="${id === activeLesson.id ? "active" : ""}" data-action="open-recall-lesson" data-lesson-id="${escapeHtml(id)}">
            <span>${escapeHtml(lesson.title)}</span><small class="${escapeHtml(status.tone)}">${escapeHtml(status.label)}</small>
          </button>`;
        }).join("")}</div>
      </details>`).join("")}
    </nav>`;
  }

  function render({ module, lesson, progressByLesson = {} }) {
    const progress = progressByLesson[lesson.id] || {};
    const status = progressModel(progress);
    const blankCount = lesson.question_pages.reduce((sum, page) => sum + page.blanks.length, 0);
    return `<div class="recall-heading">
      <div><span class="section-kicker">背诵卡</span><h2 class="page-title">${escapeHtml(module.title)}</h2></div>
      <span class="pill ${escapeHtml(status.tone)}">${escapeHtml(status.label)}</span>
    </div>
    <p class="page-subtitle">先口头补完，再点击淡橙色空格查看本空答案；再次点击隐藏。字小可点“放大背诵”，放大后仍可逐空点击。</p>
    <div class="recall-layout">
      ${renderDirectory(module, lesson, progressByLesson)}
      <div class="recall-lesson-main">
        <section class="card recall-lesson-summary">
          <div><span class="section-kicker">${escapeHtml(lesson.chapter)}</span><h2>${escapeHtml(lesson.title)}</h2></div>
          <div class="recall-lesson-meta"><span>原页 ${lesson.source_pages.start}-${lesson.source_pages.end}</span><span>${lesson.question_pages.length} 个题面页</span><span>${blankCount} 个可点击空位</span></div>
          <div class="btn-row">
            <button class="btn secondary" type="button" data-action="set-recall-status" data-lesson-id="${escapeHtml(lesson.id)}" data-status="review">还没记牢</button>
            <button class="btn orange" type="button" data-action="set-recall-status" data-lesson-id="${escapeHtml(lesson.id)}" data-status="recited">家长已听口头复述</button>
          </div>
          <p class="small">学习记录保存在本机浏览器。“已口头复述”只是家长本次确认，仍需延迟复测才能判定掌握。</p>
        </section>
        <div class="recall-page-list">${lesson.question_pages.map((page) => renderQuestionPage(page, lesson.id)).join("")}</div>
      </div>
    </div>
    <div id="recall-zoom" class="recall-zoom" hidden>
      <div class="recall-zoom-head"><strong id="recall-zoom-title">原讲义</strong><button class="btn secondary" type="button" data-action="close-recall-zoom">关闭</button></div>
      <div class="recall-zoom-scroll"><div id="recall-zoom-page"></div></div>
    </div>`;
  }

  coach.features.recallCards = Object.freeze({ render, progressModel });
})(typeof window !== "undefined" ? window : globalThis);
