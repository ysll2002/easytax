# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-09-18（由 Claude 在搭建 agent 时初始化）**

## HMRC

- Production 审批：**PENDING**。App 已完整对接 HMRC sandbox。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- 影响：**pre-revenue**，没有 Stripe，没有真实申报。

## 指标（2026-09-18 09:16 UTC）

| 指标 | total | 24h | 7d | 30d |
|---|---|---|---|---|
| 注册 | 48 | 0 | 3 | 5 |
| HMRC 连接 | 18 | 0 | 3 | 4 |
| 银行连接 | 1 | 0 | 0 | — |
| 申报 | 0 | 0 | 0 | 0 |

- 注册 → HMRC 连接转化率：**37.5%**（健康）
- 独立申报用户：0
- MRR：£0 · 距 £10,000/mo 目标：**£10,000**

## 漏斗埋点

- 埋点起始：2026-09-03，**只有约 14.7 天数据** —— 任何「7d/30d」窗口都被截断到这个范围，
  和 GA 对比时必须用同样的区间。
- production 事件总量 601，development 78。
- **从未触发过的事件**（要么没埋对，要么那条路径根本没人走）：
  `launch_subscribed` · `article_cta_click` · `checker_started` · `checker_completed` ·
  `tool_cta_click` · `editorial_standards_viewed` · `schedule_requested` · `schedule_sent` ·
  `calendar_cta_click` · `reactivation_sent` · `share_click` · `share_copy`
- **只在 dev 触发过**：`tool_started` · `tool_completed` · `share_card_served`
- 近 7 天流量几乎全在首页 `/`（52 PV / 34 UV / 0 转化），tax-tips 文章页个位数。

## 当前瓶颈（我的判断）

1. **流量太少** —— 7 天 34 个独立访客，任何转化优化都没有统计意义。
2. **CTA 从没被点过** —— 一堆 CTA 事件 never_fired，要么埋点坏了要么 CTA 不可见。
3. **申报为 0** —— 被 HMRC production 审批卡住，非产品问题。

## 在飞的分支

（无）

## 待复盘的 metric

（无 —— BACKLOG 里还没有 shipped 满 7 天的条目）
