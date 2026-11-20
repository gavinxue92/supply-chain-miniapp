# Issue 跟踪器：本地 Markdown

本仓库的规格与工单以 Markdown 文件存放在 `.scratch/` 中。

## 约定

- 每个功能使用一个目录：`.scratch/<feature-slug>/`
- 规格文档为 `.scratch/<feature-slug>/spec.md`
- 每张实现工单使用单独的文件：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，编号从 `01` 开始；不要将多个工单合并为一个文件
- 在工单文件顶部附近记录分流状态，使用 `Status:` 字段：`ready-for-agent`、`blocked`、`done`、`ready-for-human`
- 评论与讨论历史追加到文件底部的 `## Comments` 标题下
- 阻塞关系在工单顶部用 `Blocked by:` 字段记录； blockers 全部完成后工单才进入前沿

## 当 Skill 要求“发布到 Issue 跟踪器”时

在 `.scratch/<feature-slug>/` 下创建新文件，必要时创建目录。

## 当 Skill 要求“获取相关工单”时

读取用户提供的路径或工单引用；通常由用户直接传入文件路径或工单编号。
