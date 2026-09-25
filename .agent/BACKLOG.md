# EasyTax Agent — 滚动待办

> 每日 agent 更新状态、追加新条目，**不删除历史条目**。
> 状态：`proposed` → `approved` → `in-progress` → `shipped` → `verified` / `rejected` / `stale`
>
> Owner 可以直接编辑这个文件来改优先级或否掉条目，agent 每天开工时会读。

| id | 标题 | 状态 | Risk | Metric | 分支 / PR | 备注 |
|---|---|---|---|---|---|---|
| stg-001 | 查清两套自动化增长系统的分工 | proposed | N/A | owner 给出书面分工 | — | 见下方说明；BLOCKED，需 owner 决定。2026-09-22：main 已推进到 PR#20，仍有 #21/#22/#23 挂起 4–6 天未合，production 落后 main 0 个提交但 5 天没有新合并 |
| stg-002 | 诊断 CTA / checker 转化事件为何从未在 production 触发 | in-progress | LOW | 每个 never_fired 事件标注「代码没挂上」/「没人点」 | `agent/2026-09-22-fix-schedule-event-tracking` / [PR #24](https://github.com/ysll2002/easytax/pull/24) | 2026-09-22 完成诊断，见 JOURNAL。已修 2 个真 bug（schedule_requested 改名未接 allowlist、editorial_standards_viewed 漏 allowlist），已开 PR。article_cta_click/checker_started/checker_completed/tool_cta_click 确认代码没问题，是流量太小没人点。calendar_cta_click/reactivation_sent/share_click/share_copy 确认代码里根本不存在调用点（未建的功能，非 bug）。launch_subscribed 所属旧功能已被 DeadlineScheduleForm 取代。剩余 stg-002b：schedule_sent（邮件真发送后应打的点）在 app/api/schedule/route.ts 里完全没有 track() 调用，需要单独一天实现 |
| stg-002b | 给 /api/schedule/route.ts 的邮件发送成功路径补上 schedule_sent 的 track() 调用 | proposed | LOW | schedule_sent 从 never_fired 移除 | — | 从 stg-002 拆出来的后续项。2026-09-23 排 #3，本身满足 LOW+HIGH+IMPLEMENT-NOW，但 Top 1 是 compliance 所以当天不实现。等哪天它成为 Top 1 再做 |
| stg-003 | 用 human unique visitors 作为流量北极星，而非总 PV | done | LOW | STATE.md/JOURNAL.md 起用新口径 | — | 纯记忆/报告口径调整，非 repo 代码改动，2026-09-18 起生效 |
| stg-004 | 内容深度补课：114 篇文章 median 641 字，0 篇达标 1100 字 | proposed | LOW | archive_depth 达标篇数 | — | BLOCKED —— 属于另一套 editorial pipeline 职责范围，本 agent 只监控 |
| stg-005 | Alternative 对比页（9 个）30 天内 0 访问，考虑站外获客而非站内优化 | proposed | N/A | 9 个页面中至少 1 个 30 天内出现非 0 UV | — | 已确认非内链问题（SiteFooter.tsx 已全站互链），PROPOSE-ONLY。2026-09-22：30d 口径下 /freeagent-alternative 首次出现 1 UV，其余 8 个仍 0 |
| stg-006 | 首页视觉改版："Friendly Flat" 方向（粗描边+cobalt/yellow强调色）预览 | in-progress | MEDIUM | owner 看完 staging 预览后决定是否推广到全站 | `agent/2026-09-22-hero-friendly-flat-preview` / [PR #25](https://github.com/ysll2002/easytax/pull/25) | owner 反馈首页太像 AI 生成网站 → 出了 3 个设计方向 → owner 选中方向 C → 已应用到首页 hero（仅 hero + 公告条，SiteHeader 和其余板块未动），owner 明确要求实现，超出当日 1 项额度但因是 owner 直接指令而做，见 JOURNAL 2026-09-22。等 owner 看完 Vercel PR 预览决定：ship it（合 staging）/ 调整方向 / 推广到全站（更大范围的改动，需要单独评估） |
| stg-007 | 向 HMRC 书面确认：在审的 ITSA production 申请是否受 2026-09-15「不再受理新 2026–27 季度更新产品」截止令影响 | in-progress | HIGH（compliance） | 拿到 HMRC 书面答复（是否 grandfathered / VAT 路径是否单独推进 / 2027–28 何时重开） | — | 2026-09-23 新增，排 #1，BLOCKED——只有 owner 能联系 Aleesah Sher / Ciaran McLaughlin。来源：HMRC Developer Hub *Income Tax MTD end-to-end service guide* Overview 横幅（页面 Updated 15 Sep 2026），agent 已 WebFetch 原页核实。决定了整个收入路线是否成立。2026-09-25：HMRC 9-24 FPH 回信（MFA 可省略、License-IDs 要求有），owner 选方案 A——回信草稿已在 Gmail（附带问截止令），待 owner 发送 + 多设备多用户重测。方案 B（真实发放每用户许可证 ID，改 lib/hmrc.ts + DB schema，HIGH）暂不做，等 HMRC 答复 |
| stg-008 | 让 PR #24 的埋点修复真正上线：staging 合并后还需 staging→main | proposed | LOW | production `never_fired` 中 schedule_requested / editorial_standards_viewed 消失 | PR #24 | 2026-09-23 新增。production 只从 main 构建（metrics `deployment.built_from_main`），本 agent 的 PR 都对 staging，合进 staging 不会改变线上。纯 owner 操作，agent 不合并不部署 |
| stg-009 | 探索会计师事务所渠道（小型事务所的多客户 MTD 工作台 / 合作页） | proposed | MEDIUM | 先做 5 个会计师访谈或 1 个 /for-accountants 着陆页的等候名单数 | — | 2026-09-23 新增，PROPOSE-ONLY。依据：HMRC 统计 £50k+ 首批人群 75% 有会计师代理（owner 自己发的市场分析邮件引用）。方向性决策，且取决于 stg-007 结果，不自主实现 |

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
