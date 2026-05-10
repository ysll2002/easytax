# EasyTax — Claude Code Instructions

## Deployment Rules

每次代码改完后，自动运行 `vercel deploy`（预览环境），并把预览 URL 发给用户。
等用户确认满意后，才运行 `vercel deploy --prod` 发布到线上。
绝不在未经用户确认的情况下直接发布到线上。
