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
