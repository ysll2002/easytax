# EasyTax — Claude Code Instructions

## Deployment Rules

**环境说明：**
- `staging.easytax.vip` — 预览/测试环境，对应 GitHub `staging` 分支
- `easytax.vip` — 生产环境，有真实用户，对应 GitHub `main` 分支
- 本地代码克隆在 `/tmp/easytax`，工作分支为 `staging`

**标准部署流程：**
1. 修改代码后，commit 并 push 到 `staging` 分支：
   ```
   git add -A
   git commit -m "..."
   git push origin staging
   ```
2. 运行预览部署并更新 staging 域名：
   ```
   vercel deploy --scope lilingabriel-5465s-projects --yes
   vercel alias set <预览URL> staging.easytax.vip --scope lilingabriel-5465s-projects
   ```
3. 把 `staging.easytax.vip` 链接发给用户，等待确认
4. 用户明确说"发布"或"上线"后，才运行：
   ```
   vercel deploy --prod --scope lilingabriel-5465s-projects --yes
   ```

**代码提交规范：**
- commit message 必须包含 `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- 使用语义化前缀：`feat:` / `fix:` / `revert:` / `docs:`

**严格禁止：**
- 未经用户明确确认，不得运行 `vercel deploy --prod`
- 任何代码变更（包括 bug 修复、样式调整）都必须先经过 staging 预览
- 不得以"只是小改动"为由跳过预览步骤
- 不得跳过 `--scope lilingabriel-5465s-projects` 参数，否则部署到错误项目

**重要背景：**
- 如果 `/tmp/easytax` 目录丢失（例如重启），需重新克隆：`git clone https://github.com/ysll2002/easytax /tmp/easytax && cd /tmp/easytax && git checkout staging`
- HMRC sandbox 的 staging redirect URI 暂未生效，staging 目前使用 `https://easytax.vip/api/auth/callback/hmrc` 作为 HMRC_REDIRECT_URI 的临时绕过方案

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
