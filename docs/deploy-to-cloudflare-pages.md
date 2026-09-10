# 部署迁移：GitHub Pages → Cloudflare Pages / Netlify

> 状态：迁移指南（文档）
> 目的：解决 GitHub Pages 上 **缓存仅 10 分钟** 与 **安全头不生效** 两个线上瓶颈（优化项 L1/L2）。

## 1. 为什么迁移

GitHub Pages 不支持 `_headers` 文件，实测线上响应头：

| 头                        | 线上实测值                                            | 期望值（迁移后由 `public/_headers` 生效）                                                 |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Cache-Control`           | `max-age=600`（10 分钟，每次回访重新下载全部 JS/CSS） | `public, max-age=600`（HTML）+ `public, max-age=31536000, immutable`（`/_next/static/*`） |
| `Content-Security-Policy` | 无                                                    | `_headers` 中已配置的完整 CSP                                                             |
| `X-Content-Type-Options`  | 无                                                    | `nosniff`                                                                                 |
| `X-Frame-Options`         | 无                                                    | `DENY`                                                                                    |
| `Referrer-Policy`         | 无                                                    | `strict-origin-when-cross-origin`                                                         |
| `Permissions-Policy`      | 无                                                    | 已配置（camera/mic/geolocation 全禁）                                                     |
| `Content-Encoding`        | gzip（**不支持 brotli**）                             | gzip + brotli（CF/Netlify 自动，再省 15-20%）                                             |

**收益量化**：静态资源从「每次回访重新下载 ~220-250KB gzip JS」变为「首访后一年内零下载」；重复访问加载速度显著提升；安全头覆盖全站。

**前提**：`public/_headers` 与 `public/_redirects` 均已存在且为 CF/Netlify 兼容格式，迁移后自动生效，**无需改文件内容**。

## 2. 路径策略（重要：Cloudflare Pages 不支持子路径）

> ⚠️ **2026-09 更正**：最初选了「方案 A 子路径零改码」，但 Cloudflare Pages **不支持子路径部署**
> （Git 集成的构建产物只能挂在根路径 `https://<project>.pages.dev/`）。若 basePath 仍为
> `/sanshui-blog`，页面里所有资源链接（`/_next/static/*`、`logo.svg`）都会 404。
> 实测症状：页面骨架能渲染，但 CSS/JS 全部 `ERR_ABORTED` + MIME 拒绝。

因此采用**环境变量双态**（代码已实现，2026-09）：

| 部署端                                  | 构建环境变量                                                       | basePath 效果                           |
| --------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| GitHub Pages（deploy.yml / 本地 build） | **不设**（默认）                                                   | `/sanshui-blog`（子路径，线上现状不变） |
| Cloudflare Pages（面板构建设置）        | `SITE_BASE_PATH=''` + `SITE_ORIGIN=https://sanshui-blog.pages.dev` | 根路径（无前缀）                        |

代码改动（已完成）：

1. `next.config.ts`：`BASE_PATH = process.env.SITE_BASE_PATH ?? (isBuild ? '/sanshui-blog' : '')`，basePath/assetPrefix 为空时不注入
2. `src/lib/site-config.mjs`：`SITE_ORIGIN` / `SITE_BASE_PATH` 支持环境变量覆盖（脚本侧 feed/og 图 URL 同步）
3. `scripts/gen-og-image.js`：og 图底部 URL 不再硬编码，改读 site-config
4. `src/app/sitemap.ts` / `robots.ts`：去硬编码 origin，改用 `siteConfig.url`

## 3. Cloudflare Pages 部署步骤（推荐）

### 3.1 平台接入（二选一）

> ✅ **已选定：方式 1 Git 集成（零配置）**（2026-09 决策）——不改 deploy.yml，现有 GitHub Pages 部署保留，灰度期双活。

**方式 1：Git 集成（零配置，✅ 已选定）**

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. 授权 GitHub，选择 `SanshuiBot/sanshui-blog` 仓库
3. **⚠️ 关键：Framework preset 必须选「无」**（不要选 Next.js！）
   - 选 Next.js 预设会自动套用 OpenNext 构建命令 `npx opennextjs-cloudflare build`，
     它要求 Next 的 `standalone` 输出（`.next/standalone/...`），而本项目是
     `output: 'export'` 纯静态导出（产物在 `out/`，无 standalone）→ 必然报
     `ENOENT ... .next/standalone/.next/server/pages-manifest.json`。
   - 请选 **Framework preset: None（不使用预设）**，再手动填下面的构建配置。
4. 构建配置（手动填写）：

| 项                        | 值                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Build command             | `npm run build`                                                                                     |
| Build output directory    | `out`                                                                                               |
| Node.js 版本              | 22（与现有 CI 一致；`npm ci` 需要 lockfile）                                                        |
| **Environment variables** | `SITE_BASE_PATH` = （**空字符串**，根路径部署）<br>`SITE_ORIGIN` = `https://sanshui-blog.pages.dev` |

> ⚠️ 这两个环境变量**必填**：CF Pages 不支持子路径，不设 `SITE_BASE_PATH=''` 时构建产物仍带
> `/sanshui-blog` 前缀 → 所有资源 404（本次踩坑根因）。`SITE_ORIGIN` 用于 feed.xml / og.png /
> sitemap / canonical 里的线上 URL。

5. 首次构建成功后访问站点，验证 `_headers` 生效（见 §5）。
6. 现有 `.github/workflows/deploy.yml`（GitHub Pages 端）**保持不变**：`main` 分支 push 时两边同时构建，灰度期两边都能访问；旧端下线时机见 §6。

**方式 2：GitHub Actions（保留 CI 门禁链路）**

若希望部署仍走 `deploy.yml` 的质量门禁（typecheck/lint/test + 构建），可新增一个 workflow（或改造现有）：

```yaml
# .github/workflows/deploy-cf.yml（示例；保留原 deploy.yml 或删除其一）
name: Deploy to Cloudflare Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: 'cf-pages'
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: '22'
          cache: 'npm'
      - run: sudo apt-get update && sudo apt-get install -y fonts-noto-cjk fonts-noto-color-emoji
      - run: npm ci
      # 质量门禁（与约定 #45 一致：lint/test if: always()）
      - run: npm run typecheck
      - run: npm run lint
        if: always()
      - run: npm run test
        if: always()
      - run: npm run build
      # 缓存 Next 构建（actions/cache 最新标签 v4）
      - uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('content/**') }}
          restore-keys: |
            nextjs-${{ runner.os }}-
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy out --project-name=sanshui-blog
```

仓库需配置两个 Secrets：`CLOUDFLARE_API_TOKEN`（Pages:Edit 权限）、`CLOUDFLARE_ACCOUNT_ID`。

### 3.2 自定义域名（可选）

> ✅ **已决策：不绑定自定义域**（2026-09）——直接使用 Cloudflare Pages 默认子域。
> 根路径部署后访问地址为 **`https://sanshui-blog.pages.dev/`**（不再带 `/sanshui-blog` 子路径）。
> 省去 DNS 配置，迁移更快。

如未来想绑自定义域：Dashboard → 项目 → Custom domains → 添加域名，按提示配置 DNS（Cloudflare 代理可顺便获得 CDN + 自动 HTTPS）。

## 4. Netlify 部署步骤（备选）

1. Netlify → Add new site → Import an existing project → 选择仓库
2. 配置：

| 项                | 值              |
| ----------------- | --------------- |
| Build command     | `npm run build` |
| Publish directory | `out`           |
| Node.js 版本      | 22              |

3. `_headers` / `_redirects` 同样原生支持，构建后自动生效。
4. 自定义域名：Site settings → Domain management → Add custom domain。

## 5. 迁移后验证清单

> 线上访问地址（根路径 + 不绑自定义域）：`https://sanshui-blog.pages.dev/`

```bash
# 1. 安全头（应看到完整 CSP 等）
curl -sI https://sanshui-blog.pages.dev/ | grep -iE 'content-security|x-content-type|x-frame|referrer|permissions'

# 2. 静态资源长缓存
curl -sI https://sanshui-blog.pages.dev/_next/static/chunks/<某js> | grep -i cache-control
# 期望: public, max-age=31536000, immutable

# 3. 压缩编码（应出现 br 或 gzip）
curl -sI -H 'Accept-Encoding: br, gzip' https://sanshui-blog.pages.dev/ | grep -i content-encoding

# 4. 页面与资源
#    - 首页/归档/标签/关于/项目/友链 均可访问，路由带尾斜杠（trailingSlash）
#    - /feed.xml、/posts-index.json、/og.png 200
#    - 文章页代码高亮正常（语言白名单裁剪后 21 种全覆盖）
#    - Giscus 评论正常（og:title 关联不变，评论不丢失）
```

**评论关联注意**：Giscus 按文章 `og:title` 关联，迁移不改文章标题，**评论不会失联**；仅当同时改了文章标题才需要先改 Discussions（见 AGENTS.md「内容编辑」）。

## 6. 回滚

> ✅ **已决策：GitHub Pages 与 Cloudflare 双端长期共存**（2026-09）——不下线旧端，`main` push 时两端各自构建部署，互为备份；CF 端出问题可随时切回旧 URL，无回滚成本。

- 代码层面：迁移不修改任何线上行为相关的源码（方案 A 零改动），`git revert` 即可回到纯 GitHub Pages 形态。
- 平台层面：GitHub Pages 部署（原 `deploy.yml`）始终保留运行，访问旧 URL 即回滚，无空窗。

## 7. 决策清单

| #   | 决策     | 选项                                                  | 状态                                                                                  |
| --- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | 平台     | Cloudflare Pages（推荐）/ Netlify                     | ✅ **已选 Cloudflare Pages**                                                          |
| 2   | 路径     | ~~A 子路径（零改码）~~ / **B 根路径（环境变量双态）** | ✅ **已选根路径**（CF 不支持子路径；`SITE_BASE_PATH=''` + `SITE_ORIGIN`，代码已实现） |
| 3   | 部署方式 | Git 集成（零配置）/ Actions + Wrangler（保留门禁）    | ✅ **已选 Git 集成（deploy.yml 不动，旧端保留）**                                     |
| 4   | 域名     | 保持 pages.dev 子域 / 绑定自定义域                    | ✅ **已选默认 pages.dev 子域（不绑自定义域）**                                        |
| 5   | 旧端下线 | 灰度后停用 GitHub Pages                               | ✅ **已选双端长期共存（GitHub Pages 与 Cloudflare 同时存在）**                        |
