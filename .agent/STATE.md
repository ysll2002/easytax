# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-09-23（18:34 UTC 指标快照）**

## HMRC

- Production 审批：**PENDING**。App 已完整对接 HMRC sandbox（ITSA + VAT 两条路径都有调用）。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- ⚠️ **新的外部风险（2026-09-23 发现）**：HMRC Developer Hub *Income Tax MTD end-to-end service guide*
  （Updated 15 Sep 2026）Overview 横幅：「no longer accepting production credential access requests for
  new 2026–27 quarterly update products, as the market window for these products has now closed」。
  页面没说在审申请怎么处理，也没说 2027–28 何时重开。**需要 owner 向 HMRC 书面确认（BACKLOG stg-007）。**
  VAT 路径不在该横幅范围内。
- 24h 内无 HMRC 官方来信。
- 影响：**pre-revenue**，没有 Stripe，没有真实申报。

## 指标（2026-09-23 18:34 UTC，对比 2026-09-22 06:40 UTC）

| 指标 | total | 24h | 7d | 30d |
|---|---|---|---|---|
| 注册 | 48 (+0) | 0 | 0 (上次 1) | 4 |
| HMRC 连接 | 18 (+0) | 0 | 0 (上次 1) | 4 |
| 银行连接 | 1 (+0) | 0 | 0 | — |
| 申报 | 0 (+0) | 0 | 0 | 0 |

- **连续 ≥7 天零新增注册**（total 自 2026-09-18 起一直是 48）。
- 注册 → HMRC 连接转化率：37.5%（不变）
- MRR：£0 · 距 £10,000/mo 目标：**£10,000**

## 流量北极星（human unique visitors）

- 7d：human visitors 32 / pv 43，human_share 72.9%（上次 30 / 38 / 69.1%）。
- 30d：human visitors 53 / pv 76，human_share 57.6%。
- 7d engagement：22 个访客有 page_engaged，avg 滚动深度 17%。
- GA4 7d 渠道：Direct 19 用户 · Organic 13（**bing 7 / google 6**）· Referral 2
  （`test-www.tax.service.gov.uk` = HMRC sandbox 回跳，非真实流量）· chatgpt.com 1。
- 首页 `/` 仍占压倒性多数（7d 20 UV），其次 /pricing 3 UV 和几篇 tax-tips。
- 转化：visitor_to_register 7d 0%（0/42），30d 2.1%。

## 漏斗埋点

- 埋点起始 2026-09-03，20.1 天数据，7d/30d 仍被截断。
- `never_fired` 与昨天相同（PR #24 未合，且即使合进 staging 也不会上线——见下）。
- 诊断结论见 BACKLOG stg-002：真 bug 已修在 PR #24；article_cta_click 等是流量太小；
  calendar_cta_click / reactivation_sent / share_* 是未建功能；launch_subscribed 已废弃；
  schedule_sent 缺服务端 track()（stg-002b）。

## Deployment 状态

- Production = `main` HEAD `7bf7bde`（PR #20），构建于 2026-09-16，**已 7 天无新部署**。
- **production 只从 main 构建**（metrics `deployment.built_from_main: true`）。本 agent 的 PR 都对 `staging`，
  合进 staging 只影响 staging 预览，要上线还需 staging→main（BACKLOG stg-008）。
- 另一系统在 main 上挂起的 PR：#21、#22、#23（5–7 天）。
- editorial：115 篇已发布，最后发布 2026-09-19（4 天前），1 篇草稿待 owner 审（另一系统领域，只记录）。

## 另一套独立的自动化增长系统

见 BACKLOG stg-001 与 memory `easytax-dual-automation-systems`。今天无新信息，仍需 owner 决定分工。

## 在飞的分支

- `agent/2026-09-22-fix-schedule-event-tracking` → [PR #24](https://github.com/ysll2002/easytax/pull/24)（待合 staging，之后还需进 main）
- `agent/2026-09-22-hero-friendly-flat-preview` → [PR #25](https://github.com/ysll2002/easytax/pull/25)（待 owner 看 Vercel preview）

## 待复盘的 metric

- PR #24 **上线到 production 后**（不是合进 staging 后）7 天：`schedule_requested` /
  `editorial_standards_viewed` 是否离开 `never_fired`，站内最大 CTA 的真实转化率。原定 2026-09-29，
  现在按上线日期顺延。
- stg-007：HMRC 答复到达后立即重新评估收入路线。
