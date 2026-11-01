// Local preview on :4173; pass the installed Playwright module path if needed.
import assert from "node:assert/strict";
const { chromium } = await import(process.argv[2] || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [1100, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173/");
    await page.locator('[data-route="recall"]').tap();
    await page.locator('.recall-blank').first().evaluate((element) => element.click());
    const oldProgress = await page.evaluate(() => JSON.parse(localStorage.getItem("orange-geography-coach:v0.1")).recallProgress["recall-01"]);
    await page.getByRole("button", { name: "口袋书 · 人口样板", exact: true }).tap();
    assert.equal(await page.locator('.pocket-overview').getAttribute('open'), null);
    await page.locator('.pocket-overview > summary').tap();
    const overviewImage = page.locator('.pocket-overview img');
    await overviewImage.waitFor({ state: 'visible' });
    await page.locator('.pocket-overview').getByRole('button', { name: '放大图示' }).tap();
    assert.ok((await page.locator('#pocket-zoom .recall-zoom-head strong').textContent()).includes('思维导图'));
    assert.equal(await page.locator('#pocket-zoom img').getAttribute('src'), 'assets/recall/pocket-population/image-04.png');
    await page.getByRole('button', { name: '关闭', exact: true }).tap();
    await page.locator('.pocket-overview > summary').tap();
    const ids = await page.locator('[data-action="open-pocket-section"]').evaluateAll((elements) => elements.map((element) => element.dataset.sectionId));
    assert.equal(ids.length, 8);
    let checked = 0;
    for (const id of ids) {
      const link = page.locator(`[data-action="open-pocket-section"][data-section-id="${id}"]`);
      await link.evaluate((element) => { element.closest("details").open = true; });
      await link.tap();
      if (width <= 760) {
        const box = await page.locator('.recall-lesson-main').boundingBox();
        assert.ok(box.y >= 0 && box.y <= 40);
      }
      assert.equal(await page.locator('.pocket-blank-answer:visible, .recall-blank-answer:visible').count(), 0);
      checked += await page.locator('[data-action="toggle-pocket-blank"]').evaluateAll((elements) => {
        for (const element of elements) {
          const answer = element.querySelector('.pocket-blank-answer, .recall-blank-answer');
          element.click();
          if (answer.hidden || element.getAttribute('aria-expanded') !== 'true') throw Error('answer not revealed');
          if (document.querySelectorAll('.pocket-blank[aria-expanded="true"], .pocket-image-blank[aria-expanded="true"]').length !== 1) throw Error('more than one answer revealed');
          if (element.dataset.figure === 'true') {
            const a = answer.getBoundingClientRect(), b = element.getBoundingClientRect();
            if (a.top < b.top || a.bottom > b.bottom + .1 || a.left < b.left || a.right > b.right + .1) throw Error('image answer outside mask');
          }
          element.click();
          if (!answer.hidden) throw Error('answer not hidden');
        }
        return elements.length;
      });
      const textBlank = page.locator('.pocket-blank').first();
      await textBlank.tap();
      assert.equal(await textBlank.getAttribute('aria-expanded'), 'true');
      await textBlank.press('Enter');
      assert.equal(await textBlank.getAttribute('aria-expanded'), 'false');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page has horizontal overflow');
      if (id === "pocket11-01") {
        await page.screenshot({ path: `tmp/pocket-population-${width}.png`, fullPage: true });
        if (width === 390) assert.ok(await page.locator('.pocket-table-scroll').first().evaluate((e) => e.scrollWidth > e.clientWidth));
      }
      if (id === "pocket11-07") {
        const zoom = page.locator('.pocket-figure').filter({ hasText: '三种人口年龄结构类型' }).getByRole('button', { name: '放大图示' });
        await zoom.tap();
        assert.equal(await page.locator('#pocket-zoom .recall-blank-answer:visible').count(), 0);
        const mask = page.locator('#pocket-zoom .recall-blank').first();
        await mask.tap();
        assert.equal(await page.locator('#pocket-zoom .recall-blank-answer:visible').count(), 1);
        await page.screenshot({ path: `tmp/pocket-population-zoom-${width}.png` });
        await page.getByRole('button', { name: '关闭', exact: true }).tap();
      }
      if (width <= 760) {
        await page.getByRole('button', { name: '返回目录', exact: true }).tap();
        const selected = await link.boundingBox();
        assert.ok(selected.y >= 0 && selected.y + selected.height <= 844);
      }
    }
    assert.equal(checked, 131);
    await page.getByRole('button', { name: '家长已听口头复述', exact: true }).tap();
    await page.reload();
    await page.locator('.pocket-content').waitFor();
    assert.equal(await page.locator('.pocket-blank-answer:visible, .recall-blank-answer:visible').count(), 0);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem("orange-geography-coach:v0.1")).recallProgress);
    assert.deepEqual(records["recall-01"], oldProgress);
    assert.equal(records["pocket11-08"].status, "recited");
    assert.ok(records["pocket11-08"].reveal_count > 0);
    await page.getByRole('button', { name: '基础挖空 · 26版', exact: true }).tap();
    assert.ok(await page.locator('.recall-blank').count());
    assert.equal(await page.locator('.recall-blank-answer:visible').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: ${checked} independent blanks, tables, figures, directory, saved progress, old collection`);
    await page.close();
  }
} finally {
  await browser.close();
}
