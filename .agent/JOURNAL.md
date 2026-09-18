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
