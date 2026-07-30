# NEBULA 数据控制台

> [!IMPORTANT]
> **本项目是 AI Agent 的实验性产品。**
>
> NEBULA 用于探索 AI Agent 参与产品设计、前端开发、问题修复、文档编写与自动化部署的完整工作流。项目以技术验证和实验研究为主要目的，功能、交互及实现方案仍可能持续调整，不建议未经充分评估直接用于生产环境。

NEBULA 是一个面向企业数据中台场景的全栈后台系统。前端基于 Vue 3、TypeScript 和 Vite，后端采用 NestJS、Prisma 与 PostgreSQL，提供数据看板、用户与 RBAC 权限、动态菜单、业务数据、操作审计，以及支持真实流式输出与 Tool 轨迹的 AI Agent 工作台。

## 在线预览

- 在线地址：<https://shenfan1231.top>
- GitHub 仓库：<https://github.com/ShenFan1231/ShenFanSoul>

## 功能特性

- 数据控制台：核心指标、趋势图表、动态信息与系统状态展示
- 数据分析：多维度业务数据和 ECharts 可视化
- 订单中心：订单列表、筛选、分页与详情页面
- 系统管理：用户管理、角色权限和系统设置
- 权限体系：支持角色、页面、菜单和按钮级权限控制
- 身份认证：JWT Access Token、Refresh Token、安全 Cookie 与会话管理
- 动态路由：根据当前角色和权限生成可访问路由与菜单
- 业务模块：用户、角色、项目、订单、系统配置与操作日志
- Agent 工作台：会话、任务进度、Tool 调用轨迹与 DeepSeek 真实 SSE
- 多标签页：支持页面标签、缓存、刷新和关闭操作
- 主题与布局：支持明暗主题、侧边栏折叠和界面设置
- 交互实验室：集中展示基础组件、动画和权限指令
- 响应式设计：适配桌面端及不同尺寸的浏览器窗口
- 工程部署：Docker Compose、Nginx、PostgreSQL 持久卷与自动迁移
- Mock 模式：仍可按需启用，方便纯前端演示和离线开发

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 前端框架 | Vue 3 |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| 路由 | Vue Router |
| 状态管理 | Pinia |
| 原子化 CSS | UnoCSS |
| 数据可视化 | ECharts |
| 动画 | GSAP |
| 后端框架 | NestJS |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| AI Provider | DeepSeek（可替换 Provider） |
| 通信 | REST + authenticated SSE |
| 部署 | Docker Compose + Nginx |
| HTTP 请求 | Axios |
| 工具库 | VueUse、Day.js |
| 图标 | Iconify Lucide |
| 包管理器 | pnpm |

## 演示账号

登录页面支持快速选择以下角色：

| 角色 | 账号 | 权限范围 |
| --- | --- | --- |
| 超级管理员 | `admin` | 全部页面和操作权限 |
| 管理员 | `manager` | 常用管理和业务权限 |
| 运营 | `operator` | 运营及数据查看权限 |

默认密码为 `nebula123`。Mock 环境中也可以使用任意不少于 6 位的密码。

## 本地开发

### 环境要求

- Node.js 22 或更高版本
- pnpm 10
- Docker Desktop / Docker Engine

### 安装与启动

```bash
pnpm install
docker compose -f compose.dev.yaml up -d --build
pnpm dev
```

开发地址与服务端口：

```text
Frontend:   http://localhost:5273
API:        http://localhost:8080/api
PostgreSQL: localhost:5432
```

如果端口已被占用，Vite 会自动选择其他可用端口，请以终端输出为准。

### 生产构建

```bash
pnpm build
```

构建产物输出到 `dist` 目录。

### 本地预览构建结果

```bash
pnpm preview
```

## 环境变量

项目使用以下环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_APP_TITLE` | `NEBULA 控制台` | 应用标题 |
| `VITE_APP_BASE` | `/` | 应用部署基础路径 |
| `VITE_API_BASE_URL` | `/api` | API 请求基础地址 |
| `VITE_REQUEST_TIMEOUT` | `15000` | 请求超时时间，单位为毫秒 |
| `VITE_USE_MOCK` | `1` | 是否启用内置 Mock，`1` 开启、`0` 关闭 |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8080` | 开发环境 API 代理目标 |

需要接入真实后端时，可以将 `VITE_USE_MOCK` 设置为 `0`，并调整 API 地址或代理目标。

## 项目结构

```text
.
├─ public/                  # 静态资源及自定义域名配置
├─ server/                  # NestJS、Prisma、迁移与种子数据
├─ deploy/                  # Nginx、前端镜像及服务器初始化脚本
├─ docs/                    # 分阶段架构与生产部署文档
├─ src/
│  ├─ api/                 # API 模块与类型
│  ├─ components/          # 通用组件、图表及反馈组件
│  ├─ composables/         # 可复用组合式函数
│  ├─ directives/          # 权限、动效等自定义指令
│  ├─ layout/              # 后台主布局
│  ├─ mock/                # Mock 数据与请求适配器
│  ├─ router/              # 路由、守卫及菜单生成
│  ├─ stores/              # Pinia 状态管理
│  ├─ styles/              # 全局样式、主题和过渡动画
│  ├─ types/               # 全局业务类型
│  ├─ utils/               # 请求、缓存、格式化等工具
│  └─ views/               # 业务页面
├─ .github/workflows/      # 前后端 CI 构建检查
├─ compose.dev.yaml        # 本地 API 与 PostgreSQL
├─ compose.prod.yaml       # 生产 Nginx/API/PostgreSQL
├─ uno.config.ts           # UnoCSS 配置
└─ vite.config.ts          # Vite 配置
```

## 权限设计

业务路由在用户登录后根据角色和权限动态注册。页面通过路由元信息声明访问要求，包括：

- `roles`：允许访问页面的角色
- `permissions`：访问页面所需的权限标识
- `hideInMenu`：是否从菜单中隐藏
- `keepAlive`：是否缓存页面状态
- `affix`：是否固定在标签栏

按钮和局部功能可通过权限指令或权限状态进行细粒度控制。

## 部署

生产环境使用单机 Docker Compose：

1. Nginx 托管 Vue 静态资源，并反向代理 `/api` 与 SSE；
2. NestJS 仅在 Docker 内网提供服务；
3. PostgreSQL 不暴露公网端口，数据写入持久卷；
4. 启动时自动执行 Prisma migration，种子数据通过独立 profile 初始化；
5. 生产密钥保存在被 Git 忽略的 `.env.production.local`。

完整步骤见 [生产部署文档](docs/deployment/production.md)。

GitHub Actions 不再发布 GitHub Pages，只负责 Prisma 校验和前后端生产构建。

## 常用命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查并生产构建
pnpm build

# 预览生产构建
pnpm preview
```
