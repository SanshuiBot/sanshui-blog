---
title: etcd 与 Zookeeper 一致性算法对比：Raft vs ZAB
date: 2026-07-29
tags: [分布式, 后端, etcd, Zookeeper, 技术]
excerpt: 同样是 CP 系统，etcd 用 Raft，Zookeeper 用 ZAB。本文讲两种算法的差异、leader 选举、日志复制、安全性证明，再到生产选型建议。
---

# etcd 与 Zookeeper 一致性算法对比：Raft vs ZAB

公司同时维护两套分布式协调系统：Kubernetes 用 etcd，Kafka 用 Zookeeper。两套系统的设计哲学完全不同——etcd 选 Raft 简单可理解，Zookeeper 选 ZAB 优化读写分离。这篇文章系统对比两种算法。

## 一、两种算法的根本差异

| 维度 | Raft (etcd) | ZAB (Zookeeper) |
| --- | --- | --- |
| 主轴 | 日志复制 | 原子广播 |
| leader 选举 | 随机超时 + term | epoch + 三阶段 |
| 日志顺序 | 强一致索引 | ZXID 单调递增 |
| 成员变更 | 联合一致 | 重配置 |
| 易理解性 | 高 | 中 |

**核心共识**：两者都是 **CP 系统**（强一致性 + 分区容错），都通过 leader-based 协议保证所有副本状态一致。

## 二、Raft 的核心机制

### 1. 三种角色

```
Follower —— 普通节点，被动接收 leader 请求
Candidate —— 选举中，竞选 leader
Leader    —— 主节点，处理所有写入
```

### 2. Term（任期）

```
Term 1: Leader A
        ↓ A 宕机
Term 2: 选举超时，B 竞选
        B 拿到多数票，成为 Leader
        ↓
Term 3: B 宕机，C 竞选 ...
```

**Term 是单调递增的逻辑时钟**。每次选举开启新 term。所有 RPC 请求都带 term，过期 term 的请求被拒绝。

### 3. Leader 选举

```go
// 每个 follower 有随机选举超时（150-300ms）
// 超时未收到 leader 心跳，转为 candidate

func (r *raft) startElection() {
    r.currentTerm++
    r.state = Candidate
    r.votedFor = r.id

    // 向所有节点发 RequestVote
    votes := 1  // 自己一票
    for _, peer := range r.peers {
        resp := peer.RequestVote(r.currentTerm, r.lastLogIndex, r.lastLogTerm)
        if resp.VoteGranted {
            votes++
        }
    }

    if votes > len(r.peers)/2 {
        r.becomeLeader()
    }
}
```

**关键约束**：

1. **多数派**：必须拿到 > N/2 票才能当选
2. **log 完整性**：投票前检查候选人的 log 是否比自己新

```go
// 候选人的 log 至少要和自己一样新
func (r *raft) isLogUpToDate(candidateLastLogIndex, candidateLastLogTerm int) bool {
    myLastTerm := r.logs[r.lastLogIndex].Term
    if candidateLastLogTerm != myLastTerm {
        return candidateLastLogTerm > myLastTerm
    }
    return candidateLastLogIndex >= r.lastLogIndex
}
```

### 4. 日志复制

```
Client → Leader: SET x = 5
Leader:
  1. 写本地 log (uncommitted)
  2. 并行 AppendEntries RPC 给所有 follower
  3. 收到多数派 ack → commit
  4. 应用到状态机
  5. 响应 client
```

**关键**：**commit 必须 > N/2 副本 ack**，否则不能 commit。这是 Raft 安全性的核心。

### 5. 心跳维持 leadership

```go
// Leader 每隔 50ms 发一次心跳
func (r *raft) heartbeat() {
    for r.state == Leader {
        r.broadcastAppendEntries()
        time.Sleep(50 * time.Millisecond)
    }
}
```

如果 follower 超过 election timeout 没收到心跳，会触发选举。

## 三、ZAB 的核心机制

### 1. 四种状态

```
LOOKING     —— 正在选举 leader
FOLLOWING   —— 跟随者
LEADING     —— 领导者
OBSERVING   —— 观察者（不参与投票）
```

### 2. 三阶段选举

```
Phase 1: Discovery
  - 各节点交换自己的 epoch
  - 选出最大的 epoch + 适合的 leader

Phase 2: Synchronization
  - follower 与 leader 同步历史事务
  - 类似 Raft 的 log 复制

Phase 3: Broadcast
  - leader 接受 client 请求，广播给 follower
  - 多数派 ack 后 commit
```

### 3. ZXID：单调递增的全局 ID

```
ZXID = (epoch << 32) | counter
```

**epoch**：每次 leader 切换递增，类似 Raft 的 term
**counter**：每个事务递增

ZXID 保证：

1. 同一 leader 任期内事务顺序明确（counter）
2. 不同 leader 任期可比较（epoch）

### 4. 原子广播（Atomic Broadcast）

```
Client → Leader: create /node
Leader:
  1. 分配 ZXID
  2. 发 Proposal 给所有 follower
  3. follower 写本地事务日志，ack
  4. leader 收到多数派 ack → commit
  5. leader 发 COMMIT 给 follower
  6. 应用到内存数据库
```

**与 Raft 的差异**：

1. ZAB 显式区分 Proposal / ACK / COMMIT 三个阶段
2. Raft 把这三个阶段压缩到 AppendEntries + Response

## 四、安全性对比

### Raft 的 Leader Completeness

> 如果一条日志在某个 term 被 commit，那么所有更高 term 的 leader 都包含这条日志。

证明思路：

1. 一个 entry 被 commit，意味着 > N/2 节点复制了它
2. 新 leader 必须拿到 > N/2 票
3. 投票的节点中至少有一个包含已 commit 的 entry
4. Raft 的投票规则保证「投票者 log >= 候选人 log」时才投票

**结论**：Raft 保证所有 committed entry 不会丢失。

### ZAB 的 Leader Completeness

ZAB 用 ZXID 保证新 leader 的 log 包含所有已 commit 事务：

1. 新 leader 的 epoch > 旧 leader
2. 新 leader 必须拿到多数派投票
3. 投票节点的 ZXID 不超过新 leader

**结论**：ZAB 同样保证 committed 事务不丢失。

## 五、性能对比

| 指标 | Raft (etcd) | ZAB (Zookeeper) |
| --- | --- | --- |
| 写入吞吐 | 高 | 中 |
| 读取延迟 | 中（leader only） | 低（follower 可读） |
| 选举速度 | 慢（150-300ms） | 快（50-200ms） |
| 故障恢复 | 5-10s | 2-5s |

**Zookeeper 的优势**：

1. **follower 可读**：读请求不需要经过 leader
2. **watch 机制**：客户端可以监听 znode 变化
3. **临时节点**：session 结束自动删除

**etcd 的优势**：

1. **MVCC**：支持事务和版本历史
2. **租约（lease）**：比临时节点更灵活
3. **HTTP/gRPC API**：比 ZK 的私有协议更开放

## 六、Raft 实现踩坑：split brain

### 场景

1. 5 节点集群
2. 网络分区为 (A, B) 和 (C, D, E)
3. (C, D, E) 多数派，选出新 leader
4. (A, B) 少数派，老 leader 继续接受写入
5. (A, B) 的写入无法 commit（多数派不在）
6. 网络恢复，老 leader 发现更高 term，降级

### 副作用

老 leader 在分区期间接收的写入请求会**一直阻塞**（无法 commit），直到网络恢复或超时。

**修复**：

1. 客户端设置合理 timeout（5s）
2. 客户端重试时带 request id，避免重复写入

## 七、ZAB 踩坑：写瓶颈在 leader

### 场景

Zookeeper 所有写请求必须经过 leader。当写 QPS 高时，leader CPU 打满。

**修复**：

1. **读写分离**：follower 承担读，leader 只写
2. **批量提交**：多个 Proposal 合并为一个 commit
3. **Observer 节点**：跨机房部署 observer，分担读流量

```java
// 客户端连接 follower
ZooKeeper zk = new ZooKeeper("follower1:2181", 30000, watcher);
```

## 八、实战案例：etcd 集群 OOM

### 故障

Kubernetes 集群 etcd OOM 重启，导致 API server 不可用 30 秒。

### 排查

```bash
# etcd 指标
etcdctl endpoint status --write-out=table

# 关键指标
etcd_mvcc_db_total_size_bytes  # DB 大小
etcd_debugging_mvcc_keys_total # key 数量
```

发现：

- DB 大小 8GB（超过默认 2GB quota）
- key 数量 1000 万
- watch callback 积压

### 修复

1. **压缩历史版本**：

```bash
etcdctl compact $(etcdctl endpoint status -w json | jq -r '.[0].Status.header.revision')
etcdctl defrag
```

2. **自动压缩配置**：

```yaml
# etcd 启动参数
--auto-compaction-retention=1  # 保留 1 小时
--auto-compaction-mode=periodic
--quota-backend-bytes=8589934592  # 8GB
```

3. **定期 defrag**：

```bash
# Cron job
0 3 * * * etcdctl defrag --command-timeout=30s
```

## 九、选型决策

| 场景 | 推荐 |
| --- | --- |
| Kubernetes 集群 | etcd |
| Kafka 集群 | Zookeeper（或 KRaft 替代） |
| 微服务配置中心 | etcd / Apollo |
| 分布式锁 | Zookeeper（金融）/ etcd |
| 服务发现 | etcd / Consul |

## 十、Raft vs ZAB：选哪个？

**简单性优先**：Raft。它的设计目标就是「比 Paxos 更易理解」，论文有 20+ 页专门讲可理解性。

**读写分离需求**：ZAB。Zookeeper 的 follower-read 是内置特性。

**性能优先**：取决于负载模式。写多选 etcd（吞吐高），读多选 ZK（follower 可读）。

**生产运维**：etcd 更简单（单一二进制 + gRPC），ZK 需要独立 JVM 集群。

## 十一、KRaft：Kafka 摆脱 Zookeeper

Kafka 3.3+ 引入 KRaft 模式，用 Raft 替代 Zookeeper：

```bash
# config/kraft/server.properties
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@localhost:9093,2@localhost:9094,3@localhost:9095
```

**优势**：

1. 单一架构，运维简单
2. 元数据操作延迟降低
3. 支持更大集群（百万分区）

KRaft 模式预计在 Kafka 4.0 完全替代 ZK。

## 十二、总结

一致性算法的 5 条原则：

1. **多数派决策**：所有 commit 需要 > N/2 副本 ack
2. **Term/epoch 单调递增**：保证旧 leader 不再发号施令
3. **log 完整性投票**：保证新 leader 包含所有已 commit 数据
4. **随机超时选举**：避免活锁
5. **预写日志（WAL）**：保证持久性

Raft 和 ZAB 各有所长。理解算法本身，比记住哪种实现更好更重要。
