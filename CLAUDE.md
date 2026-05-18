# EasyTax — Claude Code Instructions

## Deployment Rules

**正确流程：**
1. 代码改完后，先运行 `vercel deploy`，把预览 URL 发给用户
2. 用户在预览环境（`staging.easytax.vip` 或 `easytax-xxx.vercel.app`）确认效果满意
3. 用户明确说"发布"或"上线"后，才运行 `vercel deploy --prod`
4. `vercel deploy --prod` 会直接更新 `easytax.vip`（真实线上环境，有真实用户）

**严格禁止：**
- 未经用户确认，不得运行 `vercel deploy --prod`
- Bug 修复、功能开发、任何代码变更，都必须先走预览环境
- 不得以"只是小改动"为由跳过预览步骤

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
