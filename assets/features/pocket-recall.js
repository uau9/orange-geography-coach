(function registerPocketRecall(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.features = coach.features || {};
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function renderBlank(blank, sectionId, figure = false) {
    const style = figure
      ? `left:${blank.x * 100}%;top:${blank.y * 100}%;width:${blank.width * 100}%;height:${blank.height * 100}%`
      : `--blank-length:${Math.min(18, Math.max(3, [...blank.answer].length))}`;
    return `<button type="button" class="${figure ? "recall-blank pocket-image-blank" : "pocket-blank"}" style="${style}" data-action="toggle-pocket-blank" data-section-id="${escapeHtml(sectionId)}" data-blank-id="${escapeHtml(blank.id)}" data-figure="${figure}" aria-expanded="false" aria-label="点击显示或隐藏本空答案">
      ${figure ? "" : '<span class="pocket-blank-placeholder" aria-hidden="true">&nbsp;</span>'}
      <span class="${figure ? "recall-blank-answer" : "pocket-blank-answer"}" hidden>${escapeHtml(blank.answer)}</span>
    </button>`;
  }

  function renderTokens(tokens, sectionId) {
    return tokens.map((token) => token.type === "blank" ? renderBlank(token, sectionId) : escapeHtml(token.text).replace(/\n/g, "<br>")).join("");
  }

  function renderBlock(block, sectionId) {
    if (block.type === "heading") return `<h3 class="pocket-subheading">${renderTokens(block.tokens, sectionId)}</h3>`;
    if (block.type === "paragraph") return `<p class="pocket-paragraph">${renderTokens(block.tokens, sectionId)}</p>`;
    if (block.type === "table") {
      return `${block.note ? `<p class="small pocket-review-note">辨析：${escapeHtml(block.note)}</p>` : ""}<p class="small pocket-table-hint">表格可左右滑动，空格仍可逐个点击。</p><div class="pocket-table-scroll" role="region" aria-label="原文表格，可横向滑动" tabindex="0"><table class="pocket-table" data-column-count="${block.columns}"><tbody>${block.rows.map((cells, i) => `<tr>${cells.map((cell) => {
        const tag = i < block.header_rows ? "th" : "td";
        return `<${tag} colspan="${cell.colspan}" rowspan="${cell.rowspan}">${cell.blocks.map((b) => renderBlock(b, sectionId)).join("")}</${tag}>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    if (block.type === "figure") {
      return `<figure class="pocket-figure"><div class="pocket-figure-toolbar"><figcaption>${escapeHtml(block.caption)}</figcaption><button type="button" class="text-button" data-action="zoom-pocket-figure">放大图示</button></div>
        <div class="pocket-figure-canvas" style="aspect-ratio:${block.width}/${block.height}">
          <img src="${escapeHtml(block.image)}" width="${block.width}" height="${block.height}" loading="lazy" alt="${escapeHtml(block.caption)}，橙色区域可点击背诵" />
          ${block.masks.map((mask) => renderBlank(mask, sectionId, true)).join("")}
        </div>${block.note ? `<p class="small">${escapeHtml(block.note)}</p>` : ""}</figure>`;
    }
    return "";
  }

  function countBlanks(blocks) {
    return blocks.reduce((sum, block) => sum + (block.tokens?.filter((t) => t.type === "blank").length || 0)
      + (block.masks?.length || 0)
      + (block.rows?.reduce((rows, cells) => rows + cells.reduce((row, cell) => row + countBlanks(cell.blocks), 0), 0) || 0), 0);
  }

  function render({ module, section, progressByLesson }) {
    const status = coach.features.recallCards.progressModel(progressByLesson[section.id]);
    const groupNames = [...new Set(module.sections.map((s) => s.group))];
    return `<div class="recall-heading"><div><span class="section-kicker">口袋书 · 人口样板</span><h2 class="page-title">${escapeHtml(module.title)}</h2></div><span class="pill ${status.tone}">${status.label}</span></div>
      <p class="page-subtitle">按原书顺序背诵，点击淡橙色空格只看本空，再点隐藏。表格可横向滑动；图示可放大后继续点击。</p>
      <details class="card pocket-overview"><summary>专题总览 · 思维导图（先回忆，再展开核对）</summary>
        <p class="small">先尝试说出人口分布、人口迁移、人口容量之间的联系，再用原图核对知识结构。原图含完整文字标注，可放大查看。</p>
        ${renderBlock(module.overview, section.id)}
        <p class="small">原图按原貌保留，具体概念以正文修订为准。其中“海拔：地平地区”应理解为低海拔、地势低平地区；人口迁移还需满足长期或永久改变居住地等条件，短期旅行、通勤不直接算迁移。</p>
      </details>
      <div class="recall-layout pocket-recall-layout">
        <nav class="recall-directory" aria-label="人口专题背诵目录"><div class="recall-directory-head"><strong>原文目录</strong><small>8 个单元</small></div>${groupNames.map((group) => `<details ${section.group === group ? "open" : ""}><summary>${escapeHtml(group)}</summary><div class="recall-lesson-links">${module.sections.filter((s) => s.group === group).map((s) => `<button type="button" class="${section.id === s.id ? "active" : ""}" data-action="open-pocket-section" data-section-id="${escapeHtml(s.id)}"><span>${escapeHtml(s.title)}</span><small>${countBlanks(s.blocks)} 空</small></button>`).join("")}</div></details>`).join("")}</nav>
        <div class="recall-lesson-main" tabindex="-1" aria-label="当前背诵课时"><button type="button" class="btn secondary recall-return-directory" data-action="return-recall-directory">返回目录</button>
          <section class="card pocket-content"><span class="section-kicker">${escapeHtml(section.group)}</span><h2>${escapeHtml(section.title)}</h2><p class="small">${countBlanks(section.blocks)} 个独立空格 · 先口头回答，再查看提示</p>
            ${section.blocks.map((block) => renderBlock(block, section.id)).join("")}
            <div class="btn-row"><button class="btn secondary" type="button" data-action="set-recall-status" data-lesson-id="${section.id}" data-status="review">还没记牢</button><button class="btn orange" type="button" data-action="set-recall-status" data-lesson-id="${section.id}" data-status="recited">家长已听口头复述</button></div>
            <p class="small">${escapeHtml(status.label)}。提示次数和家长标记只保存在本机；查看答案不计为掌握，后续仍需脱离答案复述和延迟复测。</p>
          </section>
          <details class="card pocket-source"><summary>来源与修订说明</summary><p>来源：2024年高考地理一轮复习知识清单，专题11人口。本样板保留思维导图、知识清单、易错易混与知能拓展；原题训练和答案解析未混入背诵正文。</p><p>原文的红色下划线转换为独立空格，补充的空格用于未标记的易错点与图示。历史分类须结合材料年份使用。</p><ul>${module.audit.corrections.map((c) => `<li>${escapeHtml(c.reason)}</li>`).join("")}</ul><p>核查参考：${module.audit.references.map((ref) => `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.title)}</a>`).join("；")}。</p></details>
        </div>
      </div>
      <div id="pocket-zoom" class="recall-zoom" hidden><div class="recall-zoom-head"><strong>原图放大 · 点击橙色区域逐空背诵</strong><button class="btn secondary" type="button" data-action="close-pocket-zoom">关闭</button></div><div class="recall-zoom-scroll"><div id="pocket-zoom-content"></div></div></div>`;
  }

  coach.features.pocketRecall = Object.freeze({ render, countBlanks });
})(typeof window !== "undefined" ? window : globalThis);
