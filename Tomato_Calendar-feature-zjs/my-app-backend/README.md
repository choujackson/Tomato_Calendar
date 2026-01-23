# Tomato Calendar 后端

基于 NestJS + PostgreSQL + TypeORM 的后端服务，包含用户认证、日程、习惯、专注、广场等模块，并支持邮件验证码。

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

```bash
# Windows PowerShell
Copy-Item env.template .env

# macOS / Linux
cp env.template .env
```

3. 配置 `.env`

- 数据库：`DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE`
- JWT：`JWT_SECRET` / `JWT_EXPIRES_IN`
- 邮件（可选，用于验证码）：`MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASSWORD` / `MAIL_FROM`
- 端口（可选）：`PORT`，默认 `3000`

4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## 常用脚本

- `npm run start`：启动
- `npm run start:dev`：开发模式（监听文件变化）
- `npm run start:prod`：生产模式
- `npm run test`：单元测试
- `npm run test:e2e`：e2e 测试

## 帮助文档

- `CORS配置说明.md`
- `邮件配置说明.md`
- `邮件发送问题排查指南.md`
- `常见错误解决.md`
- `QQ邮箱授权码获取教程.md`
