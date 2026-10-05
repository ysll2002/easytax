# EasyTax Agent — 日志

> **最新在最上面。只追加，不改写历史。**
> 每日条目模板：
>
> ```
> ## YYYY-MM-DD
> **HMRC**：…
> **指标**：注册 X(+d) · HMRC 连接 X(+d, 转化 Y%) · 申报 X(+d)
> **今日执行**：…（分支 / PR，或说明为什么没实现）
> **Top 5**：1. … 2. … 3. … 4. … 5. …
> **学到 / 决定**：…（跨天有效的结论也要同步进 memory 目录）
> **失败**：…
> ```

---

## 2026-10-05（owner 实时对话）

**今日执行**：owner 想新增面向会计师事务所的功能，并让我找英国事务所的邮箱，打算发邮件说「我们可以给你们定制 MTD 报税流程」。
用 WebSearch 找候选，再用 WebFetch 逐家在官网核实，整理出 14 家（Manchester / Bristol / Leeds / London / Lancaster 等），
存在 `/Users/linli/Documents/EasyTax/outreach/uk-accountancy-firms-2026-10-05.csv`，每行都有来源 URL 和核实日期。
只收通用邮箱（info@ / help@ / enquiries@），搜索结果里出现的个人邮箱一律没收。未能核实的（Elite Financial、DWilkinson
返回 403；Gondal 的邮箱被混淆；76 Chartered、Jack Ross 页面没有邮箱）都没放进清单。
**提醒 owner 的风险**：① 文案准确性：现在不能向 HMRC 正式提交，也没有 agent 授权，不能承诺「代提交」；和 HMRC ToU 的
「accurate representation」是同一个问题。② PECR：发给 Ltd/LLP 的 B2B 冷邮件可以不事先取得同意，但要表明身份并提供退订方式；
Kirk Newsholme 的法律形式没写，发之前要查 Companies House。③ 这些事务所大多已经是 Xero/QuickBooks 合作伙伴，需要明确的差异点。
**学到 / 决定**：外联只起草不发送（护栏不变）。

---

## 2026-10-04（owner 实时对话，非定时运行）

**HMRC**：owner 转来 HMRC Louise Tarpy（Head of External Software Integration）的正式说明：2026-08-10 起暂停新的 MTD ITSA
production 申请；2026–27 只继续审 8-10 之前提交的申请（以及季度已获批产品的年终功能申请）；不达标的会被拒；2027–28 的流程
预计 2027 年初公布。我们 7-08 提交 checklist，**在范围内**，stg-007 结案。另外查到 owner 已在 9-25 16:01 UTC 发出 FPH 回信，
HMRC 9-29 回复「已转 fraud headers team」。
**发现**：被拒的代价可能是「等到 2027–28」（推断，owner 追问原文后已更正：信里只说不达标会 refused、2026–27 不收新申请、2027–28 信息 2027 年初公布，没说被拒后能否在原申请内重提），所以 readiness 标准成了关键。核对后发现营销页（alternative 页、mtd-software、
self-assessment-software）公开声称能提交 CT600、final declaration、Self Assessment，以及能处理 landlord 收入，但代码里都没有
（没有 CT600 提交代码，没有 final declaration 端点，没有 property API）。这和给 HMRC 的「仅年内、仅 self-employment」声明，
以及 dashboard 页脚的说明直接矛盾，有违反 ToU「accurate representation」的风险。新建 stg-010，排 #1。
**补充（同日，sandbox 测试 + production 申请表核对）**：
- owner 的 sandbox test 62/65 通过。VAT Submit 是 `DUPLICATE_SUBMISSION`（正常）。SA Assist 两个是 `INVALID_SCOPE`：根据 HMRC
  官方 OAS，Produce 要 `read:self-assessment-assist`，Acknowledge 要 `write:self-assessment-assist`，而
  `app/dashboard/individual/hmrc/page.tsx` 的 scope 列表只有 read（确定的 bug）。这次 read 也失败，怀疑是重新授权后 sandbox 应用
  没有订阅 SA Assist，待 owner 去 Developer Hub 查。改 scope 要等 owner 说「改 scope」。
- 两个 production 申请里，`EasyTax VIP` 是主申请（7-08 邮件里请 HMRC 关掉 `EasyTax.VIP`，但它还在列表里），订阅了 14 个 API，含 VAT、SA Assist、BSAS。
- 申请表里有几处回答和仓库现状可能对不上：「servers in the UK」（vercel.json 没设 region，Vercel 默认是 US iad1，要去 Vercel 控制台确认）；
  「do not advertise my software」（实际有大量营销页）；pen test「Yes」（需要有报告可以拿出来）。网站文案上：privacy/trust 页说
  「HMRC access tokens are stored encrypted」，但代码直接写进 Supabase 列，只有平台的静态加密；onboarding 页说「never stored permanently」，
  和数字记录保存的要求矛盾。都归入 stg-010。
- owner 说「先把 sandbox api test 的问题修复好」，已实现：[PR #26](https://github.com/ysll2002/easytax/pull/26)
  （分支 `agent/2026-10-04-fix-sandbox-api-test`，对 staging，**从 main 切出**，因为 staging 落后 main 33 个提交，而 production 从 main 构建）。
  改动：scope 加上 write:self-assessment-assist；sandbox-test 页面只改显示（跳过的调用显示成灰色、去掉「GET GET」、错误代码直接显示）。
  没碰 app/api/hmrc/**、lib/hmrc*、fraud headers、auth。tsc 通过。
- owner 让我合并 PR。我指出这和「绝不 merge PR / 绝不部署」护栏冲突，并问要不要破例；owner 选了「只合到 staging」。
  已合并 PR #26 进 staging（2026-10-04 19:20 UTC），并开了 [PR #27](https://github.com/ysll2002/easytax/pull/27)（staging→main，
  只含 #26 的改动），由 owner 来合，合进 main 才会上线 production。确认 sandbox 应用 EasyTax 订阅了 SA Assist 1.0，所以 Produce 报
  INVALID_SCOPE 的原因还没定，等上线并重新授权后再验证。
- 随后 owner 明确要求「合并 PR 并上线」。已合并 [PR #27](https://github.com/ysll2002/easytax/pull/27) 进 main（2026-10-04 19:24 UTC，
  merge commit `c8e7104`，只含 #26 的 2 个文件）。没有跑 `vercel deploy`，production 由 Vercel 从 main 自动构建。
- 上线后 owner 重新授权 HMRC（新 token）并重跑：**64/65**。SA Assist 两个都通过（200 / 204），stg-011 已验证。剩下的
  VAT Submit `DUPLICATE_SUBMISSION` 是预期错误，新的页面直接显示了错误代码。这说明 Produce 之前报 INVALID_SCOPE 是旧 token 的问题，
  重新授权就解决了。后续：新建 VAT 测试机构用户（stg-012），以及按 HMRC 要求换设备、换用户各跑一次。
**学到 / 决定**：护栏的边界：owner 明确要求时，可以合进 staging（这次 owner 授权的）；合进 main 等于部署 production，owner 第二次明确要求后才做。两次都是针对单个 PR 的一次性授权，
不能当作以后可以自己合 PR 或部署的许可，下次仍要先问。HMRC 新标准里有 AI 条款，要求 AI 生成的内容必须经过人工审核，未经核实的通用内容会被拒。营销页和给 HMRC
的邮件都应该按这个标准自查。memory `easytax-hmrc-itsa-cutoff` 已覆盖更新。

---

## 2026-09-25（owner 实时对话，非定时运行）

**HMRC**：owner 贴来 2026-09-24 12:25 UTC 的 FPH 回信（CMQAA-923 / 2026-NQM717，Aleesah Sher）。审的是 9-23 12:16 UTC
那批 sandbox 流量。`Gov-Client-Multi-Factor`：HMRC 接受省略。`Gov-Vendor-License-IDs`：「Header required」——但 8 月 VAT 工单
CMQAA-712 把我们发的 userId 哈希判为 dummy 值，所以才删掉，两次反馈互相矛盾。HMRC 规范（web-app-via-server）对该头的描述是
「hashed license keys」，没有许可证时属于「missing data」，要按缺失数据指引处理。代码现状（main `lib/hmrc.ts` fraudHeaders）两个头都省略，只读未改。
**今日执行**：owner 在 A（先回信解释）/ B（实现真实的每用户许可证 ID）/ A+B 中选了 **A**。已在 HMRC 线程里用 `create_draft`
存了英文回信草稿（未发送），抄送 makingtaxdigital-softwarevendors：确认继续省略 MFA；按 missing-header-data 指引正式通知没有许可证密钥、
引用 CMQAA-712 的 dummy 值结论、请求像 MFA 一样记录，或告诉我们应该发什么值；承诺用不同设备和用户重测；问截止令是否影响我们 7 月提交的申请。
没有改代码。
**学到 / 决定**：9-15 截止之后 HMRC 仍在审我们的申请，stg-007 的风险降低但还没有正式答复。License-IDs 的
处理方式要等 HMRC 回复；如果对方坚持要，方案 B 需要 owner 另外批准（合规禁区 + DB schema）。
**更正（同日）**：owner 指出网站已经不是免费的了（/pricing：£20+VAT 每次申报，无订阅）。第一版草稿写了「EasyTax is free」，
已改成「按次收费，不以许可证形式销售，不发许可证密钥或订阅；按次付款的支付凭证标识的是交易，不是软件许可证」。
用 update_draft 修改时草稿脱离了原 HMRC 线程，所以在线程里重新建了一份（id r9140492644388941147）；
脱离线程的旧草稿（r-6678069759678272716）要 owner 手动删掉，agent 不删除。另外注意：`lib/hmrc.ts` 注释和
2026-08-22 给 HMRC 的邮件里都写了「free to all users」，已经过时。`app/payment/page.tsx` 仍是模拟支付（没接 Stripe）。
**补充（同日）**：owner 跑 sandbox test 时 5 个 VAT 调用显示红 ✕、状态码「—」。诊断：这个 HMRC 连接上没有存 VRN，
所以被 PR #17 的逻辑跳过了（不是失败）。owner 在 Profile 填了 VRN 后已经跑通。页面把「跳过」画成失败、路径显示
「GET GET」是显示 bug，已向 owner 提议只改 `app/dashboard/individual/sandbox-test/page.tsx`，owner 尚未批准。
**待 owner**：①审阅并发送草稿 ②亲自用 ≥2 台设备、≥2 个用户在浏览器里重跑一轮 sandbox 覆盖测试，并用 Test API
validation-feedback 验证。

---

## 2026-09-23

**HMRC**：⚠️ **重大外部变化**。HMRC 开发者指南 *Income Tax MTD end-to-end service guide*（页面标注
「Updated 15 September 2026」）Overview 顶部新增横幅：HMRC「no longer accepting production credential
access requests for new 2026–27 quarterly update products」，理由是 market window 已关闭。页面**没有说**
已在审中的申请如何处理、也没有说 2027–28 何时重开。线索来源：owner 今天 12:12 UTC 发给自己的一封
「tax mtd chatgpt分析」邮件提到这点，本 agent 用 WebFetch 直接读 HMRC 原页面核实过。EasyTax 的 ITSA
production 审批仍 PENDING（FPH review，Aleesah Sher / Ciaran McLaughlin），**必须由 owner 向 HMRC 书面确认
我们的在审申请是否受影响**。VAT 路径（app 也调用 `/organisations/vat/`）不在该横幅范围内。
24h 内无 HMRC 官方来信。其他命中：另一系统「4 天没发文章，1 篇草稿待审」告警（09:04 UTC）、
Coconut 营销邮件、Vercel `agent/journal` 预览部署失败（预期内）。
**指标**（18:34 UTC）：注册 48(+0) · HMRC 连接 18(+0, 转化 37.5%) · 申报 0(+0) · MRR £0。
**7d 注册 0、7d HMRC 连接 0**（上次 7d 各为 1）——现在已经连续 ≥7 天零新增注册。
7d human visitors 32（上次 30），human_share 72.9%。GA4 7d：Direct 19 用户 / Organic 13（**Bing 7 > Google 6**）/
Referral 2（`test-www.tax.service.gov.uk` 7 sessions，是 HMRC sandbox 回跳，不是真实流量）/ chatgpt.com 1。
Production 构建已 7 天（commit 7bf7bde），main 无新合并；PR #21/#22/#23（另一系统）+ #24/#25（本 agent）全部未合。
**今日执行**：**没有实现**。Top 1（stg-007，确认 HMRC 截止令对在审申请的影响）Category=compliance、
Action=BLOCKED（只有 owner 能联系 HMRC），不满足自主实现门槛；按护栏不顺延到 Top 2（stg-002b 本来符合条件）。
**Top 5**：1. stg-007 向 HMRC 书面确认在审 ITSA 申请是否受 2026-09-15 截止令影响 2. stg-008 把 PR #24 送上
production（它目前只对 staging，而 production 只从 main 构建——合进 staging 并不会让埋点在线上生效）
3. stg-002b 补 schedule_sent 埋点 4. stg-009 会计师渠道探索（PROPOSE-ONLY，取决于 stg-007 结果）
5. stg-001 两套自动化系统分工（仍 BLOCKED）
**学到 / 决定**：
- HMRC 已对新的 2026–27 ITSA 季度更新产品关闭 production 凭证申请（2026-09-15 起）。这是跨天有效的外部约束，
  已写入 memory（easytax-hmrc-itsa-cutoff）。在 owner 拿到 HMRC 答复前，任何「等审批通过就开收费」的收入假设都要打问号。
- 发现部署链路上的一个坑：本 agent 的 PR 都对 `staging`，但 production 只从 `main` 构建（`deployment.built_from_main`）。
  所以 PR #24 合进 staging 后，线上 `never_fired` 不会变化，直到 staging→main 再合一次。复盘日期要按此顺延。
- Bing organic 已经和 Google 持平甚至略多（7 vs 6 用户）——IndexNow（另一系统在推）可能在起作用，只记录不动手。
**失败**：无（git、指标接口、Gmail、GA4、WebFetch 均正常）。

---

## 2026-09-22

**HMRC**：PENDING，过去 4 天（newer_than:4d）无相关邮件。找到另一系统自己的「11 天没发文章」
告警邮件（2026-09-19 09:04 UTC, hello@easytax.vip）和 3 封 Vercel `agent/journal` 分支预览部署
失败邮件（2026-09-18，预期内——orphan 分支没有应用代码，Vercel 仍会尝试构建）。
**指标**：注册 48(+0) · HMRC 连接 18(+0, 转化 37.5%) · 申报 0(+0) —— 相比 2026-09-18 14:43 快照，
**total 完全没有变化**，4 天零新增注册。7d human visitors 30（上次 ≈35，口径有过调整不做强趋势判断）。
Production 部署与 main HEAD 一致（commit 7bf7bde）但已 5 天没有新合并；另一系统在 main 上还有
3 个 PR（#21/#22/#23）挂起 4–6 天未合，仅记录不处理。
**今日执行**：**实现了 1 项**（stg-002 诊断出的真 bug）。分支
`agent/2026-09-22-fix-schedule-event-tracking`，[PR #24](https://github.com/ysll2002/easytax/pull/24)
（对 `staging`，待 owner 合并）。改了 2 个文件：`components/DeadlineScheduleForm.tsx`
（`trackClient('schedule_started', …)` → `trackClient('schedule_requested', …)`，和
`lib/analytics.ts`/`daily-metrics` 用的规范事件名对齐）、`app/api/track/route.ts`（把
`schedule_requested` 和 `editorial_standards_viewed` 加进 `ALLOWED` allowlist——这两个事件此前
无论叫什么名字都会被服务端静默丢弃，204 无报错）。验收方式：PR 合并部署后观察
`funnel.reality_check.never_fired` 里这两个事件是否消失。`npx tsc --noEmit` 通过，无 `lint` 脚本。
满足 Risk=LOW + Confidence=HIGH + 非 compliance + IMPLEMENT-NOW 门槛：只改了一个字符串常量的
拼写和一个 Set 的成员，不碰 HMRC/auth/middleware 相关文件。
**Top 5**：1. stg-002 CTA/checker 埋点诊断（今日已实现修复其中 2 项，见上）2. stg-001 查清两套
自动化系统分工（仍 BLOCKED，需 owner 决定）3. stg-002b 补 schedule_sent 的服务端埋点（今天用掉了
当日 1 项实现额度，留到之后）4. stg-005 alternative 对比页流量（/freeagent-alternative 首次出现
1 UV，其余 8 个仍 0，继续只监控）5. stg-004 内容深度（另一系统职责，只监控）
**学到 / 决定**：
- `article_cta_click` / `checker_started` / `checker_completed` / `tool_cta_click` 的埋点代码本身
  没问题（名字对得上、allowlist 里也有），`never_fired` 纯粹是因为到达这些页面/组件的真实流量
  太小——不要把这几个当作"埋点坏了"的候选再去改代码。
- `calendar_cta_click` / `reactivation_sent` / `share_click` / `share_copy` 在代码库里完全没有
  调用点，是未建的功能而不是 bug，不要误判成可以"修"的埋点问题。
- `launch_subscribed` 所属的旧 launch waitlist 功能已经被 `DeadlineScheduleForm` 取代
  （见该文件顶部注释：9 个访客一周内没人填过旧表单）。
- 两套自动化系统的分工问题（stg-001）本次运行没有新证据出现，owner 仍未给出书面决定，继续
  按现有护栏刻意避开 SEO/editorial/RSS 领域。
**失败**：无（Gmail 搜索、指标接口、git fetch/pull/push、gh pr create、tsc 均正常）。

**补充（同日，owner 实时对话）**：owner 反馈 easytax.vip 首页视觉太像 AI 生成的网站。诊断后认为
问题不在配色本身（暖白+赤陶+鼠尾草+serif 其实已有辨识度），而在版式套路——处处 rounded-full 药丸、
rounded-2xl 卡片、统一三栏网格，是 Tailwind/v0/Cursor 这类工具的默认"形状语言"。用 Design canvas
artifact 出了 3 个方向的首页 hero 设计稿（A 大色块斜切、B 车票邮戳感、C 粗描边扁平 friendly-flat），
owner 选中 C（蓝色系）。随后 owner 明确要求把 C 应用到真实代码并推到 staging 预览。

**第二项实现（今日第 2 项，超出日常"每天最多 1 项"护栏 —— 例外原因：owner 在对话中实时明确要求，
不是本 agent 自主选择的 backlog 条目，因此判断不适用该护栏，但记录在案以备复盘）**：
分支 `agent/2026-09-22-hero-friendly-flat-preview`，
[PR #25](https://github.com/ysll2002/easytax/pull/25)（对 `staging`，待 owner 审核）。
只改了首页 hero + 顶部公告条（`app/page.tsx`）和新增一个 additive 的 Space Grotesk 字体变量
（`app/layout.tsx`，不影响其他任何页面）：粗描边（2.5–3px ink）替代圆角药丸和模糊投影，新增
cobalt `#1D4ED8` + yellow `#FFD23F` 两个强调色（逐一做了 WCAG AA 对比度检查，深色公告条上
cobalt 对比度不够改用浅色调 `#8FB0FF`），删掉了首页最明显的"AI 味"装饰元素——hero 背后那个
径向渐变光斑。**刻意没有动** `SiteHeader`（全站共用）和首页 hero 以下的所有板块，保持这是一次
可回退的定向预览，不是全站重设计。所有文案保持不变（沿用相同的 next-intl key）。
`npx tsc --noEmit` 通过。本次运行处于非交互/定时任务会话，无法本地起 dev server 预览
（unattended session 限制），验收要靠 PR 的 Vercel preview 部署。
**学到 / 决定**：owner 明确要求的改动，即使当天已经用掉「自主实现 1 项」的额度，也应该去做，
不应该以护栏为由拒绝执行owner的直接指令——护栏管的是本 agent 自主判断要不要动手，不是 owner
本人明确要求时的执行边界。以后遇到owner在对话里直接要求实现的情况，按此判断，仅在记录里注明
"超出当日常规额度、因 owner 明确要求而做"即可，不需要因为已经实现过 1 项就拒绝。

---

## 2026-09-18（首次真实运行）

**HMRC**：PENDING，24h 内无相关邮件。
**指标**：注册 48(+0) · HMRC 连接 18(+0, 转化 37.5%) · 申报 0(+0) —— 距今早搭建时的快照仅
隔 5.5 小时，delta 全为 0 属正常。7d 真实人类访客约 35（新采用的北极星指标，见 STATE）。
**今日执行**：没有开分支实现代码。Top 1（stg-001，两套自动化系统分工）是治理问题，
Action=BLOCKED，不满足「Risk=LOW+Confidence=HIGH+非compliance+IMPLEMENT-NOW」的自主实现
门槛；按护栏「Top1 不满足就不顺延到 Top2」，今天只出报告不写代码。stg-003（流量北极星
口径切换）不算代码实现，是本 agent 自己记忆/报告方式的调整，已直接生效。
**Top 5**：1. stg-001 查清两套自动化系统分工 2. stg-002 诊断 CTA/checker 埋点为何 never_fired
3. stg-003 human visitors 作为流量北极星（已生效）4. stg-004 内容深度补课（另一系统职责，只监控）
5. stg-005 alternative 对比页 0 流量，考虑站外获客
**学到 / 决定**：
- 发现 repo 里有另一套不受本 RUNBOOK 治理的自动化增长系统，直接 push `main`、开 PR #17–#23、
  今天还真发过邮件（`send_message` 而非 draft）。这是本次运行最大的发现，已写入
  `BACKLOG.md` stg-001 的详细说明，**需要 owner 明确分工**，否则本 agent 会持续刻意避开
  SEO/editorial/RSS 相关方向以防冲突。
- 9 个 alternative 对比页 0 流量已确认不是内链缺失（footer 已全站互链），是整体流量太小的
  症状，不是可以站内修复的 bug —— 排除了一个原本可能被误判为"实现机会"的方向。
**失败**：无（Gmail 搜索、指标接口、git fetch/pull 均正常）。

---

## 2026-09-18

**搭建日 —— 非常规条目。**

Claude 在 `~/Documents/EasyTax` 建立了本地每日 agent，替代原先每天新建对话的云端 routine：

- 记忆现在存在磁盘上（`agent/` 四个文件 + `~/.claude/projects/.../memory/`），
  每日运行和 owner 在 Claude 里的对话**共享同一份**。
- 云端 routine `trig_01CgBkUpX636ZxSXrBGb54n7` 已暂停，保留做兜底。
- 自主权限：可以实现 + 推 `agent/` 分支 + 开 PR，**不部署、不合并、不发邮件（只存草稿）**。
- 初始状态快照见 `STATE.md`（注册 48 / HMRC 连接 18 / 申报 0 / MRR £0）。

**明天的第一次真实运行需要做的**：读完四个记忆文件 → 拉 repo → 查 HMRC 邮件 →
拉指标 → 排 Top 5 并写进 `BACKLOG.md` → 最多实现 1 项 → 写回记忆 → 存日报草稿。
