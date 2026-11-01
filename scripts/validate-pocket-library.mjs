import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";

export async function validatePocketLibrary() {
  const library = JSON.parse(await readFile(new URL('../data/pocket_library.json', import.meta.url), 'utf8'));
  assert.equal(library.schema_version, '1.0.0');
  assert.deepEqual(library.topics.map(t => t.id), library.topics.map(t => t.id).sort());
  assert.equal(new Set(library.topics.map(t => t.id)).size, library.topics.length);
  assert.ok(library.topics.some(t => t.id === 'pocket11' && t.data === 'data/pocket_population.json'));
  const schema = JSON.parse(await readFile(new URL('../schemas/pocket-book.v1.1.schema.json', import.meta.url), 'utf8'));
  const context = { OrangeCoach: { features: { recallCards: { progressModel: () => ({tone:'',label:'未开始'}) } } } };
  vm.runInNewContext(await readFile(new URL('../assets/features/pocket-recall.js', import.meta.url), 'utf8'), context);
  const totals = { sections: 0, blanks: 0, images: 0 };
  for (const entry of library.topics) {
    if (entry.id === 'pocket11') continue;
    assert.match(entry.data, /^data\/pocket\/[0-9]{2}-[a-z-]+\.json$/);
    const data = JSON.parse(await readFile(new URL('../' + entry.data, import.meta.url), 'utf8'));
    assert.equal(data.topic_id, entry.id); assert.equal(data.title, entry.title);
    assert.equal(data.schema_version, schema.properties.schema_version.const);
    assert.match(data.source.sha256, /^[a-f0-9]{64}$/);
    const ids = new Set(), images = new Set(); let tableCount = 0, equationCount = 0, paragraphs = 0;
    function math(node) {
      assert.ok(['mrow','mtext','mo','mfrac','msup','msub'].includes(node.tag));
      if (['mfrac','msup','msub'].includes(node.tag)) assert.equal(node.children.length, 2);
      if (node.children) node.children.forEach(math); else assert.equal(typeof node.text, 'string');
    }
    async function blocks(list) {
      for (const block of list) {
        assert.ok(Number.isInteger(block.source_block));
        if (block.tokens) {
          paragraphs++;
          for (const t of block.tokens) {
            assert.ok(['text','blank','math'].includes(t.type));
            if (t.type === 'blank') { assert.ok(t.answer.trim()); assert.ok(!ids.has(t.id)); ids.add(t.id); }
            if (t.expression || t.answer_math) { equationCount++; math(t.expression || t.answer_math); }
          }
          let expected = block.source_text;
          for (const edit of data.audit.corrections.filter(e => e.source_block === block.source_block && e.source_row === block.source_row)) expected = expected.replaceAll(edit.original, edit.revised);
          assert.equal(block.tokens.map(t => t.type === 'blank' ? t.answer : t.text).join(''), expected, `source fidelity ${entry.id}/${block.source_block}`);
        }
        if (block.type === 'table') {
          tableCount++;
          const grid = Array.from({length:block.rows.length}, () => Array(block.columns).fill(false));
          for (const [y, cells] of block.rows.entries()) for (const cell of cells) {
            for (let row = y; row < y + cell.rowspan; row++) for (let col = cell.column; col < cell.column + cell.colspan; col++) {
              assert.ok(grid[row] && col < block.columns && !grid[row][col], `table overlap ${entry.id}/${block.source_block}`); grid[row][col] = true;
            }
            await blocks(cell.blocks);
          }
          assert.ok(grid.every(row => row.every(Boolean)), `missing table cells ${entry.id}/${block.source_block}`);
        }
        if (block.type === 'figure') {
          assert.match(block.image, new RegExp(`^assets/recall/pocket-${entry.id.slice(-2)}/`));
          const payload = await readFile(new URL('../' + block.image, import.meta.url));
          assert.equal(createHash('sha256').update(payload).digest('hex'), data.audit.images_sha256[block.image]);
          images.add(block.image); assert.ok(block.width > 0 && block.height > 0);
        }
      }
    }
    await blocks([data.overview, ...(data.additional_overviews || [])]);
    let end = 0;
    for (const section of data.sections) {
      assert.ok(section.source_blocks[0] >= end); end = section.source_blocks[1];
      await blocks(section.blocks);
      const html = context.OrangeCoach.features.pocketRecall.render({module:data,section,progressByLesson:{}});
      const count = context.OrangeCoach.features.pocketRecall.countBlanks(section.blocks);
      assert.equal((html.match(/data-blank-id=/g)||[]).length, count);
      assert.equal((html.match(/class="(?:pocket-blank-answer|recall-blank-answer)" hidden/g)||[]).length, count);
      assert.ok(!html.includes('undefined'));
    }
    assert.equal(ids.size, data.audit.blank_count);
    assert.equal(paragraphs, data.audit.counters.paragraphs);
    assert.equal(equationCount, data.audit.counters.equations || 0);
    assert.equal(tableCount, data.audit.counters.tables);
    assert.equal(images.size, Object.keys(data.audit.images_sha256).length);
    totals.sections += data.sections.length; totals.blanks += ids.size; totals.images += images.size;
  }
  return `口袋书目录${library.topics.length}专题；新增${totals.sections}单元/${totals.blanks}空/${totals.images}原图，公式、表格与原文对应通过`;
}
