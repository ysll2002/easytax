# EasyTax — 当前状态快照

> 每日 agent 每次运行后**覆盖写**这个文件。要看历史请查 `JOURNAL.md`。

**最后更新：2026-11-14（PR #34 年终 sandbox）；之前 2026-11-13 下午（owner 实时对话：填好 HMRC Software Choices + WCAG 表。指标仍是 10-10 的快照，没有重拉）**

## HMRC

- 🎉 **2026-11-11 Production 已批准**（CMQAA-923 / 2026-NQM717，John Morris）：`EasyTax VIP`（ID 50b9bae2-5fa2-4145-a932-cb087495a255）获批 11 个 ITSA API + VAT (MTD) API；ITSA FPH 评估通过；重复应用 `EasyTax.VIP` 已拒。没批的只有 Check a UK VAT Number 2.0（代码没用到，11-13 草稿里撤回，**草稿待 owner 发**）。
  - 按 RUNBOOK 第 3 节，**compliance 护栏已解除**（production 审批已通过）。
  - 待办：① CMQAA-712 回复草稿**发之前先改价格**：草稿写的「非免费 £20+VAT」已过时，main 从 10-14 起完全免费（PR #31）② Paul Anderson 邮件：两张表已填好，在 `hmrc/2026-11-software-choices/`（填表人姓名留空待 owner 填）；附件里的「Complete Initial Set-up Process」是要 owner 在 Developer Hub 点「I have finished」，没有要填的内容；回信草稿在 `hmrc/2026-11-software-choices/reply-to-paul-anderson.md`，待 owner 发。owner 想申请 final declaration、property 和 CT600，已在回信里问 HMRC 流程。**列表上线前先修 stg-010**（/mtd-software 仍声称支持 CT600、final declaration、landlord），并发布无障碍声明页 ⑥ WCAG 表里承诺修复的项（对比度、autocomplete、skip link、页面标题、焦点样式、提交前确认步骤）③ 第一次 live VAT 提交后 14 天内报 VRN ④ **网站文案从「测试/待审批」改成「可以真实报税」**（owner 11-11 提出，还没做；同时要修 stg-010 的夸大声明）⑤ 每月 FPH 状态邮件，Developer Hub 团队成员要保持最新。
- 以下是批准前的历史记录：
- Production 审批（历史）：PENDING。App 已完整对接 HMRC sandbox（ITSA + VAT 两条路径都有调用）。
- FPH 审查进行中，对接人：Aleesah Sher / Ciaran McLaughlin（HMRC）。
- ✅ **申请窗口问题已解决（2026-10-04，HMRC Louise Tarpy 的正式说明）**：8-10 之前提交的申请继续审。我们 7-08 提交，**在范围内**。
  但不达标会被拒。被拒后要等 2027 年初公布的 2027–28 流程是**推断**，HMRC 没有明确说，也没说能否在原申请内补材料重提。readiness 标准包含 ToU「accurate representation」和 AI 内容审核条款。
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
- **2026-10-10 sandbox 覆盖测试**：第一次 56/65（8 个 429，是两轮同时在跑）→ owner 单标签页重跑 **64/65**，只剩预期的 VAT DUPLICATE_SUBMISSION（stg-012）。还没做：HMRC 要求的不同设备、不同用户重测。
- 影响：**pre-revenue**。2026-10-14 起网站**完全免费**（PR #31，`lib/pricing.ts`）。production main = `d17a0c2`。

## 指标（2026-10-10 08:23 UTC，对比 2026-09-23 18:34 UTC）

| 指标 | total | 24h | 7d | 30d |
|---|---|---|---|---|
| 注册 | 50 (+2) | 0 | 0 | 5 |
| HMRC 连接 | 18 (+0) | 0 | 1 | 5 |
| 银行连接 | 1 (+0) | 0 | 0 | — |
| 申报 | 0 (+0) | 0 | 0 | 0 |

- 7d 注册仍为 0；17 天里新增 2 个注册。
- 注册 → HMRC 连接转化率：36%
- MRR：£0 · 距 £10,000/mo 目标：**£10,000**

## 流量北极星（human unique visitors）

- 7d：human visitors 32 / pv 39，human_share 90.7%。30d：human visitors 117 / pv 174。
- 7d engagement：7 个访客有 page_engaged，avg 滚动深度 24%。
- **GA4 7d：google organic 17 用户 / 18 sessions（09-23 是 6）**· direct 14 · `test-www.tax.service.gov.uk` 1（sandbox 回跳）· accounts.google.com 1。bing 这周 0。
- 首页 `/` 7d 21 UV，其次 /mtd-deadline-checker 3 UV。
- 转化：visitor_to_register 7d 0%，30d 2.6%。

## 漏斗埋点

- 埋点起始 2026-09-03，36.7 天数据，窗口不再截断。
- `never_fired` 仍有 11 个，和 09-23 一样（PR #24 仍未合）。
- 诊断结论见 BACKLOG stg-002：真 bug 已修在 PR #24；article_cta_click 等是流量太小；
  calendar_cta_click / reactivation_sent / share_* 是未建功能；launch_subscribed 已废弃；
  schedule_sent 缺服务端 track()（stg-002b）。

## Deployment 状态

- Production = staging = `bce76a3`（PR #34，2026-11-14 上线）。
- **staging 现在用独立数据库**（2026-11-14）：Supabase 项目 `EasyTax-Staging`（ref `ufeptuqrlzdoamlzvagw`，eu-west-1）。Vercel「Preview (staging)」的 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 都指向它；production 的变量没动。表结构已对齐 production（只增不删，保留了 5 月的 2 个测试账号）。owner 为腾出免费名额暂停了另一个组织里的项目。注意：production 加新表/列时 staging 要手动同步，否则 staging 会出错。
- 之前 PR #35 的护栏会让 staging **构建失败**（不只是运行时 500），11-14 的两次 staging 部署都因此失败；换完变量后重新部署成功。
- **production 只从 main 构建**。本 agent 的 PR 都对 `staging`，要上线还需 staging→main（stg-008）。
- 另一系统在 main 上挂起的 PR：#21、#22、#23（已 3 周多）。

## 另一套独立的自动化增长系统

见 BACKLOG stg-001 与 memory `easytax-dual-automation-systems`。2026-10-10 无新 PR，仍需 owner 决定分工。

## 在飞的分支

- [PR #36](https://github.com/ysll2002/easytax/pull/36)（2026-11-14，**待 owner 合进 staging**）：移除 Plaid 银行连接（没有 AISP 牌照），改为手动录入 + CSV 对账单导入，新表 `business_records`（staging 库已建，**production 库合并上线前要先跑 migration**）。季度申报、公司 P&L/资产负债表改从记录汇总。7 种语言的营销页、邮件、条款、隐私、trust、无障碍声明里的 Open Banking 说法都已删。本地连 staging 库端到端测过；axe 自动扫描没跑（加载 CDN 脚本被拦）。

- [PR #34](https://github.com/ysll2002/easytax/pull/34)（2026-11-14，**已合进 staging 并上线**，main = staging = `bce76a3`，owner 授权；main 里还有另一个会话合的 PR #33 和 #35）：年终 final declaration 流程，**只在 sandbox**，生产环境 403。修了 submitFinalDeclaration 只 trigger、不 submit 的 bug。待办：owner 给 sandbox app 订阅 BSAS 7.0 / Losses 6.0 / BISS 3.0，然后在 preview 上端到端测。存款利息的修复最终用的是 PR #33 的实现（已在 main）。PR #34 只额外加了：年度调整页接收 year-end 页传来的税年。
- [PR #32](https://github.com/ysll2002/easytax/pull/32) **已合进 main 并上线**（`a2d8b4c`，2026-11-13，owner 授权）：WCAG 修复 + https://easytax.vip/accessibility。两张 HMRC 表和 Paul 回信已同步更新。待办：线上点一遍季度申报的核对步骤；VAT 核对步骤、屏幕阅读器测试、dashboard 非文本对比度要在 2027-03-31 前完成（声明里写了这个日期）。staging 已于同日快进到 `a2d8b4c`，和 main 一致（owner 授权）。

- `agent/2026-09-22-fix-schedule-event-tracking` → [PR #24](https://github.com/ysll2002/easytax/pull/24)（待合 staging，之后还需进 main）
- `agent/2026-09-22-hero-friendly-flat-preview` → [PR #25](https://github.com/ysll2002/easytax/pull/25)（待 owner 看 Vercel preview）

- [PR #26](https://github.com/ysll2002/easytax/pull/26) **已合进 staging**（2026-10-04，owner 授权）；[PR #27](https://github.com/ysll2002/easytax/pull/27) **已合进 main**（`c8e7104`，owner 授权）。staging = main

## 待复盘的 metric

- PR #24 **上线到 production 后**（不是合进 staging 后）7 天：`schedule_requested` /
  `editorial_standards_viewed` 是否离开 `never_fired`，站内最大 CTA 的真实转化率。原定 2026-09-29，
  现在按上线日期顺延。
- HMRC FPH 团队对 9-25 回信的答复（Gmail 恢复后先查）。
- Google organic 7d 从 6 涨到 17：下次看是哪些落地页带来的。
