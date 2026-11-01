// Run with a local server on port 4173; optional argument: Playwright module path.
import assert from "node:assert/strict";
const { chromium } = await import(process.argv[2] || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [390, 760, 1100]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173/");
    await page.locator('[data-route="recall"]').tap();
    for (const id of ["recall-02", "recall-09", "recall-25"]) {
      const button = page.locator(`[data-action="open-recall-lesson"][data-lesson-id="${id}"]`);
      await button.evaluate((element) => { element.closest("details").open = true; });
      await button.tap();
      assert.equal(await page.locator('.recall-directory button.active').getAttribute('data-lesson-id'), id);
      assert.equal(await page.locator('.recall-blank-answer:visible').count(), 0);
      if (width <= 760) {
        const content = await page.locator('.recall-lesson-main').boundingBox();
        assert.ok(content.y >= 0 && content.y <= 40, `content not visible: ${content.y}`);
        await page.getByRole('button', { name: '返回目录', exact: true }).tap();
        const selected = await button.boundingBox();
        assert.ok(selected.y >= 0 && selected.y + selected.height <= 844);
      } else {
        assert.equal(await page.locator('.recall-return-directory').isVisible(), false);
      }
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: lesson selection, return navigation, answers hidden`);
    await page.close();
  }
} finally {
  await browser.close();
}
