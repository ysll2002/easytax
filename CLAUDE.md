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
