# 🍅 Tomato Calendar Backend (番茄日历后端)

这是一个基于 **NestJS** 构建的高性能后端服务，专为日程管理与习惯打卡应用设计。它提供了用户认证、日程安排、习惯追踪及统计等核心功能，支持灵活的扩展。

## ✨ 功能特性

*   **用户认证系统 (Auth & Users)**
    *   基于 JWT (JSON Web Token) 的无状态认证。
    *   邮箱验证码注册 (SMTP)。
    *   安全的密码找回/重置流程。
    *   自动生成默认用户名和个性签名。
    *   密码加密存储 (Bcrypt)。
*   **日程管理 (Events)**
    *   创建、查询、修改、删除日程事件。
    *   支持全天事件、地点、颜色标记及重复规则。
    *   基于时间范围的数据查询（月视图/周视图支持）。
    *   严格的数据隔离（用户只能访问自己的数据）。
*   **习惯打卡 (Habits)**
    *   创建习惯目标。
    *   每日打卡功能（防重复打卡机制）。
    *   **自动计算连续打卡天数 (Streak)**。
    *   查看当日打卡状态。
*   **技术架构**
    *   使用 **TypeORM** 进行数据库操作，支持从 PostgreSQL 平滑迁移到其他数据库。
    *   模块化设计 (Modules)，高内聚低耦合。
    *   DTO 数据验证与转换。

## 🛠 技术栈

*   **框架**: [NestJS](https://nestjs.com/) (Node.js)
*   **语言**: TypeScript
*   **数据库**: PostgreSQL
*   **ORM**: TypeORM
*   **认证**: Passport, JWT
*   **邮件服务**: Nodemailer
*   **工具**: Class-validator, Class-transformer

## 🚀 快速开始

### 1. 环境要求

在开始之前，请确保您的开发环境已安装：

*   [Node.js](https://nodejs.org/) (v16+)
*   [PostgreSQL](https://www.postgresql.org/)
*   [npm](https://www.npmjs.com/) 或 yarn

### 2. 安装依赖

```bash
git clone https://github.com/您的用户名/您的项目仓库名.git
cd my-app-backend
npm install
```

### 3. 配置环境变量

在项目根目录下创建一个 `.env` 文件，复制以下内容并填入您的真实信息：

```properties
# .env 文件

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=您的数据库密码
DB_DATABASE=tomato_calendar_db

# JWT 密钥 (生产环境请使用复杂的随机字符串)
JWT_SECRET=super-secret-key-change-this
JWT_EXPIRES_IN=7d

# 邮件服务配置 (SMTP)
# 示例: QQ邮箱使用 smtp.qq.com, 端口 465, secure=true
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USER=您的邮箱地址@example.com
# 注意：这里通常是邮箱的"授权码"，而非登录密码
MAIL_PASSWORD=您的邮箱授权码
MAIL_FROM='"Tomato App" <noreply@example.com>'
```

### 4. 运行应用

```bash
# 开发模式 (支持热重载)
npm run start:dev

# 生产模式
npm run start:prod
```

启动成功后，服务默认运行在 `http://localhost:3000`。

## 📚 API 接口概览

以下是核心 API 端点示例（建议使用 Postman 测试）：

### 用户与认证 (Auth)

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| POST | `/users/send-code` | 发送注册验证码 |
| POST | `/users/register` | 用户注册 (需验证码) |
| POST | `/auth/login` | 用户登录 (返回 Access Token) |
| POST | `/users/send-reset-code` | 发送重置密码验证码 |
| POST | `/users/reset-password` | 重置密码 |

### 日程 (Events) - *需 Header: Authorization: Bearer <token>*

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| POST | `/events` | 创建新日程 |
| GET | `/events?startDate=...&endDate=...` | 获取指定日期范围内的日程 |
| PATCH| `/events/:id` | 更新日程 |
| DELETE| `/events/:id` | 删除日程 |

### 习惯 (Habits) - *需 Header: Authorization: Bearer <token>*

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| POST | `/habits` | 创建新习惯 |
| GET | `/habits` | 获取习惯列表 (含坚持天数) |
| POST | `/habits/:id/check-in` | **打卡** |
| DELETE| `/habits/:id` | 删除习惯 |

## 📂 项目结构

```
src/
├── app.module.ts       # 根模块
├── main.ts             # 入口文件
├── auth/               # 认证模块 (JWT策略, 登录逻辑)
├── users/              # 用户模块 (实体, 注册, 邮件发送)
├── events/             # 日程模块 (日历事件管理)
└── habits/             # 习惯模块 (打卡与统计)
```

## 🤝 贡献与开发

欢迎提交 Issue 或 Pull Request！

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

## 📄 License

[MIT](LICENSE)
