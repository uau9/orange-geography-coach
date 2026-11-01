import assert from 'node:assert/strict';
const { chromium } = await import(process.argv[2] || 'playwright');
const baseURL = process.argv[3] || 'http://127.0.0.1:4173/';
const topicId = process.argv[4] || 'pocket01';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  for (const width of [390, 1100]) {
    const page = await browser.newPage({viewport:{width,height:844},hasTouch:true});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(baseURL, {waitUntil:'networkidle'});
    await page.locator('[data-route="recall"]').tap();
    await page.getByRole('button',{name:'口袋书 · 知识清单',exact:true}).tap();
    await page.locator('[data-action="select-pocket-topic"]').selectOption(topicId);
    await page.locator(`[data-action="open-pocket-section"][data-section-id^="${topicId}-"]`).first().waitFor();
    const ids = await page.locator('[data-action="open-pocket-section"]').evaluateAll(es=>es.map(e=>e.dataset.sectionId));
    const metadata = await page.evaluate(async(id)=>{const library=await(await fetch('./data/pocket_library.json')).json();const book=await(await fetch('./'+library.topics.find(t=>t.id===id).data)).json();return {blanks:book.audit.blank_count,images:Object.keys(book.audit.images_sha256).length}},topicId);
    let count = 0;
    for (const id of ids) {
      const link = page.locator(`[data-action="open-pocket-section"][data-section-id="${id}"]`);
      await link.evaluate(e=>{e.closest('details').open=true}); await link.tap();
      if(width<=760){const r=await page.locator('.recall-lesson-main').boundingBox();assert.ok(r.y>=0&&(r.y<=40||r.y+Math.min(r.height,200)<=760),`lesson heading not visible: ${id}/${r.y}`)}
      assert.equal(await page.locator('.pocket-blank-answer:visible,.recall-blank-answer:visible').count(),0);
      count += await page.locator('[data-action="toggle-pocket-blank"]').evaluateAll(es=>{for(const e of es){const a=e.querySelector('.pocket-blank-answer,.recall-blank-answer');e.click();if(a.hidden)throw Error('show failed');if(document.querySelectorAll('[data-action="toggle-pocket-blank"][aria-expanded="true"]').length!==1)throw Error('scope failed');e.click();if(!a.hidden)throw Error('hide failed')}return es.length});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal page overflow');
      if(id===`${topicId}-01`){await page.screenshot({path:`tmp/${topicId}-${width}.png`})}
      const disclosure=page.locator('.pocket-content .pocket-figure-disclosure').first();
      if(await disclosure.count()){
        await disclosure.locator('summary').tap();
        await disclosure.locator('img').evaluate(e=>e.decode());
        await disclosure.getByRole('button',{name:'放大图示'}).tap();
        await page.locator('#pocket-zoom img').evaluate(e=>e.decode());
        await page.getByRole('button',{name:'关闭',exact:true}).tap();
      }
      if (id.endsWith('-09')) {
        await page.locator('.pocket-content').screenshot({path:`tmp/${topicId}-math-${width}.png`});
      }
    }
    assert.equal(count,metadata.blanks);
    await page.reload();await page.locator('.pocket-content').waitFor();
    assert.equal(await page.locator('[data-action="select-pocket-topic"]').inputValue(),topicId);
    assert.equal(await page.locator('.pocket-blank-answer:visible,.recall-blank-answer:visible').count(),0);
    await page.locator('[data-action="select-pocket-topic"]').selectOption('pocket11');
    await page.locator('[data-section-id="pocket11-01"][data-action="open-pocket-section"]').waitFor();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({topicId,width,sections:ids.length,blanks:count,declaredImages:metadata.images,errors}));
    await page.close();
  }
} finally { await browser.close(); }
