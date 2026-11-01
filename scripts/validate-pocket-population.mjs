import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";

export async function validatePocketPopulation() {
  const data = JSON.parse(await readFile(new URL("../data/pocket_population.json", import.meta.url), "utf8"));
  const schema = JSON.parse(await readFile(new URL("../schemas/pocket-recall.v1.schema.json", import.meta.url), "utf8"));
  assert.equal(data.schema_version, schema.properties.schema_version.const);
  assert.equal(data.status, "published");
  assert.equal(data.sections.length, 8);
  assert.deepEqual(data.sections.map((s) => s.id), Array.from({ length: 8 }, (_, i) => `pocket11-${String(i + 1).padStart(2, "0")}`));
  const ids = new Set();
  let tables = 0, images = 0, tableBlanks = 0;
  const texts = [];
  function checkBlank(blank, inTable) {
    assert.ok(blank.answer.trim()); assert.ok(!ids.has(blank.id), `duplicate blank ${blank.id}`); ids.add(blank.id);
    if (inTable) tableBlanks++;
  }
  async function checkBlocks(blocks, inTable = false, minimumBlock = 34) {
    for (const block of blocks) {
      assert.ok(block.source_block >= minimumBlock && block.source_block < 156, "source outside recall content");
      for (const token of block.tokens || []) {
        texts.push(token.type === "blank" ? token.answer : token.text);
        if (token.type === "blank") checkBlank(token, inTable);
      }
      if (block.type === "table") {
        tables++;
        const grid = Array.from({ length: block.rows.length }, () => Array(block.columns).fill(false));
        for (const [y, cells] of block.rows.entries()) for (const cell of cells) {
          for (let row = y; row < y + cell.rowspan; row++) for (let col = cell.column; col < cell.column + cell.colspan; col++) {
            assert.ok(grid[row] && col < block.columns && !grid[row][col], `table overlap/out of bounds: ${block.source_block}`);
            grid[row][col] = true;
          }
          await checkBlocks(cell.blocks, true);
        }
        assert.ok(grid.every((row) => row.every(Boolean)), `table missing cell: ${block.source_block}`);
      }
      if (block.type === "figure") {
        images++;
        const bytes = await readFile(new URL(`../${block.image}`, import.meta.url));
        assert.equal(createHash("sha256").update(bytes).digest("hex"), data.audit.images_sha256[block.image]);
        for (const mask of block.masks) {
          checkBlank(mask, false);
          assert.ok(mask.x >= 0 && mask.y >= 0 && mask.width > 0 && mask.height > 0 && mask.x + mask.width <= 1 && mask.y + mask.height <= 1, "image mask outside bounds");
        }
      }
    }
  }
  for (const section of data.sections) await checkBlocks(section.blocks);
  assert.equal(data.overview.source_block, 23);
  assert.equal(data.overview.image, "assets/recall/pocket-population/image-04.png");
  assert.equal(data.overview.masks.length, 0);
  await checkBlocks([data.overview], false, 23);
  assert.equal(ids.size, data.audit.blank_count);
  assert.equal(tables, 14); assert.equal(images, 8); assert.ok(tableBlanks >= 60);
  assert.ok(texts.join("").includes("−2.41‰"));
  assert.ok(texts.join("").includes("女性为100"));
  assert.ok(data.audit.corrections.every((c) => c.original && c.revised && c.reason));
  const context = { OrangeCoach: { features: { recallCards: { progressModel: () => ({ tone: "", label: "未开始" }) } } } };
  vm.runInNewContext(await readFile(new URL("../assets/features/pocket-recall.js", import.meta.url), "utf8"), context);
  for (const section of data.sections) {
    const html = context.OrangeCoach.features.pocketRecall.render({ module: data, section, progressByLesson: {} });
    assert.equal((html.match(/data-blank-id=/g) || []).length, context.OrangeCoach.features.pocketRecall.countBlanks(section.blocks));
    assert.equal((html.match(/class="(?:pocket-blank-answer|recall-blank-answer)" hidden/g) || []).length, (html.match(/data-blank-id=/g) || []).length);
    assert.ok(!html.includes("undefined"));
  }
  return `人口样板：8单元/${ids.size}空/${tableBlanks}表格空/${images}原图，合并单元格与默认隐藏校验通过`;
}
