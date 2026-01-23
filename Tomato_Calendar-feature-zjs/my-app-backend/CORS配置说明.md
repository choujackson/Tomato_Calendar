# 🌐 CORS 跨域配置说明

## 问题说明

浏览器访问后端接口时，如果前端与后端不在同一源，需要启用 CORS。

## 当前状态

`src/main.ts` 默认**未启用** CORS。如需从浏览器直接访问后端 API，请按下面步骤启用。

## 启用方式

在 `src/main.ts` 中创建 `app` 后、`listen` 之前添加：

```typescript
const app = await NestFactory.create(AppModule);

app.enableCors({
  origin: true, // 开发环境允许所有来源
  credentials: true, // 允许携带凭证（如 cookies、Authorization header）
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.listen(process.env.PORT ?? 3000);
```

## 配置说明

### 开发环境

- `origin: true` - 允许所有来源，适合开发环境
- `credentials: true` - 允许携带认证信息（JWT token 等）
- `methods` - 允许的 HTTP 方法
- `allowedHeaders` - 允许的请求头

### 生产环境配置建议

在生产环境中，应该限制允许的来源：

```typescript
app.enableCors({
  origin: [
    'https://your-production-domain.com',
    'https://www.your-production-domain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

或者使用环境变量：

```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://your-production-domain.com']
  : true;

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

## 支持的访问场景

启用 `origin: true` 后可支持以下场景：

1. ✅ Expo Web: `http://localhost:8081`
2. ✅ Expo Go (真机): 任何 IP 地址
3. ✅ React Native 开发: 任何来源
4. ✅ Postman/其他 HTTP 客户端

## 注意事项

- 开发环境使用 `origin: true` 方便开发，但生产环境应该限制具体域名
- 如果遇到 CORS 错误，检查：
  1. 后端服务是否已重启（修改 `main.ts` 后需要重启）
  2. 请求头是否包含在 `allowedHeaders` 中
  3. HTTP 方法是否在 `methods` 列表中

