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

- **staging = `d2871ad`**（比 production 多 PR #50–#58，还没进 main；**上线前 production 库要先建 agent_api_log 表**）。
- **owner 对话里的改动直接合进 staging，不用问**（2026-11-15 owner 授权；main/production 仍要明说；定时 agent 不适用）。
- **Production = main = `ea28c1f`**（2026-11-15 14:09 UTC 上线，owner 授权；含 PR #45–#49；production 库已先加 ai_categorised 列；冒烟检查通过）。f25b383 于 2026-11-15 09:31 UTC 上线，owner 授权；比 1a2afdd 多了 PR #44：藏起 Company Tax。
- 原 production 记录：**Production = main = staging = `1a2afdd`**（2026-11-14 22:23 UTC 上线，owner 授权「把 staging 的改动都发布到 production」）。包含：PR #36（去掉银行连接，改手动录入 + CSV）、#37（代理模式，production 里被 HMRC_ENV 挡住）、#38（CSV 修复）、#40（dashboard 清理）、#43（导航去掉 Records），以及另一会话直接合进 main 的 #39（去掉 dashboard footer 的范围说明）和 #41（语言/Homepage 移到侧边栏；#42 的做法在合并冲突时被它取代）。
- **production 库已建** `business_records`、`agent_connections`、`agent_clients`，`sa_filings.client_id`（两个 migration 20261114 / 20261115，2026-11-14 owner 授权）。
- **production 只从 main 构建**。本 agent 的 PR 都对 `staging`，要上线还需 staging→main（stg-008）。
- 另一系统 / 其他会话会直接往 main 合 PR：合并前先 `git log origin/staging..origin/main`。

## 另一套独立的自动化增长系统

见 BACKLOG stg-001 与 memory `easytax-dual-automation-systems`。2026-10-10 无新 PR，仍需 owner 决定分工。

## 在飞的分支

- **HMRC Agent Authorisation 2.0 production 申请（2026-11-16 回信，Patrick Gordon）**：要 sandbox application ID + 6 个端点的测试时间戳（Create / Get all 30 天 / Get by id / Cancel / Relationship status / De-authorise）。2026-11-16 13:55–13:57 UTC owner 在 staging 点完，6 个端点全部 2xx（agent_api_log 有记录；HMRC sandbox 不返回 X-Correlation-Id）。已在 Gmail 起草回信（草稿，回复 Support Ref 2026-CRJ844 线程，sandbox app ID 30fb333c-45de-4ce3-9ffa-c3c0beb809e8），**等 owner 自己发**。之后 owner 重新邀请 Alex/Iona（都 pending）；Alex 新邀请 AB7WWMDX6XC8L 已由我用 Test Support 接受（204）。
- [PR #58](https://github.com/ysll2002/easytax/pull/58)（2026-11-16，**已合进 staging** `d2871ad`）：sandbox 专用「Simulate client accepting / declining」按钮（调 Test Support API，再从 HMRC 读回状态；production 不显示、服务端拒绝）。以后 sandbox 测试不用再找我手动接受。
- [PR #57](https://github.com/ysll2002/easytax/pull/57)（2026-11-16，**已合进 staging** `1fe64fb`）：新增 GET /agents/{arn}/invitations（Check authorisations 先调它）；新表 agent_api_log 记录每次代理 API 调用（端点名、状态、correlation id、时间），staging 库已建。用来给 HMRC 出时间戳。
- [PR #56](https://github.com/ysll2002/easytax/pull/56)（2026-11-15，**已合进 staging** `db03e3c`）：代理客户页去掉整个 records 区块（列表、添加、导入、AI 助手），客户记录改为只在季度申报页上传；客户表已授权的 Next step 改为 File updates。个人用户自己的 Records 页（/dashboard/reconcile）不变。
- [PR #55](https://github.com/ysll2002/easytax/pull/55)（2026-11-15，**已合进 staging** `15adce9`）：View submission 改绿色，大小同 Prepare update（取代 #53 的蓝色）。
- [PR #54](https://github.com/ysll2002/easytax/pull/54)（2026-11-15，**已合进 staging** `5d615d6`）：全站数字输入框滚轮不再改数字（根 layout 挂 NoWheelNumberInputs）。
- [PR #53](https://github.com/ysll2002/easytax/pull/53)（2026-11-15，**已合进 staging** `9b87ecd`）：Done 里 View submission 改成蓝色按钮，展开后显示 Hide submission。
- [PR #52](https://github.com/ysll2002/easytax/pull/52)（2026-11-15，**已合进 staging** `8cf4cc7`；还没进 main）：季度申报页可直接上传 CSV（存进 records、本季度新行 AI 分类、自动预填），打开页面自动填数；**每个数字可改，改动在 Review 时存成调整记录（日期=季度末）再重新汇总**（owner 选的方案，保 MTD In-Year #6）。submit-quarter 新增服务端校验：提交数字 ≠ 该期 records 汇总 → 409（个人和代理都适用，动了 app/api/hmrc）。
- [PR #51](https://github.com/ysll2002/easytax/pull/51)（2026-11-15，**已合进 staging** `cb22084`；还没进 main）：客户页 Done 里每条 EasyTax 提交可展开 View submission（turnover、8 类费用、合计、净利润、提交时间、HMRC periodId）；代理提交的总额先四舍五入到分。
- 代理 sandbox 已调用：POST/GET invitations、POST relationships、ITSA business details/obligations/提交季度（Alex 2018-19 Q2 成功）。**未调用**：DELETE invitations（取消）、PUT deauthorise-client、所有 VAT 服务路径、VAT obligations/提交（没有 VAT 客户）。HMRC 审批前要补。
- [PR #50](https://github.com/ysll2002/easytax/pull/50)（2026-11-15，**已合进 staging** `83140cb`，owner 授权；还没进 main）：代理客户页 What's due 拆成 To do / Done；EasyTax 提交过的季度即使 sandbox 仍报 open 也算 Done（防重复提交）；取代原 Submitted for this client 区块。
- [PR #49](https://github.com/ysll2002/easytax/pull/49)（2026-11-15，**已上线** `ea28c1f`，owner 授权；还没进 main）：Obligations API 3.0 返回小写 status（open/fulfilled），代码比较 'Open'/'Fulfilled' → 代理客户页 What's due 永远「Nothing open」，个人 tasks 已提交季度也不显示完成（**production 可能也受影响**）。在 lib/hmrc.ts getObligations 统一转大写开头。
- 代理模式进度：Alex Lawrence ITSA 已 Authorised（2026-11-15，用 Test Support API 接受）；CSV 514 条导入，AI 分了 283 条、229 条留 Unreviewed（比例偏高，可调）。sandbox 返回的季度是 2018-19 Q2（2018-07-06 – 2018-10-05）；已在 staging 库给 Alex 插 6 条该季度测试记录（描述带 "(sandbox test)"，收入 £4,425.50、费用 £316.34）。下一步：Pull from Records → 提交。
- [PR #48](https://github.com/ysll2002/easytax/pull/48)（2026-11-15，**已上线** `bf14009`，owner 授权；还没进 main）：CSV 导入后 AI 自动分类（owner 要求「不需要人工手动分类」）。不确定的留 Unreviewed，AI 分的带「✦ AI」标记、用户一改就清除（隐私政策写了 AI 分类会呈现给用户审核）。新列 `business_records.ai_categorised`：**staging 库已加，production 库上线前必须先加**（records API 会 select 这一列）。staging 已部署，路由未登录返回 401 正常；AI 调用本身等 owner 在 staging 导 CSV 实测。
- [PR #47](https://github.com/ysll2002/easytax/pull/47)（2026-11-15，**已上线** `d6a3a53`，owner 授权；还没进 main）：记录页 CSV 导入的 Choose file 改成按钮样式。
- [PR #46](https://github.com/ysll2002/easytax/pull/46)（2026-11-15，**已上线** `2ac2071`，owner 授权；还没进 main）：dashboard 首页去掉 Quick access / Business records。
- **sandbox 里客户接受授权**：HMRC sandbox 没有客户确认网页（clientActionUrl 404），要用 Agent Authorisation Test Support API：`PUT https://test-api.service.hmrc.gov.uk/agent-authorisation-test-support/invitations/{id}`（开放接口，Accept `application/vnd.hmrc.1.0+json`，Content-Length 0；DELETE 为拒绝）。2026-11-15 已用它接受 Alex Lawrence 的 ITSA 邀请（AYJJ3W41GOLXJ，204）。
- [PR #45](https://github.com/ysll2002/easytax/pull/45)（2026-11-15，**已上线** `c8d922d`，owner 授权；**还没进 main**）：代理客户表加「Next step」列（等待客户 → Send link to client；未请求/被拒/过期 → Request authorisation；已授权 → Records and updates），直接跳到客户页对应区块。
- **代理模式 sandbox 测试进度（2026-11-15）**：sandbox app 原来只订阅了 Agent Authorisation **3.0**，代码用 **2.0** → RESOURCE_FORBIDDEN；owner 加订 2.0 并重新以代理登录后，给 Alex Lawrence（EW777236A）发 ITSA 邀请成功（Waiting for client）。下一步：客户在无痕窗口接受 → Check with HMRC → 提交季度。代理登录也会经过 IV stub（填任意测试 NINO + Success 即可）。**待评估：是否迁到 3.0**（2.0 是否会退役未查）。

- [PR #44](https://github.com/ysll2002/easytax/pull/44)（2026-11-15，**已合进 staging 并上线** `f25b383`，owner 授权）：侧边栏、手机底栏、dashboard 首页卡片里藏起 Company Tax（`lib/features.ts` 的 `SHOW_COMPANY_TAX = false`）。/dashboard/company 页面仍在，直接输网址能打开；改回 true 即恢复。

- [PR #43](https://github.com/ysll2002/easytax/pull/43)（2026-11-14，**已合进 staging** `5743589`，owner 授权）：侧边栏和手机底栏去掉 Bookkeeping → Records；记录页仍可从 dashboard、Self Assessment、Company、季度申报页进入。

- [PR #42](https://github.com/ysll2002/easytax/pull/42)（2026-11-14，**已合进 staging** `a873fd0`，owner 授权）：dashboard 桌面端语言切换和 Homepage 按钮不再浮在页面右上角遮住按钮，改为单独一行。

- [PR #40](https://github.com/ysll2002/easytax/pull/40)（2026-11-14，**已合进 staging** `c486474`，owner 授权）：dashboard 去掉「Finish setting up」清单；「Filing to HMRC is not open yet」横幅订阅后不再显示，production 完全不显示（production 11-11 已开放申报，旧横幅在 production 说反了，**进 main 前 production 仍显示错误横幅**）。

- [PR #38](https://github.com/ysll2002/easytax/pull/38)（2026-11-14，**已合进 staging** `98a3ae8`，owner 授权）：修 CSV 导入几百行就 500（去重查询 URL 过长）、错误提示看不见、Revolut 导出误选 Orig amount。
- [PR #37](https://github.com/ysll2002/easytax/pull/37)（2026-11-14，**已合进 staging** `720bf8d`，owner 授权；sandbox 端到端还没跑，等 owner 在浏览器窗格登录 Vercel）：代理（agent）模式，只在 sandbox。ARN + 代理 Government Gateway 登录（agent_connections）→ 加客户发 HMRC 授权请求（Agent Authorisation API 2.0）→ 客户批准 → 用客户的记录和代理的 token 提交季度更新 / VAT。新 migration `20261115_agent_mode.sql`（staging 库已建，production 还没）。本地测了除 HMRC 代理登录以外的全部；**代理登录、邀请、提交没有在 sandbox 跑过**，卡在 redirect URI。
- （已修，2026-11-14 16:59 UTC 起 HMRC 接受 staging redirect URI，staging 的 HMRC_REDIRECT_URI 已改为 staging 域名；sandbox app 里 production URL 已被 owner 删除）原问题：**staging 的 HMRC sandbox 登录是坏的**：sandbox app 只登记了 `https://easytax.vip/api/auth/callback/hmrc`，staging 的 HMRC_REDIRECT_URI 也指向它，所以在 staging 连 HMRC 会跳到 production 然后失败。需要 owner 在 Developer Hub 的 sandbox app 加 `https://staging.easytax.vip/api/auth/callback/hmrc`（可选再加 localhost），然后改 staging 的 HMRC_REDIRECT_URI。

- [PR #36](https://github.com/ysll2002/easytax/pull/36)（2026-11-14，**已合进 staging** `f8dcd08`，owner 授权；staging 部署成功；**还没进 main**）：移除 Plaid 银行连接（没有 AISP 牌照），改为手动录入 + CSV 对账单导入，新表 `business_records`（staging 库已建，**production 库合并上线前要先跑 migration**）。季度申报、公司 P&L/资产负债表改从记录汇总。7 种语言的营销页、邮件、条款、隐私、trust、无障碍声明里的 Open Banking 说法都已删。本地连 staging 库端到端测过；axe 自动扫描没跑（加载 CDN 脚本被拦）。

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
