---
title: Docker 多阶段构建与 BuildKit 缓存优化
date: 2026-07-30
tags: [Docker, DevOps, 后端, 技术]
excerpt: 一个 Go 服务镜像从 1.2GB 优化到 18MB，构建时间从 180s 降到 25s。本文讲多阶段构建、distroless / scratch 基础镜像、BuildKit cache mount、Buildx 多架构构建。
---

# Docker 多阶段构建与 BuildKit 缓存优化

线上一个 Go 微服务，Docker 镜像 1.2GB，CI 构建要 3 分钟。优化后镜像降到 18MB，构建 25 秒。这篇文章记录完整链路。

## 一、为什么镜像这么大

传统的 Dockerfile：

```dockerfile
FROM golang:1.22

WORKDIR /app
COPY . .
RUN go build -o myservice .

CMD ["./myservice"]
```

问题：

1. 基础镜像 `golang:1.22` 是 850MB（包含完整 Go 工具链、Linux 发行版）
2. `COPY . .` 把所有源码、依赖、测试数据都复制进去
3. build 产物 + 源码都在最终镜像里
4. 没用 `.dockerignore`，`.git`、`node_modules` 全被复制

## 二、多阶段构建：分离构建环境与运行环境

```dockerfile
# 阶段 1：构建
FROM golang:1.22 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o myservice .

# 阶段 2：运行
FROM gcr.io/distroless/static-debian12

COPY --from=builder /app/myservice /myservice

EXPOSE 8080
CMD ["/myservice"]
```

**关键优化**：

1. **`COPY go.mod go.sum` 先于 `COPY . .`**：依赖未变时，`go mod download` 缓存命中
2. **`CGO_ENABLED=0`**：纯静态二进制，不需要 glibc
3. **`-ldflags="-s -w"`**：去除调试符号，二进制减小 30%
4. **`distroless/static`**：只有 ca-certificates 和 timezone，无 shell、无包管理器

镜像大小：1.2GB → 25MB（distroless 7MB + 二进制 18MB）。

## 三、distroless vs scratch vs alpine

| 基础镜像            | 大小  | 适合场景               | 限制                 |
| ------------------- | ----- | ---------------------- | -------------------- |
| `scratch`           | 0 MB  | 静态二进制 + 自带 CA   | 无 shell，调试困难   |
| `distroless/static` | 2 MB  | Go / Rust 静态二进制   | 无 shell，无包管理器 |
| `distroless/base`   | 20 MB | C/C++ 动态链接二进制   | 需要 glibc           |
| `alpine`            | 5 MB  | 动态二进制 + musl libc | musl 与 glibc 不兼容 |
| `ubuntu:22.04`      | 80 MB | 通用场景               | 大                   |

**生产推荐**：`distroless/static-debian12`，安全且小。

## 四、踩坑 1：CGO_ENABLED=1 的场景

如果 Go 代码用了 sqlite3、net 包等需要 CGO 的库：

```dockerfile
# ❌ CGO_ENABLED=0 时 net 包 DNS 解析行为改变，可能慢
RUN CGO_ENABLED=0 go build ...

# ✅ 用 distroless/base（含 glibc）
FROM gcr.io/distroless/base-debian12
```

## 五、BuildKit 缓存优化

### 启用 BuildKit

```bash
# 临时
DOCKER_BUILDKIT=1 docker build .

# 永久（/etc/docker/daemon.json）
{
  "features": { "buildkit": true }
}
```

### Cache Mount：跨构建复用依赖缓存

```dockerfile
# syntax=docker/dockerfile:1.6

FROM golang:1.22 AS builder

WORKDIR /app
COPY go.mod go.sum ./

# Go module 缓存
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o myservice .
```

**关键点**：

1. **`--mount=type=cache,target=...`**：把缓存目录挂载到构建层
2. **缓存与构建层解耦**：缓存更新不影响构建层 hash
3. **跨构建复用**：第二次构建时 `go mod download` 直接命中缓存

### npm 缓存示例

```dockerfile
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

## 六、踩坑 2：cache mount 不共享给 build stage

```dockerfile
# ❌ 阶段 1 的 cache mount 在阶段 2 看不到
FROM golang:1.22 AS builder
RUN --mount=type=cache,target=/go/pkg/mod go mod download

FROM golang:1.22 AS tester
RUN --mount=type=cache,target=/go/pkg/mod go test ./...
# 这里 cache mount 是独立的，不会复用 builder 的
```

**修复**：用 `id` 显式共享：

```dockerfile
RUN --mount=type=cache,id=gomod,target=/go/pkg/mod ...
```

## 七、踩坑 3：cache mount 与 CI 并行构建冲突

GitLab CI / GitHub Actions 中多个 job 并行构建，cache mount 共享时可能冲突。

**修复**：每个 job 用独立 cache key：

```dockerfile
RUN --mount=type=cache,id=gomod-${CI_JOB_ID},target=/go/pkg/mod ...
```

或用 Buildx 的 `--cache-from` / `--cache-to` 推到 registry：

```bash
docker buildx build \
  --cache-from type=registry,ref=myrepo/cache \
  --cache-to type=registry,ref=myrepo/cache,mode=max \
  -t myrepo/app:v1 .
```

## 八、Secret Mount：安全传递凭证

传统方式：

```dockerfile
# ❌ npm token 泄露到 image layer
ARG NPM_TOKEN
RUN npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}
RUN npm ci
```

BuildKit 方式：

```dockerfile
# syntax=docker/dockerfile:1.6

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=$HOME/.npmrc .
```

Secret 不会进入 image layer，也不会出现在 build history。

## 九、SSH Mount：拉私有 Git 仓库

```dockerfile
# syntax=docker/dockerfile:1.6

FROM golang:1.22 AS builder

RUN --mount=type=ssh \
    GOPRIVATE=github.com/myorg/* \
    go mod download
```

```bash
docker build --ssh default=$SSH_AUTH_SOCK .
```

## 十、多架构构建：Buildx

```bash
# 创建 buildx builder
docker buildx create --name multiarch --use

# 同时构建 amd64 + arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myrepo/app:v1 \
  --push .
```

**关键**：Dockerfile 必须用 `TARGETARCH` 自动选择架构：

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.22 AS builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64

RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build ...
```

## 十一、踩坑 4：Alpine 镜像 DNS 解析慢

```dockerfile
FROM alpine:3.18
RUN apk add --no-cache curl
```

Alpine 用 musl libc，DNS 解析行为与 glibc 不同。某些场景下 DNS 解析会超时。

**修复**：用 `distroless` 替代 `alpine`，或在 alpine 里装 glibc 兼容层。

## 十二、踩坑 5：层数过多导致镜像变大

```dockerfile
# ❌ 每条 RUN 一层
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ✅ 合并 RUN
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
```

**关键**：`rm -rf` 必须与 `install` 在同一 RUN，否则 install 的文件依然在前面的层里。

## 十三、.dockerignore 必备

```
.git
.gitignore
node_modules
dist
build
*.log
.env
.vscode
.idea
coverage
test
__tests__
docs
README.md
Dockerfile
.dockerignore
```

没有 `.dockerignore`，`COPY . .` 会把 `.git`（几百 MB）、`node_modules`（几百 MB）全复制进去。

## 十四、实战案例：完整优化 Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.6

# === 阶段 1：构建 ===
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64

WORKDIR /app

# 先复制依赖描述，利用 layer 缓存
COPY go.mod go.sum ./

# 用 cache mount 加速依赖下载
RUN --mount=type=cache,id=gomod,target=/go/pkg/mod \
    --mount=type=cache,id=gobuild,target=/root/.cache/go-build \
    go mod download

# 复制源码
COPY . .

# 静态构建
RUN --mount=type=cache,id=gomod,target=/go/pkg/mod \
    --mount=type=cache,id=gobuild,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -ldflags="-s -w" -trimpath -o /myservice .

# === 阶段 2：运行 ===
FROM gcr.io/distroless/static-debian12

# 非 root 用户
USER nonroot:nonroot

WORKDIR /app
COPY --from=builder --chown=nonroot:nonroot /myservice /myservice

EXPOSE 8080
ENTRYPOINT ["/myservice"]
```

**优化效果**：

| 指标               | 优化前 | 优化后 |
| ------------------ | ------ | ------ |
| 镜像大小           | 1.2 GB | 18 MB  |
| 构建时间（无缓存） | 180 s  | 90 s   |
| 构建时间（有缓存） | 90 s   | 25 s   |
| 安全漏洞           | 47 个  | 0 个   |

## 十五、CI/CD 集成

### GitHub Actions

```yaml
name: Build and Push

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

`cache-from: type=gha` 用 GitHub Actions 缓存，比 registry cache 快。

## 十六、镜像扫描

构建后用 Trivy 或 Grype 扫描：

```bash
# Trivy
trivy image myrepo/app:v1 --severity HIGH,CRITICAL --exit-code 1

# Grype
grype myrepo/app:v1 --fail-on high
```

CI 中加扫描步骤，发现高危漏洞自动 fail。

## 十七、总结

镜像优化的 7 条原则：

1. **多阶段构建**：build 环境 ≠ 运行环境
2. **distroless 基础镜像**：最小化攻击面
3. **Cache Mount 加速依赖下载**
4. **Secret Mount 安全传递凭证**
5. **合并 RUN，减少层数**
6. **`.dockerignore` 必备**
7. **Buildx 多架构构建**

投入一次优化，CI 时间从 3 分钟降到 25 秒，镜像大小从 1.2GB 降到 18MB。性价比极高。
