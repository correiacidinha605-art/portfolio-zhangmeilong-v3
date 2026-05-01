# backend 目录说明

这个目录当前先用于承接 `IMA` 接入方案的后端实现。

## 推荐实现顺序

### 第一步

先补一个最小可运行服务，只做：

- `GET /api/health`
- `GET /api/public/kb`
- `POST /api/public/search`
- `GET /api/public/project/:slug`

### 第二步

补管理员能力：

- `POST /api/admin/login`
- `GET /api/admin/kb/list`
- `POST /api/admin/kb/upload`
- `POST /api/admin/notes/create`
- `POST /api/admin/notes/append`

## 当前已实现

这一轮已经落地了公共 MVP：

- `GET /api/health`
- `GET /api/public/kb`
- `POST /api/public/search`
- `GET /api/public/project/:slug`
- `GET /api/public/notes`
- `GET /api/public/notes/:docId`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `POST /api/admin/logout`
- `POST /api/admin/notes/create`

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

```bash
cp .env.example .env
```

如果你已经把 IMA 凭证写进了 `~/.config/ima/client_id` 和 `~/.config/ima/api_key`，本地开发时即使不在 `.env` 里重复填写，也能正常读取。

3. 启动服务

```bash
npm run dev
```

默认地址：

- `http://localhost:3218/api/health`

## 推荐目录结构

```text
backend/
  .env.example
  README.md
  src/
    app.js
    routes/
      public.js
      admin.js
    services/
      ima-client.js
      kb-service.js
      notes-service.js
      upload-service.js
    middleware/
      auth.js
      require-admin.js
      rate-limit.js
    utils/
      logger.js
      sanitize.js
      validate.js
```

## 和当前前端的连接方式

你当前前端还是纯静态站。

后续连接方式建议是：

1. 保持前端页面静态渲染
2. 在按钮点击或搜索时请求 `/api/...`
3. 后端负责转发到 `IMA OpenAPI`
4. 前端永远不要直接保存 `Client ID / API Key`

## 重要提醒

这个项目如果上线公开访问：

- 不要把你的个人知识库全开放给访客
- 最好单独准备一个“公开展示用知识库”
- 只让公开接口读这个知识库
