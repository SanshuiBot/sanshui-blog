---
title: PostgreSQL 高可用实战：流复制与 Patroni
date: 2026-07-23
tags: [PostgreSQL, 高可用, 后端, 技术, 踩坑]
excerpt: 一次主库宕机，业务停了 40 分钟。本文讲流复制原理、同步级别选型、Patroni 自动故障转移，再到 6 个真实生产事故的根因。
---

# PostgreSQL 高可用实战：流复制与 Patroni

线上主库意外宕机。运维手动切换备库花了 40 分钟，期间业务完全停摆。这篇文章记录完整的 PG 高可用方案落地过程。

## 一、流复制的本质

PG 流复制（Streaming Replication）：

1. 主库把 WAL（Write-Ahead Log）日志流式发送给备库
2. 备库接收并应用 WAL，实现与主库的同步
3. 备库是「只读副本」，可承担读流量

### 物理复制 vs 逻辑复制

| 类型     | 机制              | 优势             | 劣势             |
| -------- | ----------------- | ---------------- | ---------------- |
| 物理复制 | 字节级 WAL 复制   | 完全一致，简单   | 必须同版本同架构 |
| 逻辑复制 | 解码 WAL 转成 SQL | 支持异构、跨版本 | 复杂、可能丢数据 |

**生产推荐**：物理复制 + Patroni 自动 failover。

## 二、配置流复制

### 主库配置

```ini
# postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1024   # MB, 保留 WAL 给备库追上
hot_standby = on

# 允许备库连接
listen_addresses = '*'
```

```ini
# pg_hba.conf
host replication replicator 192.168.1.0/24 md5
```

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'xxx';
```

### 备库初始化

```bash
# 停止备库
pg_ctl -D /var/lib/postgresql/data stop

# 用 pg_basebackup 拉一份基线
pg_basebackup \
  -h primary_host \
  -U replicator \
  -D /var/lib/postgresql/data \
  -Fp -Xs -P -R

# -R 会自动创建 standby.signal 和 primary_conninfo
```

### 启动备库

```bash
pg_ctl -D /var/lib/postgresql/data start
```

备库启动后会自动连接主库，开始流式接收 WAL。

## 三、同步级别：async vs sync

```ini
# synchronous_commit = on 是默认，每次写入都等 WAL flush
synchronous_commit = on

# 同步备库列表
synchronous_standby_names = 'FIRST 2 (standby1, standby2, standby3)'
```

`synchronous_standby_names` 取值：

- `'ANY 2 (a, b, c)'`：任意 2 个备库确认即可
- `'FIRST 2 (a, b, c)'`：列表前 2 个确认
- `'*'`：所有备库确认

**生产推荐**：

- 强一致场景：`FIRST 1 (standby1)` —— 至少 1 个备库同步
- 高吞吐场景：`async` —— 不等备库

## 四、踩坑 1：备库 lag 过大

```sql
SELECT application_name, state, sync_state,
       sent_lsn, write_lsn, flush_lsn, replay_lsn,
       (sent_lsn - replay_lsn) AS lag
  FROM pg_stat_replication;
```

lag 大的常见原因：

1. **网络抖动**：检查备库到主库的带宽
2. **备库 IO 慢**：检查 `iostat -x 1`
3. **大事务**：一个 1GB 的 UPDATE 阻塞 replay

**修复**：大事务拆小批次，避免单事务超过 100MB WAL。

## 五、踩坑 2：备库查询阻塞写主库

备库的查询需要 snapshot，如果查询特别长，主库无法 vacuum 旧版本，导致 bloat。

```sql
-- 查看长查询
SELECT pid, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active'
  ORDER BY duration DESC;

-- 终止超长查询
SELECT pg_terminate_backend(pid);
```

**生产配置**：

```ini
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s
```

超过 30s 的备库查询会被自动取消。

## 六、Patroni 自动故障转移

Patroni 是 Zalando 开源的 PG 高可用方案：

```
Patroni (primary) -- DCS (etcd/consul/zk)
   |
Patroni (standby1)
   |
Patroni (standby2)
```

### 配置示例

```yaml
# /etc/patroni/patroni.yml
scope: pg-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.10:8008

etcd:
  hosts: 192.168.1.100:2379,192.168.1.101:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576 # 1MB
    synchronous_mode: true
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        hot_standby: 'on'
        max_wal_senders: 10
        synchronous_commit: 'on'
        synchronous_standby_names: '*'

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.10:5432
  data_dir: /var/lib/postgresql/data
  bin_dir: /usr/lib/postgresql/15/bin
  authentication:
    replication:
      username: replicator
      password: xxx
    superuser:
      username: postgres
      password: xxx

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

### 故障转移流程

1. 主库 Patroni 失去 DCS 心跳（默认 30s）
2. DCS 锁过期
3. 其他 Patroni 节点竞选 leader
4. lag 最小的备库被选为新主
5. 其他备库 reconfigure 指向新主
6. 应用通过 HAProxy / VIP 自动重连

**关键参数**：

- `ttl`：心跳周期，太小容易误判，太大 failover 慢
- `maximum_lag_on_failover`：超过此 lag 不允许 failover，避免丢数据
- `synchronous_mode: true`：要求至少一个 sync 备库

## 七、踩坑 3：split brain（脑裂）

场景：

1. 网络分区，主库与 DCS 失联
2. 备库被选为新主
3. 老主库不知道，继续接受写入
4. 网络恢复，两个主库数据冲突

**Patroni 的防护**：

1. 主库失去 DCS 心跳后，自动 demote 为 standby（停止接受写入）
2. 用 `pg_rewind` 修复数据冲突

```ini
# 关键：失去 DCS 时立即 demote
# patroni.yml
postgresql:
  use_pg_rewind: true
```

## 八、踩坑 4：VIP 漂移不及时

如果用 Keepalived + VIP 方案：

1. 主库宕机
2. Patroni 切换备库为新主
3. Keepalived 漂移 VIP 到新主节点

问题：第 2 步和第 3 步之间有空窗，应用连接 VIP 时连到老主库，报错。

**修复**：用 HAProxy 替代 VIP：

```haproxy
listen pg_cluster
  bind *:5432
  mode tcp
  option tcp-check
  tcp-check expect string primary
  server node1 192.168.1.10:5432 check port 8008
  server node2 192.168.1.11:5432 check port 8008
  server node3 192.168.1.12:5432 check port 8008
```

HAProxy 通过 Patroni REST API (`:8008`) 判断哪个节点是 primary，自动路由。

## 九、踩坑 5：备份策略与 PITR

只靠流复制不够。如果误删表（`DROP TABLE`），操作会立刻复制到备库，备库也跟着丢。

**修复**：定期 pg_basebackup + WAL 归档，支持 PITR（Point-in-Time Recovery）。

```bash
# 每天凌晨全量备份
pg_basebackup -D /backup/$(date +%Y%m%d) -X stream -c fast -P

# 归档 WAL
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'
```

恢复：

```bash
# 恢复到 2026-07-31 10:30:00
restore_command = 'cp /backup/wal/%f %p'
recovery_target_time = '2026-07-31 10:30:00'
recovery_target_action = 'promote'
```

## 十、踩坑 6：连接池与故障转移

应用直接连 PG 时，故障转移会有短暂连接中断。推荐用 PgBouncer：

```ini
# pgbouncer.ini
[databases]
mydb = host=haproxy port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
pool_mode = transaction
```

故障转移时，PgBouncer 自动重连到新主，应用几乎无感知。

## 十一、Patroni + etcd + HAProxy 完整架构

```
Application
    ↓
HAProxy (5432)
    ↓
Patroni (primary) -- etcd (DCS) -- Patroni (standby1) -- Patroni (standby2)
                                       ↓
                                  pg_basebackup / WAL streaming
```

**3 节点最小集群**：1 主 2 备，任一节点宕机不影响服务。

## 十二、监控指标

| 指标                    | 含义            | 告警        |
| ----------------------- | --------------- | ----------- |
| replication_lag_bytes   | 备库 lag 字节数 | > 100MB     |
| replication_lag_seconds | 备库 lag 秒数   | > 30s       |
| Patroni leader          | 是否为 leader   | 0 个 leader |
| pg_up                   | PG 进程是否存活 | 0           |
| xact_commit_rate        | 事务提交速率    | 突降        |

## 十三、实战案例：40 分钟停摆

### 故障时间线

```
T+0:00   主库 OOM，进程被 kill
T+0:01   Patroni 检测到 PG 挂了，尝试本地重启，失败
T+0:05   Patroni demote，DCS 锁释放
T+0:06   备库 1 竞选 leader 成功，开始 promote
T+0:07   备库 1 promote 失败（WAL 不连续）
T+0:10   备库 2 接手，promote 成功
T+0:11   HAProxy 健康检查通过，开始路由流量
T+0:12   应用报错，连接池里的旧连接还在
T+0:40   应用重启，连接池刷新，恢复
```

### 改进措施

1. **应用层**：连接池配置「连接失败时立即清空池」，而非重试
2. **Patroni**：调小 `loop_wait` 让检测更快
3. **备库 lag 监控**：lag > 100MB 立刻告警
4. **演练**：每月强制 failover 演练，确保自动化路径可靠

## 十四、总结

PG 高可用的 6 条原则：

1. **物理流复制为主**，逻辑复制为辅
2. **同步级别按场景选**，强一致用 sync，吞吐用 async
3. **Patroni 自动 failover**，避免手动操作延迟
4. **HAProxy 替代 VIP**，路由更可靠
5. **PgBouncer 连接池**，应用层无感知故障转移
6. **WAL 归档 + PITR**，应对人为误操作

高可用不是单一技术，是一整套架构：复制 + 故障转移 + 连接池 + 备份。每一环都不能省。
