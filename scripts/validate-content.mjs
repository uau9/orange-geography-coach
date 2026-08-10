import { readFile } from "node:fs/promises";

const topics = JSON.parse(await readFile(new URL("../data/topics.json", import.meta.url), "utf8"));
const questions = JSON.parse(await readFile(new URL("../data/questions.json", import.meta.url), "utf8"));
const paperReviews = JSON.parse(await readFile(new URL("../data/paper_reviews.json", import.meta.url), "utf8"));
const retests = JSON.parse(await readFile(new URL("../data/retests.json", import.meta.url), "utf8"));
const topicIds = new Set(topics.map((topic) => topic.id));
const errors = [];

if (!Array.isArray(topics) || topics.length === 0) errors.push("topics.json 必须是非空数组");
if (!Array.isArray(questions) || questions.length === 0) errors.push("questions.json 必须是非空数组");
if (!Array.isArray(paperReviews) || paperReviews.length === 0) errors.push("paper_reviews.json 必须是非空数组");
if (!Array.isArray(retests) || retests.length === 0) errors.push("retests.json 必须是非空数组");

const ids = new Set();
for (const question of questions) {
  if (ids.has(question.id)) errors.push(`题目编号重复：${question.id}`);
  ids.add(question.id);
  if (!topicIds.has(question.topic_id)) errors.push(`${question.id} 引用了不存在的主题：${question.topic_id}`);
  const optionIds = question.options?.map((option) => option.id) ?? [];
  if (new Set(optionIds).size !== optionIds.length) errors.push(`${question.id} 选项编号重复`);
  if (!optionIds.includes(question.answer)) errors.push(`${question.id} 正确答案不在选项中`);
  for (const optionId of optionIds.filter((id) => id !== question.answer)) {
    if (!question.error_map?.[optionId]?.tag) errors.push(`${question.id} 缺少 ${optionId} 的 error_tag`);
  }
  if (!Array.isArray(question.review_after_days) || question.review_after_days.length === 0) {
    errors.push(`${question.id} 缺少复测间隔`);
  }
}

const paperIds = new Set();
for (const review of paperReviews) {
  if (review.schema_version !== "0.2.0") errors.push(`${review.id || "未知试卷"} schema_version 必须为 0.2.0`);
  if (paperIds.has(review.id)) errors.push(`试卷复盘编号重复：${review.id}`);
  paperIds.add(review.id);
  const raw = review.scores?.raw;
  const standard = review.scores?.standard;
  if (!raw || !standard) errors.push(`${review.id} 必须分开记录卷面原始分和标准分`);
  if (raw && raw.objective.earned + raw.subjective.earned !== raw.earned) {
    errors.push(`${review.id} 卷面分项与总分不一致`);
  }
  const reviewedQuestion = review.reviewed_question;
  if (reviewedQuestion) {
    const earned = reviewedQuestion.subquestions.reduce((sum, item) => sum + item.earned_points, 0);
    const max = reviewedQuestion.subquestions.reduce((sum, item) => sum + item.max_points, 0);
    if (earned !== reviewedQuestion.earned_points || max !== reviewedQuestion.max_points) {
      errors.push(`${review.id} ${reviewedQuestion.id} 小问分数与总分不一致`);
    }
  }
}

const retestIds = new Set();
for (const retest of retests) {
  if (retest.schema_version !== "0.2.0") errors.push(`${retest.id || "未知复测"} schema_version 必须为 0.2.0`);
  if (retestIds.has(retest.id)) errors.push(`复测编号重复：${retest.id}`);
  retestIds.add(retest.id);
  if (!paperIds.has(retest.source_paper_review_id)) errors.push(`${retest.id} 引用了不存在的试卷复盘`);
  const rubricIds = new Set();
  let maxPoints = 0;
  for (const question of retest.questions || []) {
    const rubricTotal = question.rubric_points.reduce((sum, point) => sum + point.points, 0);
    if (rubricTotal !== question.max_points) errors.push(`${retest.id} ${question.id} 评分点分值与小问满分不一致`);
    maxPoints += question.max_points;
    for (const point of question.rubric_points) {
      if (rubricIds.has(point.id)) errors.push(`${retest.id} 评分点编号重复：${point.id}`);
      rubricIds.add(point.id);
    }
  }
  if (retest.pass_rule.min_points > maxPoints) errors.push(`${retest.id} 通过分数超过总分`);
  for (const requiredId of retest.pass_rule.required_rubric_ids) {
    if (!rubricIds.has(requiredId)) errors.push(`${retest.id} 引用了不存在的必须评分点：${requiredId}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 内容校验通过：${topics.length} 个主题，${questions.length} 道选择题，${paperReviews.length} 份试卷复盘，${retests.length} 组复测`);
