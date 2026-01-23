# 🍅 Tomato Calendar API 文档

**Base URL**: `http://localhost:3000` (本地开发环境)

## 🔐 认证方式 (Authentication)

除注册、登录和找回密码相关的接口外，所有接口均需要进行身份验证。

*   **Header**: `Authorization`
*   **Value**: `Bearer <你的access_token>`

> **注意**: `access_token` 通过登录接口获取。

---

## 1. 用户与认证 (User & Auth)

### 1.1 发送注册验证码
向指定邮箱发送 6 位数验证码。

*   **URL**: `/users/send-code`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "user@example.com"
    }
    ```

### 1.2 用户注册
*   **URL**: `/users/register`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "mySecurePassword123",
      "code": "123456" // 邮箱收到的验证码
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "message": "注册成功",
      "user": {
        "email": "user@example.com",
        "username": "用户_user",
        "signature": "这位同学很懒...",
        "id": 1
      }
    }
    ```

### 1.3 用户登录
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "mySecurePassword123"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...", // JWT Token，前端需保存
      "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "用户_user",
        "signature": "这位同学很懒..."
      }
    }
    ```

### 1.4 发送重置密码验证码
*   **URL**: `/users/send-reset-code`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "user@example.com"
    }
    ```

### 1.5 重置密码
*   **URL**: `/users/reset-password`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "code": "123456",
      "newPassword": "newPassword123"
    }
    ```

---

## 2. 日程管理 (Events)

**⚠️ 需要 Header**: `Authorization: Bearer <token>`

### 2.1 创建日程
*   **URL**: `/events`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "title": "Shopping",             // 必填
      "startTime": "2025-12-15T09:00:00.000Z", // 必填 (ISO 8601格式)
      "endTime": "2025-12-15T11:30:00.000Z",   // 必填
      "isAllDay": false,               // 可选, 默认 false
      "location": "West2 Building",    // 可选
      "color": "#FF5733",              // 可选, Hex颜色
      "repeat": "weekly",              // 可选: 'never', 'daily', 'weekly', 'monthly', 'yearly'
      "notes": "Buy some milk"         // 可选
    }
    ```

### 2.2 获取日程列表
根据日期范围获取。

*   **URL**: `/events`
*   **Method**: `GET`
*   **Query Params**:
    *   `startDate`: 开始日期 (e.g., `2025-12-01`)
    *   `endDate`: 结束日期 (e.g., `2025-12-31`)
*   **Example**: `/events?startDate=2025-12-01&endDate=2025-12-31`
*   **Response**:
    ```json
    [
      {
        "id": 1,
        "title": "Shopping",
        "startTime": "2025-12-15T09:00:00.000Z",
        "endTime": "2025-12-15T11:30:00.000Z",
        "location": "West2 Building",
        "color": "#FF5733",
        "userId": 1
      }
      // ... 更多事件
    ]
    ```

### 2.3 获取单个日程详情
*   **URL**: `/events/:id` (e.g., `/events/1`)
*   **Method**: `GET`

### 2.4 更新日程
*   **URL**: `/events/:id`
*   **Method**: `PATCH`
*   **Body**: (仅需发送要修改的字段)
    ```json
    {
      "title": "Shopping with Mom",
      "isAllDay": true
    }
    ```

### 2.5 删除日程
*   **URL**: `/events/:id`
*   **Method**: `DELETE`

---

## 3. 习惯打卡 (Habits)

**⚠️ 需要 Header**: `Authorization: Bearer <token>`

### 3.1 创建新习惯
*   **URL**: `/habits`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "name": "Running"
    }
    ```

### 3.2 获取习惯列表 (包含统计数据)
后端会自动计算连续打卡天数 (`streak`) 和今日是否已打卡 (`checkedInToday`)。前端拿到数据直接渲染即可。

*   **URL**: `/habits`
*   **Method**: `GET`
*   **Response**:
    ```json
    [
      {
        "id": 1,
        "name": "Running",
        "userId": 1,
        "streak": 5,           // 连续打卡天数 (后端计算)
        "checkedInToday": true // 今天是否已完成 (后端计算)
      },
      {
        "id": 2,
        "name": "Reading",
        "userId": 1,
        "streak": 0,
        "checkedInToday": false
      }
    ]
    ```

### 3.3 执行打卡
*   **URL**: `/habits/:id/check-in` (e.g., `/habits/1/check-in`)
*   **Method**: `POST`
*   **Body**: `{}` (空对象即可)
*   **Response**:
    ```json
    {
      "message": "打卡成功！"
    }
    ```
    > 如果今日已打卡，会返回 `400 Bad Request` 错误。

### 3.4 删除习惯
删除习惯会同时删除该习惯下的所有打卡记录。

*   **URL**: `/habits/:id`
*   **Method**: `DELETE`

---

## 4. 常见错误码 (Status Codes)

*   `200 OK`: 请求成功。
*   `201 Created`: 创建成功 (注册、新建日程等)。
*   `400 Bad Request`: 参数错误 (如邮箱格式不对、密码太短、重复打卡)。
*   `401 Unauthorized`: 未登录或 Token 过期。
*   `403 Forbidden`: 试图操作不属于自己的数据。
*   `404 Not Found`: 资源不存在 (如找不到该 ID 的日程)。


## 5. 打卡广场 (Plaza)

**⚠️ 需要 Header**: `Authorization: Bearer <token>`

这里是公共打卡区域，支持随机浏览、点赞、评论以及将任务“进货”到自己的个人列表中。

### 5.1 获取广场任务列表 (随机推荐)
返回随机排序的 10 个热门任务，包含统计数据（今日打卡人数、点赞数、评论数等）。

*   **URL**: `/plaza/habits`
*   **Method**: `GET`
*   **Response**:
    ```json
    [
      {
        "id": 1,
        "title": "Running",
        "description": null,
        "createdAt": "2025-12-20T10:00:00.000Z",
        "creatorId": 101,
        "creator": {
          "id": 101,
          "username": "用户_June",
          "signature": "Love running!"
        },
        "likesCount": 1223,
        "commentsCount": 24,
        "todayCheckInCount": 612, // 对应 UI: "612 ppl Checked in today"
        "isLikedByMe": true       // 当前用户是否点赞了
      }
      // ... 最多返回 10 条
    ]
    ```

### 5.2 发布广场任务
用户创建一个公共任务供他人打卡。

*   **URL**: `/plaza/habits`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "title": "Morning Reading"
    }
    ```

### 5.3 广场打卡
对应卡片上的蓝色 "Check in" 按钮。

*   **URL**: `/plaza/habits/:id/check-in`
*   **Method**: `POST`
*   **Response**: `{ "message": "广场打卡成功" }`

### 5.4 加入我的打卡 (进货)
对应 UI 图里的 "Add to my check in"。这将把公共任务复制一份到用户的**个人习惯列表** (Habits) 中。

*   **URL**: `/plaza/habits/:id/adopt`
*   **Method**: `POST`
*   **Response**: 返回新创建的个人 Habit 对象。

### 5.5 点赞/取消点赞
对应心形图标。接口会自动切换状态（如果已赞则取消，未赞则点赞）。

*   **URL**: `/plaza/habits/:id/like`
*   **Method**: `POST`
*   **Response**:
    ```json
    {
      "isLiked": true // 或 false
    }
    ```

### 5.6 发表评论
*   **URL**: `/plaza/habits/:id/comments`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "content": "这是一条非常有动力的评论！"
    }
    ```

### 5.7 获取评论列表
*   **URL**: `/plaza/habits/:id/comments`
*   **Method**: `GET`

---

## 6. 番茄专注 (Focus)

**⚠️ 需要 Header**: `Authorization: Bearer <token>`

用于记录和统计用户的专注时间。

### 6.1 完成一次专注
当倒计时结束时调用此接口进行记录。

*   **URL**: `/focus/finish`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "duration": 25,   // 可选，专注时长(分钟)，默认 25
      "tag": "Study"    // 可选，标签或备注
    }
    ```

### 6.2 获取专注统计
获取当前用户的累计数据。

*   **URL**: `/focus/stats`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "totalCount": 42,      // 累计专注次数
      "totalMinutes": 1050   // 累计专注分钟数
    }
    ```

### 6.3 获取专注历史
获取最近的 20 条专注记录。

*   **URL**: `/focus/history`
*   **Method**: `GET`
*   **Response**:
    ```json
    [
      {
        "id": 5,
        "duration": 25,
        "tag": "Coding",
        "completedAt": "2025-12-29T14:30:00.000Z"
      }
      // ...
    ]
    ```