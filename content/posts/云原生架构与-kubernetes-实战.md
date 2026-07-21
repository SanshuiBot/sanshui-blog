---
title: 云原生架构与 Kubernetes 实战：从 Pod 到 Service Mesh
date: 2026-07-21
tags: [云原生, Kubernetes, 后端]
excerpt: 一篇文章带你走完云原生的完整路径：容器化、K8s 核心对象、控制器、网络、存储，最后落地 Service Mesh。
---

# 云原生架构与 Kubernetes 实战：从 Pod 到 Service Mesh

"云原生（Cloud Native）"这个词从 2013 年被提出，到现在已经变成了所有中大型公司的默认架构。但很多人对它的理解还停留在"用 Docker 打包、用 K8s 部署"。这篇文章会带你从零开始，理解云原生的完整技术栈，并给出可以直接在生产中使用的实战配置。

## 一、什么是云原生？

云原生不是某项具体技术，而是一整套**构建和运行弹性、可观测、松耦合应用**的方法论。CNCF（Cloud Native Computing Foundation）给出的定义包含四大支柱：

1. **容器化**：应用与依赖一起打包
2. **微服务**：应用按业务能力拆分
3. **动态调度**：Kubernetes 这类编排系统按需分配资源
4. **DevOps + 持续交付**：自动化流水线

云原生的本质是**让应用从"为某台服务器写"变成"为云平台写"**。这意味着应用要假设：网络不可靠、磁盘会丢、实例随时会被杀掉。

## 二、容器化的真正细节

### 2.1 Docker 镜像分层

Docker 镜像由多层只读文件系统叠加而成。每一层对应一个 Dockerfile 指令：

```dockerfile
# 基础层：精简的 Linux 发行版
FROM node:20-alpine

# 依赖层：单独 COPY package*.json + npm ci，最大化缓存命中
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 源码层：变化最频繁的放最后
COPY . .

# 运行层
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**关键优化**：

- 把变化少的指令放前面（基础镜像、依赖安装）
- 把变化多的指令放后面（源码复制）
- 用 `.dockerignore` 排除 `node_modules`、`.git`、`*.log`

### 2.2 多阶段构建：最终镜像只留运行时

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段：更小、更安全
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

最终镜像不含 TypeScript 源码、devDependencies、构建工具，体积可以从 1.5GB 压到 200MB。

### 2.3 容器运行时不止 Docker

Docker 在 2017 年后逐步被替代：

- **containerd**：CNCF 毕业项目，K8s 默认运行时
- **CRI-O**：Red Hat 主推，专为 K8s 设计
- **runc**：底层 OCI 运行时，containerd 和 CRI-O 都基于它

K8s 1.24 起正式移除 dockershim，Docker 不再被原生支持。但生产中常用 `nerdctl` 或 `podman` 替代 docker CLI。

## 三、Kubernetes 核心对象

### 3.1 Pod：最小调度单元

Pod 不是容器——它是**一组共享网络和存储的容器**。为什么要把多个容器放一个 Pod？典型场景是 sidecar 模式：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
    - name: app
      image: myapp:v1.2.3
      ports:
        - containerPort: 3000
      resources:
        requests: { cpu: '100m', memory: '128Mi' }
        limits: { cpu: '500m', memory: '512Mi' }
    - name: log-collector
      image: fluent-bit:3.0
      # 这个 sidecar 抓取 app 容器的日志并转发到 ELK
```

**资源配额的黄金法则**：

- `requests` 是调度依据，必须反映真实最小需求
- `limits` 是硬上限，超过会被 OOMKilled（内存）或 throttle（CPU）
- **limits 一定要比 requests 大**，给突发流量留余地
- CPU 用毫核（`100m` = 0.1 核），内存用 Mi/Gi

### 3.2 Deployment：声明式滚动更新

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 滚动时最多多出 1 个 Pod
      maxUnavailable: 0  # 滚动期间不允许任何 Pod 不可用
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api
          image: registry.example.com/api:v2.1.0
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 30
```

**三个关键概念**：

| 探针 | 作用 | 失败结果 |
|------|------|---------|
| `livenessProbe` | 容器是否"活着" | 重启容器 |
| `readinessProbe` | 容器是否"准备好接流量" | 从 Service 端点移除 |
| `startupProbe` | 容器是否"启动完成"（JVM 这类慢启动用） | 启动期间禁用上面两个探针 |

### 3.3 Service：稳定的网络端点

Pod 的 IP 是易变的。Service 通过 selector + ClusterIP 提供稳定的访问入口。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server
spec:
  type: ClusterIP  # 默认值，只集群内可达
  selector:
    app: api-server
  ports:
    - port: 80         # Service 监听的端口
      targetPort: 3000 # Pod 的端口
```

**Service 类型对比**：

- `ClusterIP`：集群内部访问，默认
- `NodePort`：在所有节点上开一个 30000-32767 的端口，外部可访问
- `LoadBalancer`：调用云厂商 LB API 创建一个公网 LB
- `ExternalName`：DNS CNAME 到外部域名

### 3.4 Ingress：HTTP 七层路由

Service 是四层（TCP/UDP）。要做域名路由、TLS 终结、路径转发，就要用 Ingress：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: blog-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  ingressClassName: nginx
  tls:
    - hosts: [blog.example.com]
      secretName: blog-tls
  rules:
    - host: blog.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: blog-frontend
                port: { number: 80 }
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-server
                port: { number: 80 }
```

常用 Ingress Controller：nginx-ingress（最常见）、Traefik、Istio Gateway、Envoy Gateway。

## 四、存储：Volume、PV、PVC、StorageClass

容器磁盘是 ephemeral 的——Pod 重启数据就没了。K8s 提供了一整套持久化抽象：

```
应用 ──PVC──> PV <──StorageClass──> 真实存储（云盘、NFS、Ceph）
```

### 4.1 动态供给的 PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: fast-ssd  # 由管理员预先创建
  resources:
    requests:
      storage: 50Gi
```

`accessModes` 的含义：

- `ReadWriteOnce`（RWO）：单节点读写，最常用
- `ReadOnlyMany`（ROX）：多节点只读
- `ReadWriteMany`（RWX）：多节点读写，需要 NFS/CephFS 这类共享存储

### 4.2 StatefulSet：有状态应用的标配

Deployment 假设 Pod 是无状态、可互换的。但数据库不是——每个副本有独立数据、稳定网络标识、有序启停。

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:  # 每个 Pod 自动生成一个 PVC
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 50Gi
```

StatefulSet 的 Pod 命名是 `postgres-0`、`postgres-1`、`postgres-2`，**稳定且有序**，非常适合主从架构。

## 五、ConfigMap 与 Secret：配置与敏感数据

### 5.1 ConfigMap：非敏感配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: info
  RATE_LIMIT: '100'
  config.yaml: |
    database:
      host: postgres.default.svc
      port: 5432
```

### 5.2 Secret：敏感数据

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  POSTGRES_PASSWORD: cGFzc3dvcmQxMjM=  # base64 编码
```

**安全提示**：默认 Secret 在 etcd 中只是 base64 编码，不是加密。生产环境必须：

- 开启 [Encryption at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)
- 用 IRSA（AWS）或 Workload Identity（GCP）替代长生命周期的 ServiceAccount token
- 部署 External Secrets Operator，从 Vault/AWS Secrets Manager 拉取

## 六、HPA、VPA 与集群自动扩缩

### 6.1 HPA：水平 Pod 自动扩缩

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5 分钟内不再缩容
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

**HPA 调优要点**：

- `stabilizationWindowSeconds` 防止"抖动"——流量脉冲时不要立刻缩容
- CPU 利用率基于 `requests`，如果 requests 设错，HPA 也就错了
- 用 Prometheus Adapter 接入业务指标（QPS、队列长度）做扩缩判断

### 6.2 Cluster Autoscaler

HPA 只能加 Pod，但如果节点资源不够，Pod 会一直 Pending。Cluster Autoscaler 监测 Pending Pod，调用云 API 加节点；空闲时缩容。

**注意**：CA 不会主动驱逐 Pod 来缩容，只会在 Pod 自然结束、节点空闲时回收。

## 七、可观测性三大件：Metrics、Logs、Traces

### 7.1 Metrics：Prometheus + Grafana

```yaml
# ServiceMonitor 让 Prometheus 自动抓取 Pod 指标
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-monitor
spec:
  selector:
    matchLabels:
      app: api-server
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

应用层用 [prom-client](https://github.com/siimon/prom-client) 暴露 RED 指标（Rate、Errors、Duration）：

```typescript
import { Counter, Histogram, Registry } from 'prom-client';

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],  // 业务相关
});
```

### 7.2 Logs：Loki 或 ELK

容器日志收集有两种主流方案：

1. **DaemonSet 方案**（Fluent Bit）：每个节点一个 agent，从 `/var/log/containers/` 读取
2. **Sidecar 方案**：每个 Pod 一个日志 sidecar

DaemonSet 更省资源，是默认选择。Sidecar 仅在需要精细控制每个 Pod 的日志管道时使用。

**结构化日志**：

```typescript
import pino from 'pino';
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info({ userId: 123, action: 'login' }, 'user logged in');
// 输出：{"level":"info","time":1722470400000,"userId":123,"action":"login","msg":"user logged in"}
```

### 7.3 Traces：OpenTelemetry + Jaeger

```typescript
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('api-server');

async function handleRequest(req, res) {
  return tracer.startActiveSpan('handleRequest', async (span) => {
    try {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);

      const user = await fetchUser(req.userId);
      const data = await queryDB(user.id);

      res.json(data);
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

**可观测性黄金法则**：

- Logs、Metrics、Traces 必须有统一的 `trace_id` 字段，才能跨系统串联
- Sampling 策略要在 SDK 层决定，不要等到 Collector
- 业务事件用 [Span Events](https://opentelemetry.io/docs/concepts/signals/traces/#events) 记录，不要滥用 logs

## 八、Service Mesh：Istio 与 Linkerd

当微服务数量超过 10 个，以下问题会指数级恶化：

- mTLS 双向认证：每对服务都要配证书
- 流量治理：重试、超时、熔断、限流
- 可观测性：每个服务的 RED 指标如何统一收集
- 金丝雀发布：5% 流量到新版本怎么实现

Service Mesh 的解决方案是**把所有这些能力从应用代码下沉到 sidecar**（Envoy）。

### 8.1 Istio 的 VirtualService + DestinationRule

```yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: api-canary
spec:
  hosts: [api-server]
  http:
    - match:
        - headers:
            x-canary:
              exact: 'true'
      route:
        - destination:
            host: api-server
            subset: v2
    - route:
        - destination:
            host: api-server
            subset: v1
          weight: 95
        - destination:
            host: api-server
            subset: v2
          weight: 5
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: api-dr
spec:
  host: api-server
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

这段配置实现：
- 带 `x-canary: true` 头的请求全走 v2
- 其他流量按 95:5 分配到 v1/v2
- 5xx 错误连续 5 次后，对应 Pod 被弹出 30 秒

### 8.2 Sidecar 的代价

- **资源开销**：每个 Pod 多 100MB 内存 + 0.1 CPU
- **延迟**：即使旁路，额外一跳也增加 1-2ms
- **运维复杂度**：Istio 有 50+ CRD，学习曲线陡峭

如果你的服务数量 < 5，**不要上 Mesh**，用 K8s 原生能力 + 应用内 SDK 就够。

## 九、GitOps：ArgoCD 与 Flux

声明式配置的自然延伸是 **GitOps**：把集群状态全部存在 Git 仓库，由工具自动同步到集群。

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-server
spec:
  source:
    repoURL: https://github.com/org/k8s-manifests
    path: production/api-server
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**GitOps 的核心原则**：

1. 一切声明式描述必须存 Git
2. Git 是唯一可信源（Source of Truth）
3. 任何对集群的手动 `kubectl apply` 都是 anti-pattern

## 十、生产环境检查清单

最后给你一份上生产前必看的清单：

### 10.1 应用层

- [ ] 健康检查接口 `/health` 返回 200，包含依赖项状态
- [ ] 优雅停机：监听 SIGTERM，停止接收新请求、等待在途请求
- [ ] 配置全部来自环境变量或 ConfigMap，没有硬编码
- [ ] 日志结构化输出，不写 stdout 之外的地方
- [ ] OpenTelemetry SDK 已集成，traceparent 透传

### 10.2 K8s 层

- [ ] 所有 Deployment 都设置了 `resources.requests` 和 `limits`
- [ ] readinessProbe 和 livenessProbe 分开配置
- [ ] PodDisruptionBudget 保证至少 minAvailable 个 Pod
- [ ] NetworkPolicy 限制 Pod 间只能按需访问
- [ ] 所有 Ingress 配置 TLS，用 cert-manager 自动续期

### 10.3 可观测性

- [ ] Prometheus 抓取 RED 三件套指标
- [ ] Grafana 有四块看板：Service、Pod、Node、SLI
- [ ] Alertmanager 配置分级告警（warning、critical）
- [ ] 日志保留 30 天，超过自动归档
- [ ] 关键链路采样率 > 1%

## 结语

云原生的学习曲线陡峭，但它的价值也是实实在在的：资源利用率提升 30-50%、故障恢复时间从小时降到分钟、版本发布频率从月级到日级。

记住一个原则：**技术选型要匹配组织规模**。3 个人的团队搞一套完整的 Istio + ArgoCD + Prometheus Stack 是灾难；300 个人的团队不上这些东西就是低效。云原生是工具，不是目的。

> 下一篇预告：《区块链与智能合约开发入门：从 Solidity 到 DeFi》
