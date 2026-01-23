# Tomato Calendar

基于 **React Native + Expo** 的番茄日历应用，包含日程管理、番茄专注计时、打卡广场与个人中心统计等功能，并已接入后端 API。

## 主要功能

- 📅 **日历与计划**：月视图 + 详情页，支持计划新增/编辑/删除，缩略任务提示
- ⏱️ **番茄计时**：计时完成自动统计，累计次数与分钟数
- 📌 **计划位置**：选择地点（UI + 状态流）
- ✅ **打卡/广场**：打卡页与打卡广场内容（API 已接入）
- 👤 **个人中心**：展示专注统计与折线图（每日分钟数）
- 🌗 **黑夜模式**：全局灰白主题，设置持久化
- 🔐 **登录/注册/找回密码**：完整认证流程

## 技术栈

- React Native / Expo
- TypeScript
- React Navigation
- AsyncStorage
- Axios
- react-native-svg

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务
npm start

# 运行 iOS（需 macOS）
npm run ios

# 运行 Android
npm run android
```

## 后端配置

后端地址在 `src/config/api.ts` 中配置：

```ts
export const API_BASE_URL = 'http://YOUR_IP:3000';
```

注意事项：
- 真机调试不能使用 `localhost`，必须使用电脑局域网 IP
- 手机与电脑需在同一网络下

## 项目结构（核心）

```
fontend/
├── src/
│   ├── screens/               # 页面组件
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── CalendarView.tsx
│   │   ├── DetailView.tsx
│   │   ├── AddPlanView.tsx
│   │   ├── TomatoTimerScreen.tsx
│   │   ├── CheckInContainer.tsx
│   │   └── UserProfileScreen.tsx
│   ├── context/               # 全局状态
│   │   ├── PlanContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── DateContext.tsx
│   │   └── LocationContext.tsx
│   ├── services/              # API 封装
│   │   └── api.ts
│   └── config/
│       └── api.ts             # API_BASE_URL
├── App.tsx                     # 入口与导航
└── package.json
```

## API 对接概览

- **认证**：登录 / 注册 / 找回密码
- **日程**：`/events`（创建 / 查询 / 更新 / 删除）
- **番茄专注**：`/focus/finish`、`/focus/stats`、`/focus/history`
- **打卡 / 广场**：`/habits`、`/plaza` 相关接口

## 说明

- 设计基于 iPhone 14 尺寸，部分布局以 Figma 为基准
- 若数据不同步，请先检查 API_BASE_URL 与后端状态

