# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-09-18（首次真实运行）**

## HMRC

- Production 审批：**PENDING**。App 已完整对接 HMRC sandbox。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- 影响：**pre-revenue**，没有 Stripe，没有真实申报。
- 今天 24h 内 Gmail 未搜到任何 HMRC / MTD / Fraud Prevention 相关邮件。

## 指标（2026-09-18 14:43 UTC）

| 指标 | total | 24h | 7d | 30d |
|---|---|---|---|---|
| 注册 | 48 | 0 | 3 | 5 |
| HMRC 连接 | 18 | 0 | 3 | 4 |
| 银行连接 | 1 | 0 | 0 | — |
| 申报 | 0 | 0 | 0 | 0 |

- 与今早 09:16 UTC 的快照相比**全部无变化**（同一天内两次拉取，正常）。
- 注册 → HMRC 连接转化率：**37.5%**（健康，样本极小）
- MRR：£0 · 距 £10,000/mo 目标：**£10,000**

## 流量北极星（新口径，见 BACKLOG stg-003）

- 过去 7 天真实人类独立访客：约 **35–38**（`audience.last_7d.human.visitors` ≈ 35，
  `human_share` = 0.50 —— 另一半是 headlesschrome / meta-externalagent 等爬虫）。
  **以后优先看这个数字，而不是总 UV/PV**，避免被 bot 流量误导。
- 总口径（含 bot）：7d unique_visitors 75 / page_views 96；30d unique_visitors 123 / page_views 168。
- 首页 `/` 仍占压倒性多数（7d 51 PV / 33 UV）。
- 转化：visitor_to_register 4%（7d），register_completion 100%（3/3，样本极小）。

## 漏斗埋点

- 埋点起始：2026-09-03，约 15 天数据，7d/30d 窗口仍被截断。
- **never_fired 事件不变**：`launch_subscribed`、`article_cta_click`、`checker_started`、
  `checker_completed`、`tool_cta_click`、`editorial_standards_viewed`、`schedule_requested`、
  `schedule_sent`、`calendar_cta_click`、`reactivation_sent`、`share_click`、`share_copy`。
  —— 见 BACKLOG stg-002，需要诊断是埋点没挂上还是真的没人点。
- 9 个 alternative 对比页（bokio/coconut/crunch/freeagent/kashflow/quickbooks/sage/
  taxscouts/xero）30 天内 0 访问；已确认非内链缺失（SiteFooter.tsx 已全站互链），
  是整体流量太小轮不到长尾页 —— 见 BACKLOG stg-005。

## 重大发现：另一套独立的自动化增长系统

repo 里有一套**不受本 RUNBOOK 治理**的自动化系统，在 `main` 分支活跃开发（PR #17–#23，
内部编号 F1–F60），今天 06:39 UTC 还用 Gmail `send_message`（真发不是草稿）发过日报。
详见 `BACKLOG.md` stg-001 的完整说明。**这是今天最需要 owner 决策的事项。**

## 在飞的分支

（本 agent 今天没有开分支 —— Top 1 是治理问题，不满足 IMPLEMENT-NOW 条件，见「今日执行」）

## 待复盘的 metric

（无 —— BACKLOG 里还没有 shipped 满 7 天的条目）
