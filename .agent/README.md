# agent/journal —— EasyTax Daily Agent 的共享记忆分支

这是一个 **orphan 分支**，不含任何应用代码，**永远不要合并进 `main` 或 `staging`**。

它只做一件事：让跑在 Lin 的 Mac 上的本地每日 agent（定时任务 `easytax-daily-agent`）
和云端兜底 routine `trig_01CgBkUpX636ZxSXrBGb54n7` 共享同一份记忆。

| 文件 | 作用 |
|---|---|
| `RUNBOOK.md` | agent 行为的唯一来源 |
| `STATE.md` | 当前状态快照（覆盖写） |
| `BACKLOG.md` | 滚动待办 + owner 否决过的方向 |
| `JOURNAL.md` | 逐日流水（只追加） |

本地那份的正本在 `~/Documents/EasyTax/agent/`，这里是镜像。
