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
