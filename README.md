# 🍅 Tomato Calendar 总览 README

此文档汇总以下两个目录的内容与使用方式：

- 前端项目：`C:\Users\CJH09\Desktop\tomato calendar\Tomato_Calendar-cjh\fontend`
- 后端项目：`C:\Users\CJH09\Desktop\Tomato_Calendar-feature-zjs\Tomato_Calendar-feature-zjs\my-app-backend`

## 功能概览

**前端（React Native + Expo）**

- 📅 日历与计划：月视图 + 详情页，计划新增/编辑/删除
- ⏱️ 番茄专注：计时完成自动统计累计次数与分钟数
- 📌 计划位置：地点选择（UI + 状态流）
- ✅ 打卡/广场：打卡页与广场内容（API 已接入）
- 👤 个人中心：统计与折线图展示
- 🌗 黑夜模式：主题切换与持久化
- 🔐 登录/注册/找回密码：完整认证流程

**后端（NestJS + PostgreSQL）**

- 用户与认证（JWT、邮箱验证码、密码重置、默认昵称/签名）
- 日程管理（创建/查询/更新/删除，支持时间范围查询）
- 习惯打卡（打卡、防重复、连续天数统计）
- 番茄专注（记录与统计专注数据）
- 打卡广场（公共任务、点赞、评论、进货到个人列表）
- 邮件服务（SMTP，支持 QQ 邮箱授权码）

## 技术栈

**前端**

- React Native / Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage
- react-native-svg

**后端**

- NestJS（Node.js）
- TypeScript
- PostgreSQL
- TypeORM
- JWT / Passport
- Nodemailer

## 项目结构（核心）

**前端**

```
fontend/
├── src/
│   ├── screens/               # 页面组件
│   ├── context/               # 全局状态
│   ├── services/              # API 封装
│   └── config/                # API_BASE_URL
├── App.tsx                     # 入口与导航
└── package.json
```

**后端**

```
my-app-backend/
├── src/
│   ├── auth/                   # 认证模块
│   ├── users/                  # 用户模块
│   ├── events/                 # 日程模块
│   ├── habits/                 # 习惯模块
│   ├── focus/                  # 专注模块
│   └── plaza/                  # 广场模块
├── env.template
└── package.json
```

## 快速开始

### 后端启动（NestJS）

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板并配置

```bash
# Windows PowerShell
Copy-Item env.template .env
```

`.env` 需配置数据库、JWT 与邮件相关参数（可参考模板注释）。

3. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

默认端口：`http://localhost:3000`

### 前端启动（React Native + Expo）

1. 安装依赖

```bash
npm install
```

2. 启动开发服务

```bash
npm start
```

3. 运行设备

```bash
npm run android
npm run ios   # 需 macOS
```

4. 配置后端地址

在 `fontend/src/config/api.ts` 中设置：

```ts
export const API_BASE_URL = 'http://YOUR_IP:3000';
```

> 真机调试不能使用 `localhost`，需使用电脑局域网 IP，手机与电脑保持同一网络。

## API 对接概览（核心）

**认证**

- `/users/send-code`、`/users/register`
- `/auth/login`
- `/users/send-reset-code`、`/users/reset-password`

**日程**

- `/events`（创建 / 查询 / 更新 / 删除）

**习惯打卡**

- `/habits`、`/habits/:id/check-in`

**广场**

- `/plaza/habits`、`/plaza/habits/:id/like`、`/plaza/habits/:id/comments`

**番茄专注**

- `/focus/finish`、`/focus/stats`、`/focus/history`

## 重要文档

位于 `Tomato_Calendar-feature-zjs\Tomato_Calendar-feature-zjs`：

- `API说明.md`（完整接口文档）
- `CORS配置说明.md`
- `邮件配置说明.md`
- `邮件发送问题排查指南.md`
- `常见错误解决.md`
- `QQ邮箱授权码获取教程.md`

## 注意事项

- 先启动后端，再启动前端进行联调。
- 若接口不可用，优先检查后端服务与 `API_BASE_URL` 配置。
- 需要 PostgreSQL 本地数据库环境（后端）。
