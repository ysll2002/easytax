# EasyTax — Claude Code Instructions

## Deployment Rules

**环境说明：**
- `easytax.vip` — 生产环境，有真实用户。**只从 GitHub `main` 分支部署，没有例外。**
- `staging.easytax.vip` — 预览/测试环境，跟随 GitHub `staging` 分支（每次 push 自动部署）
- 本地代码克隆在 `/tmp/easytax`

**唯一的上线路径：`分支 → PR → main → production`**

`main` 是生产环境的唯一真相来源。任何代码要上线，必须先通过 PR 合并进 `main`，再从 `main` 部署。

**标准流程：**
1. 从最新的 `main` 切出工作分支：
   ```
   git fetch origin && git checkout -b <分支名> origin/main
   ```
2. 改代码，本地验证（**构建必须通过**）：
   ```
   npx tsc --noEmit && npm run build
   ```
3. commit 并 push 到你自己的分支（**不要直接 push 到 main 或 staging**）：
   ```
   git push -u origin <分支名>
   ```
4. （可选）需要在 staging 域名上人工验收时，用 GitHub Actions 的 Deploy workflow，
   `target=preview`、`ref=<你的分支>`，它会部署预览并把 staging.easytax.vip 指过去。
5. 开 PR 合并进 `main`。
6. 从 `main` 部署 production —— 在 Actions 里跑 Deploy workflow，`target=production`、`ref=main`。
   workflow 里有硬性校验：**ref 不是 `main` 就直接失败**，不会部署。
7. 让 staging 分支跟上（可选，只是为了让预览环境和线上一致）：
   ```
   git push origin main:staging
   ```

**代码提交规范：**
- 使用语义化前缀：`feat:` / `fix:` / `revert:` / `docs:`
- commit message 结尾带 `Co-Authored-By:` 署名（用实际执行的模型，不要写死某个版本号）

**严格禁止：**
- **不得绕过 PR 直接 push 到 `main`**
- **不得从 `main` 以外的任何分支部署 production**（包括 `staging`、`claude/*`、`agent/*`）
- 不得跳过 `--scope lilingabriel-5465s-projects` 参数，否则部署到错误项目
- 不得在明知有失败的构建或未通过的测试时上线

**为什么是这套规则（2026-09-05 的教训）：**
当时 production 上跑的是一个**没有合并的 `claude/*` 分支**，比 `main` 和 `staging` 都多 2 个 commit。
那一刻只要有人把 `staging` 发到 prod，就会静默删掉一个线上页面。
根因是「部署的是任意 ref」而不是「部署 main」——旧流程里 `vercel deploy --prod` 发的是本地工作目录，
GitHub Actions 发的是传进去的 ref，两者都可以是任何分支，于是 git 历史和线上长期对不上。
现在方向是单向的：所有东西都经 `main` 进入生产，并且这条规则由 workflow 强制执行，
而不是只写在文档里——只写在文档里的规则，自动化跑起来是会给自己找理由绕过去的。

**重要背景：**
- 如果 `/tmp/easytax` 目录丢失（例如重启），需重新克隆：`git clone https://github.com/ysll2002/easytax /tmp/easytax && cd /tmp/easytax && git checkout staging`
- HMRC sandbox 的 staging redirect URI 暂未生效，staging 目前使用 `https://easytax.vip/api/auth/callback/hmrc` 作为 HMRC_REDIRECT_URI 的临时绕过方案

## 增长背景与数据源（每轮开始前必读）

每天的定时任务都是一个**全新会话，没有任何对话记忆**。这一节写的是查不出来、
只能靠记录传递的事实。不读这一节，就会重复已经做过的判断。

### 每轮开始前必做的三件事

1. 读**最近一篇** `GROWTH_*.md`（不是最早那篇）
2. 查 **open PR**：`gh pr list` 或 GitHub MCP。截至 2026-09-22，最近 7 轮里有
   4 轮开头都在收拾上一轮没合并的 PR —— 先看有没有搁置的，再开新工作
3. 读本节下面的「数据源」和「渠道历史」

### 数据源：有什么、没什么

| 数据源 | 能用吗 | 覆盖范围 |
|---|---|---|
| Supabase（`analytics_events`、`profiles`、`growth_snapshots` 等） | ✅ 可直连，环境变量里有 `SUPABASE_SERVICE_ROLE_KEY` | 埋点 **2026-09-03 起**，之前没有 |
| `profiles` / `hmrc_connections` 表 | ✅ | 追到 2026-04 |
| `https://easytax.vip/api/admin/daily-metrics` | ❌ **被 egress proxy 拦截**，已连续 7 轮拉不到 | — |
| Google Analytics（`G-ZF21G9RTJW`） | ⚠️ 站上装了，但 agent 读不到（Windsor.ai connector 在会话里未启用） | 约 2026-06 起 |
| Google Search Console | ❌ **未接入** | — |
| staging.easytax.vip | ⚠️ 开着 Vercel SSO，sandbox 过不去；验收要用本地生产构建 | — |

**不要再花时间重新发现这些。** 拉不到 `daily-metrics` 就直接读 Supabase，
`growth_snapshots` 里存着每天 cron 写的完整 payload。

### 测试账号必须排除

`profiles` 里有 7 个是 owner 自己的测试账号。任何关于注册数、转化率的结论，
**必须先剔除**，否则会高估 17%（注册）和 50%（HMRC 连接）。

判定规则：email 含 `lilin.gabriel` / `ysll2002` / `test`，或 name 含
`test` / `lin li` / `xueyan`。

截至 2026-09-22 的**真实**数字：注册 **41**（不是 48），HMRC 连接 **12**（不是 18），
转化率 **29%**（不是 37.5%），申报 **0**，MRR **£0**。

### 渠道历史：唯一有效过的是 Reddit

- **2026-06**：owner 在 Reddit 发帖带 easytax 链接 → 约 3 个帖子带来
  **29 个真实注册**，占这个产品历史上全部真实用户的 **71%**。每帖约 10 个。
- **2026-07 初**：Reddit 开始删帖/限制，渠道关闭。注册从 6 月的 26 掉到
  7 月 10、8 月 3、9 月 **1**。
- **SEO（114 篇文章 + 14 轮迭代）**：至今带来过 **1 个**真实注册
  （2026-09-15，从 Google 进来，当天连了 HMRC）。搜索来源约 6 人/周，无增长。
- **2026-08-25 首页从免费改成 £24/filing**：**不是**下滑原因。下滑在改价前
  就已经走完（断点是 6→7 月的 Reddit，不是 8 月底的改价）。

完整分析见 `GROWTH_2026-09-22.md`。

**约束是分发，不是产品。** 41 个真人看到产品，12 个连了 HMRC（29%），
在一个还不能报税的 app 上。不要把「转化不行」当作问题来解。

### 不得自动化的事

- **不得自动向 Reddit 或任何社区平台发帖/发链接。** 这正是导致封禁的行为，
  违反平台规则，且用机器人冒充真人做营销本身就不对。重建社区存在感是
  owner 本人的事，agent 只能准备素材。
- **不得发送对外邮件给真实用户**（例如 reactivation campaign）。对外、不可撤回，
  需要 owner 明确同意。

## Mobile-First Design Rules

**所有页面和组件的设计与开发，必须遵循 mobile-friendly 原则：**

- 默认从移动端布局开始设计，再扩展到桌面端（mobile-first）
- 使用 Tailwind 响应式前缀：`sm:` (640px)、`md:` (768px)、`lg:` (1024px)
- 禁止使用固定宽度（如 `width: '480px'`）用于主要布局容器，改用响应式方案
- 多列 grid/flex 布局必须在移动端折叠为单列，例如：`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- padding/margin 使用响应式值，例如：`p-4 sm:p-8`，不得直接写 `p-8`
- Dashboard 页面：移动端隐藏侧边栏，使用底部导航栏（`MobileNav` 组件）
- 公开页面（首页、Timetable 等）：移动端使用汉堡菜单（`SiteHeader` 已实现）
- 表单双栏布局必须在移动端变为单列：`flex flex-col lg:flex-row`
- 字体大小使用 `clamp()` 或响应式 Tailwind class，确保移动端可读
- 按钮点击区域最小 44×44px，移动端友好
- 禁止 `overflow: hidden` 在移动端截断重要内容
