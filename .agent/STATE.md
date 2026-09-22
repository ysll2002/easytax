# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-09-22（06:40 UTC 指标快照）**

## HMRC

- Production 审批：**PENDING**（无变化）。App 已完整对接 HMRC sandbox。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- 影响：**pre-revenue**，没有 Stripe，没有真实申报。
- 过去 4 天（newer_than:4d）Gmail 未搜到任何 HMRC / MTD / Fraud Prevention 相关邮件。

## 指标（2026-09-22 06:40 UTC，对比 2026-09-18 14:43 UTC）

| 指标 | total | 24h | 7d | 30d |
|---|---|---|---|---|
| 注册 | 48 (+0) | 0 | 1 | 4 |
| HMRC 连接 | 18 (+0) | 0 | 1 | 4 |
| 银行连接 | 1 (+0) | 0 | 0 | — |
| 申报 | 0 (+0) | 0 | 0 | 0 |

- **注意**：total 列 4 天内**完全没有变化**（注册仍 48，HMRC 连接仍 18）。样本太小无法判断是否异常，但值得留意——上次运行以来没有一个新用户完成注册。
- 注册 → HMRC 连接转化率：**37.5%**（不变，样本极小）
- MRR：£0 · 距 £10,000/mo 目标：**£10,000**

## 流量北极星（human unique visitors，见 BACKLOG stg-003）

- 7d：human visitors 30 / human pv 38，human_share 69.1%（上次快照 ≈35 visitors / share 50%，
  统计口径调整过（`props.bot` 2026-09-11 起才可靠），不建议做强趋势判断，只看量级）。
- 30d：human visitors 43 / human pv 61，human_share 52.1%。
- funnel 口径（`funnel.last_7d`）：unique_visitors 41 / page_views 55（上次快照 75/96，7 天窗口本身滑动，
  不代表真实下滑，需要连续多天观察才能判断趋势）。
- 首页 `/` 仍占压倒性多数。
- 转化：visitor_to_register 2.4%（7d，样本 1/41）。

## 漏斗埋点

- 埋点起始：2026-09-03，18.6 天数据，7d/30d 窗口仍被截断。
- **诊断完成（2026-09-22，见 JOURNAL + BACKLOG stg-002）**：
  - 真 bug 已修（PR #24，待 owner 合并）：`schedule_requested`（站内最大 CTA——每篇 tax-tip
    文章的邮件截止日期表单——之前打错事件名 `schedule_started` 且两个名字都不在
    `app/api/track/route.ts` 的 allowlist 里，被静默丢弃）、`editorial_standards_viewed`
    （同样漏了 allowlist）。
  - 确认非 bug、纯低流量：`article_cta_click` / `checker_started` / `checker_completed` /
    `tool_cta_click`（代码接线正确，production 上到达这些页面/组件的真实访问太少）。
  - 确认未实现（代码里根本没有调用点）：`calendar_cta_click` / `reactivation_sent` /
    `share_click` / `share_copy`。
  - 确认已废弃：`launch_subscribed`（旧的 launch waitlist 已被 DeadlineScheduleForm 取代）。
  - 遗留（stg-002b，PROPOSE-ONLY）：`schedule_sent` 在 `app/api/schedule/route.ts` 的邮件发送
    成功路径上完全没有 `track()` 调用，需要单独一天实现。
- 9 个 alternative 对比页：2026-09-22 起 `/freeagent-alternative` 30d 口径下出现 1 UV（首次非零），
  其余 8 个仍是 0——见 BACKLOG stg-005。

## Deployment 状态（新观察，2026-09-22）

- Production 部署的 commit 与 `origin/main` HEAD 一致（`7bf7bde`，PR #20），但该部署已构建
  **5 天**（`deployment.built_at` 2026-09-16），`main` 上此后没有新合并。
- 另一套自动化系统在 `main` 上还有 3 个 PR 挂起未合：#21（Organization/WebSite schema）、
  #22（Growth 2026-09-17）、#23（Growth 2026-09-18），已挂起 4–6 天——不属于本 agent 的护栏范围，
  仅记录供 owner 参考，不是本 agent 要处理的事。

## 重大发现：另一套独立的自动化增长系统

repo 里有一套**不受本 RUNBOOK 治理**的自动化系统，在 `main` 分支活跃开发，2026-09-18 06:39 UTC
还用 Gmail `send_message`（真发不是草稿）发过日报。2026-09-19 09:04 UTC 该系统还自己发过一封
「11 天没有新文章发布」的告警邮件（`hello@easytax.vip`）。详见 `BACKLOG.md` stg-001 的完整说明。
**这仍是需要 owner 决策的事项，本次运行没有新增信息改变这个判断。**

## 在飞的分支

- `agent/2026-09-22-fix-schedule-event-tracking` → [PR #24](https://github.com/ysll2002/easytax/pull/24)
  （待 owner 审核合并到 `staging`）——修复 `schedule_requested` / `editorial_standards_viewed`
  两个埋点事件被静默丢弃的 bug。
- `agent/2026-09-22-hero-friendly-flat-preview` → [PR #25](https://github.com/ysll2002/easytax/pull/25)
  （待 owner 看 Vercel preview 决定）——首页 hero「Friendly Flat」视觉方向预览，owner 实时对话中
  明确要求实现（见 BACKLOG stg-006、JOURNAL 2026-09-22）。只改了 hero + 公告条，SiteHeader 和
  其余板块未动。

## 待复盘的 metric

- PR #24 合并并部署后，观察 `funnel.reality_check.never_fired`：`schedule_requested` 和
  `editorial_standards_viewed` 应该在任何一次表单提交/页面访问后从列表消失。7 天后（约
  2026-09-29）来看这两个事件是否已经有真实计数，以及站内最大 CTA 的真实转化率现在是多少。
