# 学习档案与外部批注

## 一次交接流程

1. 在“家长”页点击“导出可批注学习档案”；
2. 点击“复制批注说明”；
3. 把 JSON 文件和批注说明一起交给 Codex、ChatGPT 或教师；
4. 对方返回完整 JSON 文件；
5. 在同一页面点击“导入批注档案”；
6. 在“教练批注”中核对批注内容和证据编号。

文件名示例：

```text
orange-geography-records-2026-08-10T21-30-45+08-00.json
```

它包含本地日期、时分秒和时区偏移。档案正文另有：

- `exported_at`：UTC时间；
- `exported_at_local`：含偏移的本地时间；
- `timezone`：浏览器报告的IANA时区；
- `export_id`：本次导出的唯一时间编号。

## 批注边界

外部批注者只能向 `coach_annotations` 追加内容，不能修改这些原始证据：

- `attempts`；
- `retest_attempts`；
- `time_lab_attempts`；
- `earth_motion_attempts`；
- `solar_season_attempts`。

当前浏览器已有学习记录时，导入器只合并新增批注，不用档案覆盖本地原始记录；如果档案中的原始记录与本地证据不一致，导入会停止并提示重新核对。空浏览器仍可通过完整档案迁移学习记录。

每条批注至少包含：

- 批注编号和时间；
- 批注者；
- 覆盖范围；
- `evidence_refs` 证据编号；
- “候选 / 已确认 / 需教师复核”之一；
- 基于证据的观察；
- 可执行的下一步。

档案内的 `annotation_guide` 已包含机器可读的字段模板和批注原则。格式约束见 `schemas/learning-export.v0.7.schema.json`。

## 隐私检查

系统不会主动加入姓名、学校、班级或联系方式，但作答理由、AI返回和家长备注都是自由文本。对外发送前必须人工检查这些字段。导出文件不会自动上传，导入也只写入当前浏览器的 LocalStorage。

## 长期跟踪

后续再次导出时，既有 `coach_annotations` 会随档案保留。新的批注应追加而不是覆盖，并通过 `created_at`、`scope` 和 `evidence_refs` 形成时间序列。是否掌握仍以家长确认和延迟复测为准，批注本身不是掌握证明。
