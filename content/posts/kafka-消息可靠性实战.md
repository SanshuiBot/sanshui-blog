---
title: Kafka 消息可靠性实战：从 producer ack 到消费者幂等
date: 2026-07-26
tags: [Kafka, 后端, 消息队列, 技术, 踩坑]
excerpt: 一个 Kafka 消费者把同一笔订单处理了三次。本文讲 producer 的 acks/retries/idempotence、broker 的 ISR 与 min.insync.replicas、consumer 的手动提交与 exactly-once。
---

# Kafka 消息可靠性实战：从 producer ack 到消费者幂等

线上一个 Kafka 消费者，把同一笔订单处理了三次。日志显示：第一次成功、第二次也「成功」、第三次「订单已处理」。原因涉及 producer、broker、consumer 三层的多个坑。这篇文章系统梳理完整链路。

## 一、Kafka 可靠性的三层保障

| 层 | 关键配置 | 解决的问题 |
| --- | --- | --- |
| Producer | `acks=all`、`enable.idempotence=true`、`retries` | 不丢消息、不重消息 |
| Broker | `replication.factor=3`、`min.insync.replicas=2`、`unclean.leader.election.enable=false` | 副本一致性、防止脑裂 |
| Consumer | `enable.auto.commit=false`、手动提交 offset、幂等处理 | 防止重复消费、消息丢失 |

## 二、Producer 的 acks 配置

`acks` 决定 producer 多久才算「发送成功」：

| acks | 含义 | 可靠性 | 吞吐 |
| --- | --- | --- | --- |
| 0 | 不等待任何响应 | 最低，会丢消息 | 最高 |
| 1 | leader 写入即可 | 中等，leader 宕机会丢 | 中 |
| all / -1 | ISR 所有副本都写入 | 最高 | 低 |

**生产推荐**：`acks=all`。

```java
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("acks", "all");
props.put("retries", 3);
props.put("max.in.flight.requests.per.connection", 5);
props.put("enable.idempotence", true);
```

## 三、踩坑 1：retries 导致消息乱序

```
场景：
1. Producer 发送 m1, m2, m3 到同一分区
2. m1 失败，producer 重试 m1
3. m2, m3 已经发送成功
4. 重试的 m1 后到，导致顺序变 m2, m3, m1
```

**修复**：用 idempotent producer + 限制 in-flight 请求数：

```java
props.put("enable.idempotence", true);
props.put("max.in.flight.requests.per.connection", 5);
```

启用 idempotence 后，broker 用 PID（Producer ID）+ SequenceNumber 去重。即使重试也不会写入重复消息。

## 四、Broker 的 ISR 与 min.insync.replicas

**ISR（In-Sync Replicas）**：与 leader 保持同步的副本集合。

**min.insync.replicas**：写入时至少需要多少个 ISR 副本。

```bash
# Topic 配置
kafka-configs --bootstrap-server kafka:9092 \
  --alter --entity-type topics --entity-name orders \
  --add-config min.insync.replicas=2,replication.factor=3
```

**踩坑 2**：min.insync.replicas 太大导致可用性下降

```
replication.factor=3, min.insync.replicas=2
正常：3 副本，写 2 即可
挂 1：剩 2，写 2 即可
挂 2：剩 1，小于 2，写入失败
```

如果业务可用性要求高于一致性，把 min.insync.replicas 调到 1。但一般推荐 2，平衡两者。

## 五、踩坑 3：unclean.leader.election 导致数据丢失

```bash
# 默认值不同 Kafka 版本不同
unclean.leader.election.enable=false
```

**场景**：

1. leader A 写入 m100
2. follower B 还没同步 m100
3. A 宕机，B 成为新 leader
4. m100 丢失

`unclean.leader.election.enable=false` 防止这种场景：如果 ISR 为空，宁可不选 leader 也不让非 ISR 副本上位。

**代价**：可用性下降。如果 ISR 全挂，topic 无法读写直到副本恢复。

## 六、Consumer 的 offset 提交策略

```java
// ❌ 自动提交：会重复消费、丢失消息
props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "1000");

// ✅ 手动提交
props.put("enable.auto.commit", "false");
```

### 自动提交的两个问题

1. **重复消费**：commit interval 5s，2s 时消费者处理完一批消息但还没 commit，crash。重启后从上次 commit 的 offset 开始消费，已处理的会重复。
2. **消息丢失**：commit interval 5s，2s 时拉取了新消息并 commit，但还没处理就 crash。重启后从新 offset 开始，旧消息丢失。

### 手动提交的三种策略

**策略 A：处理完一批后 commit**

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        process(record);
    }
    consumer.commitSync();  // 处理完才 commit
}
```

**问题**：如果 process 抛异常，整批消息都不会 commit，重启后会重复消费。

**策略 B：每条消息处理后 commit**

```java
for (ConsumerRecord<String, String> record : records) {
    process(record);
    consumer.commitSync(Collections.singletonMap(
        new TopicPartition(record.topic(), record.partition()),
        new OffsetAndMetadata(record.offset() + 1)
    ));
}
```

**问题**：commit 频率太高，性能差。

**策略 C：批量处理 + 失败重试**

```java
try {
    for (ConsumerRecord<String, String> record : records) {
        processWithRetry(record, 3);  // 重试 3 次
    }
    consumer.commitSync();
} catch (Exception e) {
    // 把失败的消息发到死信队列，避免阻塞消费
    sendToDLQ(records);
    consumer.commitSync();  // commit 包括失败消息的 offset
}
```

## 七、踩坑 4：消费者并发与分区数

```java
// 单消费者
new KafkaConsumer(props);

// 多消费者（消费者组）
for (int i = 0; i < 4; i++) {
    new Thread(() -> {
        KafkaConsumer c = new KafkaConsumer(props);
        // ...
    }).start();
}
```

**关键**：**消费者数不能超过分区数**。如果分区数是 4，启动 6 个消费者，其中 2 个永远拿不到消息（idle）。

**生产建议**：消费者数 = 分区数，或消费者数 < 分区数（让一个消费者消费多个分区）。

## 八、踩坑 5：长任务消费者

```java
// ❌ 处理慢，超过 max.poll.interval.ms，被踢出消费者组
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        Thread.sleep(60000);  // 假设处理需要 60s
    }
}
```

默认 `max.poll.interval.ms=300000`（5 分钟），超过就被踢出。

**修复**：

1. 调大 `max.poll.interval.ms`
2. 减小 `max.poll.records`，每次拉少点
3. 用 worker pool 异步处理

## 九、exactly-once 语义

exactly-once 语义（EOS）的实现：

### Producer 端：事务

```java
props.put("transactional.id", "my-transactional-id");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();

try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("topic1", "key1", "value1"));
    producer.send(new ProducerRecord<>("topic2", "key2", "value2"));
    // 提交消费者的 offset（在同一事务内）
    producer.sendOffsetsToTransaction(offsets, consumerGroupId);
    producer.commitTransaction();
} catch (Exception e) {
    producer.abortTransaction();
}
```

### Consumer 端：read_committed

```java
props.put("isolation.level", "read_committed");
```

只读已 commit 的事务消息，避免读到 abort 事务的「脏数据」。

## 十、踩坑 6：消费者重平衡（rebalance）

消费者加入/退出消费者组时触发 rebalance，期间消费者无法消费。

**经典问题**：

1. 消费者处理慢，超过 `session.timeout.ms`，被误认为「挂了」
2. 触发 rebalance，整个消费者组重新分配分区
3. 处理中的消息可能丢失或重复

**修复**：

```java
// 调大 session timeout
props.put("session.timeout.ms", "30000");
// 调大 heartbeat interval（不超过 session timeout 的 1/3）
props.put("heartbeat.interval.ms", "10000");
// 使用 Cooperative Rebalance 策略（Kafka 2.4+）
props.put("partition.assignment.strategy",
    "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
```

## 十一、Kafka Streams 的 exactly-once

```java
Properties props = new Properties();
props.put("application.id", "my-streams-app");
props.put("bootstrap.servers", "kafka:9092");
props.put("processing.guarantee", "exactly_once_v2");  // Kafka 2.5+
```

`exactly_once_v2` 使用新的 transaction API，性能比 `exactly_once` 更好。

## 十二、实战案例：订单重复处理三次

### 排查

1. 日志显示同一笔订单被消费三次
2. producer 用 `acks=1`，可能重试导致重复
3. consumer 用 `enable.auto.commit=true`，crash 后重新消费

### 修复方案

**Producer 端**：

```java
props.put("acks", "all");
props.put("enable.idempotence", true);
props.put("retries", 10);
```

**Broker 端**：

```bash
min.insync.replicas=2
replication.factor=3
unclean.leader.election.enable=false
```

**Consumer 端**：

```java
props.put("enable.auto.commit", "false");
props.put("isolation.level", "read_committed");
```

**业务端：幂等**

```python
def process_order(order_id, payload):
    # 检查是否已处理
    if cache.exists(f"order:{order_id}:processed"):
        return
    # 处理
    do_business(order_id, payload)
    # 标记已处理
    cache.set(f"order:{order_id}:processed", "1", ex=86400)
```

但 cache.set 可能失败。**更可靠**的方式是用数据库唯一约束：

```sql
INSERT INTO processed_orders (order_id, processed_at)
VALUES (?, NOW())
ON CONFLICT (order_id) DO NOTHING;
```

如果插入成功（affected_rows=1），说明是首次处理；如果 affected_rows=0，说明已处理过，跳过。

## 十三、监控指标

Kafka 关键监控指标：

| 指标 | 含义 | 告警阈值 |
| --- | --- | --- |
| under_replicated_partitions | ISR 不足的分区数 | > 0 |
| offline_partitions | 没有 leader 的分区数 | > 0 |
| consumer_lag | 消费者滞后 | > 10000 |
| producer_request_latency | producer 请求延迟 | P99 > 100ms |
| isr_shrinks_rate | ISR 缩减速率 | 突增 |

## 十四、总结

Kafka 可靠性的核心原则：

1. **Producer 用 acks=all + idempotence**
2. **Broker 用 replication.factor=3 + min.insync.replicas=2**
3. **Consumer 关闭 auto commit，手动 commit**
4. **业务层做幂等**：数据库唯一约束或 Redis SETNX
5. **EOS 场景用 transaction API + read_committed**

消息队列从来不只是「发出去就行」，每一层都要明确语义，才能真正做到生产级可靠。
