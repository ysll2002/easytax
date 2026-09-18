# EasyTax Agent — 滚动待办

> 每日 agent 更新状态、追加新条目，**不删除历史条目**。
> 状态：`proposed` → `approved` → `in-progress` → `shipped` → `verified` / `rejected` / `stale`
>
> Owner 可以直接编辑这个文件来改优先级或否掉条目，agent 每天开工时会读。

| id | 标题 | 状态 | Risk | Metric | 分支 / PR | 备注 |
|---|---|---|---|---|---|---|
| stg-001 | 查清两套自动化增长系统的分工 | proposed | N/A | owner 给出书面分工 | — | 见下方说明；BLOCKED，需 owner 决定 |
| stg-002 | 诊断 CTA / checker 转化事件为何从未在 production 触发 | proposed | LOW | 每个 never_fired 事件标注「代码没挂上」/「没人点」 | — | PROPOSE-ONLY，需先读代码不改代码 |
| stg-003 | 用 human unique visitors 作为流量北极星，而非总 PV | done | LOW | STATE.md/JOURNAL.md 起用新口径 | — | 纯记忆/报告口径调整，非 repo 代码改动，2026-09-18 起生效 |
| stg-004 | 内容深度补课：114 篇文章 median 641 字，0 篇达标 1100 字 | proposed | LOW | archive_depth 达标篇数 | — | BLOCKED —— 属于另一套 editorial pipeline 职责范围，本 agent 只监控 |
| stg-005 | Alternative 对比页（9 个）30 天内 0 访问，考虑站外获客而非站内优化 | proposed | N/A | 9 个页面中至少 1 个 30 天内出现非 0 UV | — | 已确认非内链问题（SiteFooter.tsx 已全站互链），PROPOSE-ONLY |

## Owner 的长期禁区 / 已否决方向

（空 —— agent 每次被 owner 否掉一个方向时，把原因记在这里，以后不再重复推荐）

## 说明：stg-001 —— 发现另一套自动化增长系统

2026-09-18 首次真实运行时发现，repo 里存在**另一套独立运作的自动化系统**（并非本 RUNBOOK
治理的 daily agent）：

- 直接对 `main` 分支开 PR（编号 #17–#23，`F1`–`F60` 内部编号），过去几天已合并 #17/#19/#20，
  当前 PR #23「Growth 2026-09-18 — the pipeline died on a quotation mark」仍 OPEN
  （<https://github.com/ysll2002/easytax/pull/23>），内容涵盖 editorial JSON 健壮性、
  SERP 标题/描述长度、RSS/llms.txt、SEO 审计。
- 今天 06:39 UTC 用 Gmail **`send_message`**（不是 `create_draft`）真的发出过一封日报邮件
  到 `lilin.gabriel@gmail.com`，标题「EasyTax 日报 2026-09-18：管线被一个引号搞死了」。
- 有自己的 cron（`app/api/cron/daily-article`、`app/api/cron/growth-snapshot`、
  `app/api/cron/mtd-reminder` 等）和自己的 `GROWTH_YYYY-MM-DD.md` 记录文件。

这套系统的护栏（push main、真发邮件）比本 agent 的护栏宽松得多。在 owner 明确分工之前，
本 agent 的 Top 5 **刻意避开** SEO/标题描述/editorial 内容生成/RSS 这些已经被那套系统覆盖的
方向，防止两边改同一批文件产生冲突。
