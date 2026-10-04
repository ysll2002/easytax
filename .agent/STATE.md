# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-10-04（owner 对话：HMRC 正式说明申请窗口；指标仍是 2026-09-23 18:34 UTC 快照）**

## HMRC

- Production 审批：**PENDING**。App 已完整对接 HMRC sandbox（ITSA + VAT 两条路径都有调用）。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- ✅ **申请窗口问题已解决（2026-10-04，HMRC Louise Tarpy 的正式说明）**：8-10 之前提交的申请继续审。我们 7-08 提交，**在范围内**。
  但不达标会被拒，而被拒后最早要等 2027 年初公布的 2027–28 流程。readiness 标准包含 ToU「accurate representation」和 AI 内容审核条款。
- ⚠️ **新风险（2026-10-04 发现）**：多个公开营销页（`app/*-alternative/page.tsx`、`app/mtd-software`、`app/self-assessment-software`）
  声称 EasyTax 能提交 CT600、final declaration、Self Assessment、landlord/property 收入，但代码里没有这些提交功能，
  和我们向 HMRC 声明的「仅年内季度更新、仅 self-employment」以及 dashboard 页脚的说明矛盾。见 BACKLOG stg-010。
- **2026-09-24 12:25 UTC HMRC FPH 团队回信**（ITSA 工单 CMQAA-923 / 2026-NQM717，Aleesah Sher）：
  审了 2026-09-23 12:16–12:17 UTC 的 sandbox 流量（11 个 ITSA API）。
  - `Gov-Client-Multi-Factor`：同意省略（继续不发；将来加了应用内 MFA 要通知 HMRC）。
  - `Gov-Vendor-License-IDs`：「Header required」。和 8 月 VAT 工单 CMQAA-712 的结论冲突（当时 userId 哈希被判为 dummy 值，所以删了）。
  - 他们要求：修正 → 用 Test API 验证 → 用**不同设备和不同用户**再提交一批请求。
  - 正面信号：截止日（9-15）之后他们还在审我们的申请。
- **owner 选了方案 A（2026-09-25）**：先回信解释、不改代码。回信草稿已存进 Gmail（在该 HMRC 线程里，未发送），
  内容：正式通知按次收费（£20+VAT/每次申报）但不发许可证密钥所以省略 License-IDs、请求像 MFA 一样记录；承诺用不同设备和用户重测；
  并问截止令的影响。**owner 已在 2026-09-25 16:01 UTC 发出；HMRC 9-29 回复已转给 FPH 团队，等结果。**
- 影响：**pre-revenue**。/pricing 标价 £20+VAT 每次申报，但 `app/payment/page.tsx` 仍是模拟支付、没接 Stripe；没有真实申报。

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
