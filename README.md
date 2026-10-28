# 寻迹 · Xunji

> Save anything. Find it by memory.
>
> 你不需要记住收藏了什么，只需要记住你想找什么。

把任意链接交给寻迹，它在后台完成抓取、正文提取、AI 摘要、关键词、切分与向量索引；
未来用一句自然语言描述你记得的内容，即可从**你自己的收藏**里把原文找回来，并看到「为什么找到它」。

- 产品定位与边界：[`docs/PRODUCT.md`](docs/PRODUCT.md)
- 工程契约（API / 数据库 / 模块签名）：[`docs/ENGINEERING.md`](docs/ENGINEERING.md)

## 架构

```text
┌──────────┐  POST /api/v1/documents   ┌──────────────┐
│  Frontend │ ────────────────────────▶ │  FastAPI      │
│ React+Vite│ ◀──────────────────────── │  /api/v1/*    │
└──────────┘   搜索/列表/详情/状态       └──────┬───────┘
                                               │ 写入
                    ┌──────────────────────────┼──────────────────┐
                    │  PostgreSQL + pgvector   │                  │
                    │  documents / chunks /    │                  │
                    │  processing_jobs (队列)   │                  │
                    └────────────▲─────────────┴──────────────────┘
                                 │ FOR UPDATE SKIP LOCKED 领取
                          ┌──────┴───────┐
                          │   Worker     │ 抓取(SSRF 防护) → 解析器
                          │  runner.py   │ → 摘要/关键词 → 切分
                          └──────────────┘ → Embedding → 写索引 → 关联
```

- **API 与 Worker 共用一套代码**，用不同命令启动；任务表就是持久化队列（租约、重试、去重、崩溃恢复）。
- **保存立即返回**，解析与索引全部异步；解析失败也永远保留原始链接。
- **搜索是混合检索**：PostgreSQL 全文 + pg_trgm（中文子串）+ 词面匹配 + pgvector 语义，
  候选集内归一化后加权融合，匹配原因只用真实命中证据拼装。

## 快速开始（Docker Compose）

```bash
docker compose up --build
# 应用   http://localhost:3000
# 说明页 http://localhost:3001
# API    http://localhost:8000/api/v1/health
```

> 需要能拉取 `pgvector/pgvector:pg16` 镜像；受限网络可配置镜像加速器，
> 或改用下方「本地开发」路径（完全不依赖 Docker）。

## 本地开发

前置：Python 3.11+、Node 20+、PostgreSQL 14+（需 `vector`、`pg_trgm`、`pgcrypto` 扩展）。

```bash
# 1) 数据库
createuser xunji -P            # 密码 xunji（或按需修改 DATABASE_URL）
createdb xunji -O xunji
psql -d xunji -c 'CREATE EXTENSION vector; CREATE EXTENSION pg_trgm; CREATE EXTENSION pgcrypto;'

# 2) 后端
cd backend
uv venv --python 3.12
uv pip install -e '.[dev]'
.venv/bin/python -m app.db --migrate
.venv/bin/python -m uvicorn app.main:app --port 8000        # API
.venv/bin/python -m app.workers.runner                       # 另开终端：Worker

# 3) 前端（monorepo，npm workspaces，仓库根目录执行）
npm install
npm run api:typecheck  # @xunji/api
npm run dev            # 应用   http://localhost:5173
npm run dev:landing    # 说明页 http://localhost:5174
```

> 默认代理到 `http://localhost:8000`；本机 8000 被占用时用
> `XUNJI_API_TARGET=http://127.0.0.1:8010 npm run dev` 指定 API 端口。

### 手机 App（Expo / React Native，本地优先）

`apps/mobile` 是独立的 iOS / Android 客户端，不是 PWA，也**不依赖后端**、不需要登录：
收藏只存在手机本地，抓取正文、摘要、索引和检索全部在设备上完成。服务端（`backend/`、
`apps/web/`）仍然保留，面向自托管和未来的多端同步，但 App 不调用它。

- 本地库是 SQLite（`expo-sqlite`，`src/local/db.ts`）：`documents` 表保存正文、摘要、
  关键词与检索文本，`documents_url_active_idx` 保证同一条链接只有一条有效收藏。
- 删除是墓碑（`deleted_at`），并保留 `updated_at`——数据模型已经为以后的多端同步留好合并依据。
- 保存后在 `src/local/pipeline.ts` 里串行处理：抓取 → 启发式正文抽取 → 摘要 → 落库，
  状态仍是 `pending → fetching → parsing → analyzing → completed | partial | failed`。
- 检索在 `src/local/repo.ts` 里完成：中文二元组 + 英文词切分，按标题 / 关键词 / 摘要 / 正文
  加权打分，`match_reason` 只由真实命中项拼出，不生成原文没有的内容。
- 设置页可以接入用户自己的大模型（任意 OpenAI 兼容 `chat/completions`）：地址与模型名存
  AsyncStorage，API Key 只存 `expo-secure-store`；不配置时用原文抽取式摘要。

```bash
# 仓库根目录
npm install
npm run dev:mobile          # expo start（Expo Go 可调 UI，但不能测试系统分享）
npm run mobile:typecheck
npm run mobile:doctor

# 需要原生开发工具链（development build）
npm run mobile:ios          # expo run:ios，需要 Xcode + CocoaPods
npm run mobile:android      # expo run:android，需要 Android Studio / SDK
```

不需要配置 API 地址，也没有 `EXPO_PUBLIC_API_BASE_URL`。界面是独立的冷中性现代移动端视觉
（浅冷灰画布、白色卡片、靛蓝强调色、系统无衬线），定义在 `apps/mobile/src/theme.ts`，
不与 Web 的暖色纸感共享；底部三标签（首页 / 收藏 / 我的）在 `components/AppTabBar.tsx`。

系统分享使用 `expo-share-intent`，只在 development build / 正式包中可用：

- iOS 使用 Share Extension，Android 注册 `ACTION_SEND` + `text/*`；
- 首次原生构建后，iOS 需要在 Xcode 中为 App 和 ShareExtension 选择同一个 Development Team
  （两者共用 App Group `group.com.xunji.app`）；Android 需要可用的 SDK；
- 分享进入后直接在本机保存并跳到详情，不需要登录；
- 微信、小红书等若只分享标题/描述或短链而没有 URL，寻迹无法保存，会提示没有网页链接。

开发构建允许任意 HTTP（iOS ATS 例外、Android `usesCleartextTraffic`），方便抓取局域网页面
或连接本机模型服务；正式构建只允许 HTTPS。`ios/`、`android/` 是 `expo prebuild` 的产物，
不提交到 Git。

已验证：`npm run mobile:typecheck` 通过，`expo export --platform android` 能打出 JS bundle。
旧版本曾在 arm64 模拟器上完成原生编译与局域网后端冒烟；改为本地存储后，原生编译与真机
分享仍需 Xcode / Android Studio / EAS 验证。

### 安装到 Android 手机

**不装 Android Studio 也能出包**：`.github/workflows/android.yml` 在 GitHub 上构建
release APK（arm64，JS 已打进包，可独立运行）。不需要任何仓库变量；推送代码或在 Actions
页手动运行，产物在运行页的 Artifacts 里（`xunji-apk-<sha>`）。签名用的是 RN/Expo 模板自带
的 debug 密钥，够自己安装，**不能上架**。

本机构建：

```bash
# 构建（只需 arm64，覆盖绝大多数在售安卓机）
cd apps/mobile/android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

安装包为 `app/build/outputs/apk/release/app-release.apk`。传到手机后需要允许“未知来源”
安装；`release` 变体目前用 debug 签名，**不能上架**，只用于自己安装体验。装好后不需要任何
配置，粘贴或分享链接即可，数据全部留在手机上。

### 仓库结构

```text
xunji/
├── apps/web/            # 应用（React + Vite，@xunji/web）：用户实际使用的界面
├── apps/mobile/         # 独立手机 App（Expo / React Native，@xunji/mobile）
├── apps/landing/        # 说明页（纯静态 HTML/CSS，@xunji/landing）：产品介绍与演示
├── packages/shared/     # 跨端共享：API 契约类型 + 平台无关的格式化/错误逻辑（@xunji/shared）
├── packages/api/        # 跨端 HTTP 传输：createApiClient、超时、信封解析（@xunji/api）
├── backend/             # FastAPI + Worker + 迁移 + 测试
├── docs/                # PRODUCT.md、ENGINEERING.md、DEPLOY_FREE.md、DEPLOY_NORTHFLANK.md
├── deploy/free/         # 单容器镜像（API + Worker + 网页），面向免费 PaaS
├── docker-compose.yml
├── northflank.json      # Northflank 模板：GitHub 构建 + 部署 API / Worker / Web
├── render.yaml          # Render Blueprint：一个免费 Web 服务跑完整应用
└── package.json         # npm workspaces 根
```

根目录命令：`npm run dev` / `npm run dev:landing` / `npm run dev:mobile` /
`npm run build`（构建 Web 与说明页）；另有 `api:typecheck`、`mobile:ios`、`mobile:android`、
`mobile:typecheck`、`mobile:doctor`、`mobile:export`。

说明页是独立站点，不进入应用：应用内没有产品介绍页面，说明内容只放在 landing。
应用地址在构建时注入——开发默认 `http://localhost:5173`，Docker 构建通过
`XUNJI_APP_URL` 传入（`docker-compose.yml` 中为 `http://localhost:3000`）；
分享预览图（`og:image`）需要绝对地址，由 `XUNJI_SITE_URL` 注入，默认
`http://localhost:5174`（compose 中为 `http://localhost:3001`）。说明页里的产品截图
存放在 `apps/landing/public/shots/`，是用真实数据从运行中的应用截取的，改动界面后需要重截。

首次使用（App）：安装后直接粘贴或分享链接保存 → 等状态变为「已完成整理」→ 用一句描述搜索。

## 部署

**Web 部署已暂停。** 主力产品是手机 App；`apps/web` 和 `backend/` 继续留在仓库里用于本地
开发与自托管，但不再随版本发布，也不再触发部署流程。

### 说明页：GitHub Pages

`.github/workflows/pages.yml` 在 `apps/landing/**` 变更时构建说明页并发布到 GitHub Pages：

- 站点地址：`https://wst7.github.io/xunji/`（项目站点，Vite `base` 为相对路径）；
- 应用入口指向 `https://github.com/wst7/xunji/releases/latest`（APK 放在 Release 里）；
- 仓库必须是 **public**：GitHub Free 计划下，私有仓库不支持 Pages。
  如果仓库保持私有，改用 Cloudflare Pages / Netlify 等免费主机托管 `apps/landing/dist`。

### 自托管（可选，不影响 App）

`docker compose up --build` 可以在本机跑完整的 Web + API + Worker；`render.yaml`、
`northflank.json`、`deploy/free/` 保留为自托管模板，见 `docs/DEPLOY_FREE.md` 与
`docs/DEPLOY_NORTHFLANK.md`。这些模板与手机 App 无关——App 完全本地运行。

## 配置

全部通过环境变量提供，见 [`.env.example`](.env.example)（密钥禁止写入源码或提交 Git，也不会下发到浏览器）。

关键项：

| 变量 | 默认 | 说明 |
|---|---|---|
| `AI_PROVIDER` | `extractive` | `extractive`（本地抽取式，离线可用）或 `openai` / `openai-compatible`（任意 OpenAI 兼容服务） |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | 空 / `https://api.openai.com/v1` / `gpt-4o-mini` | 摘要与关键词；本地服务可不填 API Key |
| `AI_CHAT_PATH` / `AI_AUTH_HEADER` / `AI_AUTH_PREFIX` | `/chat/completions` / `Authorization` / `Bearer` | 接口路径与鉴权方式 |
| `AI_EXTRA_HEADERS` / `AI_JSON_MODE` | `{}` / `true` | 额外请求头（JSON 对象）；服务商不支持 `response_format` 时关掉 JSON mode |
| `EMBEDDING_PROVIDER` | `local` | `local`（本地特征哈希向量，离线可用）或 `openai` / `openai-compatible`（兼容 `/embeddings`） |
| `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL` / `EMBEDDING_MODEL` | 同上风格 | embedding 服务 |
| `EMBEDDING_PATH` / `EMBEDDING_AUTH_HEADER` / `EMBEDDING_AUTH_PREFIX` / `EMBEDDING_EXTRA_HEADERS` | 同上风格 | embedding 兼容层细节 |
| `EMBEDDING_DIM` | `1536` | 必须等于模型真实输出维度，否则**启动即报错**；换维度需重建 `document_chunks.embedding` 索引 |
| `SEARCH_*_WEIGHT` | 0.35/0.35/0.20/0.10 | 全文 / 语义 / 标题 / 元数据融合权重 |
| `FETCH_ALLOWED_PORTS` | 80,443,8080,8443 | 抓取端口白名单 |

默认配置**不需要任何外部 AI 密钥**即可完整跑通（本地摘要 + 本地向量）。
摘要和 embedding 可以分别接不同服务，也可以一个都不接。

### 接入任意 OpenAI 兼容服务

`AI_PROVIDER=openai` 与 `openai-compatible` 等价，表示“任何兼容 Chat Completions 的服务”：
官方 OpenAI、OpenRouter、硅基流动等中转站、个人服务商、Ollama、vLLM、LM Studio 都用同一套配置，
只需换 `AI_BASE_URL` / `AI_MODEL` / `AI_API_KEY`。

```bash
AI_PROVIDER=openai-compatible
AI_API_KEY=sk-...
AI_BASE_URL=https://api.example.com/v1
AI_MODEL=your-model

# 可选：接口不是 /chat/completions、鉴权头不同、或需要额外头时再改
AI_CHAT_PATH=/chat/completions
AI_AUTH_HEADER=Authorization
AI_AUTH_PREFIX=Bearer          # 留空则直接发送 key
AI_EXTRA_HEADERS={"X-Title":"Xunji"}
AI_JSON_MODE=true              # 服务商不支持 response_format 时设为 false
AI_TIMEOUT_SECONDS=60
```

Embedding 同理；如果该服务不提供 `/embeddings`，保持 `EMBEDDING_PROVIDER=local` 即可。
`EMBEDDING_DIM` 必须与模型输出维度一致（如 `bge-m3` 为 1024），否则启动即报错。

常见地址：

| 服务 | `AI_BASE_URL` | 备注 |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | 官方 |
| OpenRouter | `https://openrouter.ai/api/v1` | 聚合多家模型，可加 `X-Title` 头 |
| 硅基流动等中转站 | 服务商文档提供 | 多为 OpenAI 兼容 |
| Ollama / vLLM / LM Studio | `http://localhost:11434/v1` 等 | 可无 API Key；Ollama 通常需 `AI_JSON_MODE=false` |
| OpenCode Go | `https://opencode.ai/inference/go/openai/v1` | 仅部分模型走 Chat Completions，且不提供 embeddings |

当前适配的是 OpenAI 的 **Chat Completions** 与 **Embeddings** 两种协议；
原生 Anthropic Messages、Gemini 等非兼容协议不在适配范围内。

API Key 只放 `backend/.env`（或部署平台的密钥配置），不要提交到 Git，也不会下发到浏览器。

## API（前缀 `/api/v1`，Bearer 认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/register` `/auth/login` `/auth/logout` | 注册 / 登录 / 登出 |
| GET | `/auth/me` | 当前用户 |
| POST | `/documents` | 保存链接（重复返回已有记录 `duplicate:true`） |
| GET | `/documents` | 列表：分页、来源/状态筛选、关键词、排序 |
| GET | `/documents/{id}` | 详情（元数据、摘要、关键词、正文） |
| DELETE | `/documents/{id}` | 删除（同时清理任务与索引） |
| POST | `/documents/{id}/reprocess` | 重新解析（幂等，复用排队中的任务） |
| GET | `/documents/{id}/status` | 处理状态轮询 |
| GET | `/documents/{id}/related` | 相关收藏 |
| POST | `/search` | 自然语言混合检索 |
| GET | `/health` | 健康检查（含数据库连通性） |

交互式文档：`http://localhost:8000/api/docs`。错误统一为 `{"error":{"code","message"}}`。

## 测试

```bash
cd backend
.venv/bin/python -m pytest -q          # 使用独立测试库 xunji_test，自动建库与迁移
```

覆盖：URL 规范化与去重、SSRF（内网/元数据/重定向/端口/超限响应）、认证与会话、
收藏 CRUD 与跨用户隔离、解析器（离线 HTML fixture）、切分、摘要与 Embedding、
任务队列（幂等入队/租约/退避重试/崩溃回收）、流水线端到端、混合检索与匹配原因。

## 安全与隐私

- **SSRF**：仅 http/https，拒绝 localhost/内网/链路本地/云元数据地址，DNS 解析结果逐 IP 校验，
  端口白名单，**每一跳重定向重新校验**，限制超时与响应体大小。
- **内容安全**：网页正文不执行脚本，前端不注入原始 HTML，Markdown 渲染禁用 raw HTML。
- **Prompt injection**：网页正文只作为待分析数据传给模型，不参与系统指令。
- **数据隔离**：所有查询按认证上下文里的 `user_id` 过滤，越权一律 404；Token 只存 SHA-256。
- **降级**：摘要服务失败时回退本地抽取式摘要并继续索引；Embedding 失败不丢正文与链接，任务退避重试后进入 `failed` 并可手动重新解析。

## 已知边界（MVP）

- 微信公众号文章受站点访问策略影响，可能只拿到标题/描述（状态 `partial`）或失败（`failed`），
  原始链接始终保留，可稍后「重新解析」。
- 视频来源（YouTube/B 站/X）只取公开元数据，不做字幕转录。
- 不绕过登录、付费墙或任何访问控制；不抓取需要授权的内容。
- 更换 Embedding 维度需要重建向量索引（迁移 + 重新解析）。
