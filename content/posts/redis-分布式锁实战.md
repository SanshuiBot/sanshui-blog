---
title: Redis 分布式锁实战：从 SET NX 到 Redlock 踩坑
date: 2026-07-20
tags: [Redis, 后端, 分布式, 技术, 踩坑]
excerpt: 一个支付系统的分布式锁写错了，导致同一笔订单被扣两次款。本文讲 SET NX EX 的正确姿势、锁续期看门狗、Redlock 算法的争议，再到 6 个真实生产事故。
---

# Redis 分布式锁实战：从 SET NX 到 Redlock 踩坑

线上一个支付系统，同一笔订单被扣款两次。排查发现是分布式锁的实现有问题——锁提前过期，第二个请求拿到锁重复执行。这篇文章记录完整的修复过程，并系统梳理 Redis 分布式锁的所有坑点。

## 一、为什么需要分布式锁

单机场景下，Java 的 `synchronized` 或 `ReentrantLock` 就够。但微服务架构下，多个服务实例共享同一份数据，需要跨进程的锁机制。

典型场景：

- **库存扣减**：防止超卖
- **订单支付**：防止重复扣款
- **定时任务**：多实例只有一个执行
- **资源初始化**：防止重复初始化

## 二、最基础的分布式锁：SET NX EX

```bash
# 加锁：key 不存在时设置，10 秒过期
SET lock:order:123 "uuid-xxx" NX EX 10

# 解锁：Lua 脚本确保原子性
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
```

**关键点**：

1. **`NX`**：只在 key 不存在时设置
2. **`EX 10`**：10 秒自动过期，防止死锁
3. **value 用 UUID**：防止 A 的锁被 B 解开
4. **解锁用 Lua**：GET + DEL 必须原子

## 三、踩坑 1：value 用固定字符串

```bash
# ❌ 危险
SET lock:order:123 "locked" NX EX 10
```

场景：

1. A 加锁，value = "locked"
2. A 业务执行慢，锁过期
3. B 加锁，value = "locked"
4. A 业务执行完，执行 `DEL lock:order:123`，把 B 的锁删了
5. C 加锁成功，与 B 并发执行

**修复**：value 用唯一标识（UUID + 线程 ID），解锁时校验。

## 四、踩坑 2：解锁不是原子的

```java
// ❌ 错误
String value = jedis.get(key);
if (myUUID.equals(value)) {
    jedis.del(key);  // 在 GET 和 DEL 之间，锁可能已经过期并被其他人获取
}
```

**修复**：用 Lua 脚本保证原子性：

```java
String script =
    "if redis.call('GET', KEYS[1]) == ARGV[1] then " +
    "  return redis.call('DEL', KEYS[1]) " +
    "else " +
    "  return 0 " +
    "end";
jedis.eval(script, Collections.singletonList(key), Collections.singletonList(uuid));
```

## 五、踩坑 3：锁过期但业务没执行完

这是最常见的坑。场景：

1. A 加锁，TTL = 10 秒
2. A 业务执行需要 15 秒
3. 第 10 秒时锁过期
4. 第 11 秒时 B 加锁成功
5. A 和 B 并发执行业务

**解决方案：锁续期（看门狗）**

### Redisson 的看门狗

```java
RLock lock = redisson.getLock("lock:order:123");
lock.lock();  // 默认 30 秒过期，每 10 秒续期一次
try {
    // 业务逻辑
} finally {
    lock.unlock();
}
```

Redisson 内部有一个定时任务，每隔 `TTL/3` 检查锁是否还持有，如果是就续期。

### 手动实现看门狗

```python
import threading
import time

class RedisLock:
    def __init__(self, redis, key, ttl=10):
        self.redis = redis
        self.key = key
        self.ttl = ttl
        self.uuid = str(uuid.uuid4())
        self._watchdog = None
        self._running = False

    def acquire(self):
        while not self.redis.set(self.key, self.uuid, nx=True, ex=self.ttl):
            time.sleep(0.1)
        self._running = True
        self._start_watchdog()

    def _start_watchdog(self):
        def renew():
            while self._running:
                time.sleep(self.ttl / 3)
                # 用 Lua 脚本续期，校验 UUID
                self.redis.eval(
                    "if redis.call('GET', KEYS[1]) == ARGV[1] then "
                    "  return redis.call('EXPIRE', KEYS[1], ARGV[2]) "
                    "else return 0 end",
                    1, self.key, self.uuid, self.ttl
                )
        self._watchdog = threading.Thread(target=renew, daemon=True)
        self._watchdog.start()

    def release(self):
        self._running = False
        # 用 Lua 脚本解锁
        self.redis.eval(
            "if redis.call('GET', KEYS[1]) == ARGV[1] then "
            "  return redis.call('DEL', KEYS[1]) else return 0 end",
            1, self.key, self.uuid
        )
```

## 六、踩坑 4：Redis 主从切换导致锁失效

Redis 主从异步复制，场景：

1. A 在 master 加锁
2. master 还没同步到 slave 就宕机
3. slave 升级为新 master
4. B 在新 master 加锁成功（因为 key 不存在）
5. A 和 B 同时持有锁

**这是 Redis 主从架构下分布式锁的根本性问题**。

## 七、Redlock 算法

为了解决主从切换问题，Redis 作者提出了 Redlock 算法：

**核心思想**：用多个独立的 Redis 实例，N/2+1 个加锁成功才算锁成功。

**算法步骤**：

1. 获取当前时间 T1
2. 依次向 N 个 Redis 实例发送 `SET lock NX EX` 请求
3. 获取当前时间 T2
4. 如果至少 `ceil(N/2)` 个实例加锁成功，且 `T2 - T1 < TTL`，则加锁成功
5. 否则向所有实例发送 DEL 请求释放锁

**Redlock 的争议**：

Martin Kleppmann 在 2016 年发文质疑 Redlock：

1. **时钟漂移问题**：Redlock 依赖各节点的时钟一致，但 NTP 同步有误差，GC pause 也会让进程时间「暂停」
2. **网络延迟问题**：T2 - T1 < TTL 的判断在网络抖动时不可靠

**实践建议**：

- 如果业务对锁的正确性要求极高（金融、支付），**不要用 Redis 分布式锁**，用 Zookeeper 或 etcd
- 如果业务能容忍偶发的并发问题（限流、防重复提交），Redis 分布式锁足够

## 八、Redisson 的实现

Redisson 是 Java 生态最成熟的 Redis 客户端，分布式锁实现完善：

```java
// 普通锁
RLock lock = redisson.getLock("myLock");
lock.lock();

// 公平锁
RLock fairLock = redisson.getFairLock("myLock");
fairLock.lock();

// 读写锁
RReadWriteLock rwLock = redisson.getReadWriteLock("myLock");
rwLock.readLock().lock();
rwLock.writeLock().lock();

// Redlock
RLock lock1 = redisson1.getLock("myLock");
RLock lock2 = redisson2.getLock("myLock");
RLock lock3 = redisson3.getLock("myLock");
RedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
redLock.lock();
```

## 九、踩坑 5：锁粒度过大

```java
// ❌ 锁整个订单流程
RLock lock = redisson.getLock("order:process:" + orderId);
lock.lock();
try {
    validateOrder();
    deductInventory();
    processPayment();
    sendNotification();
} finally {
    lock.unlock();
}
```

如果整个流程耗时 30 秒，锁持有时间过长，并发度极低。

**修复**：缩小锁粒度，只锁关键步骤：

```java
validateOrder();  // 无需锁
deductInventory();  // 锁库存
processPayment();  // 锁支付
sendNotification();  // 异步，无需锁
```

## 十、踩坑 6：锁的 key 设计错误

```java
// ❌ 锁用户 ID，导致同一用户的所有操作串行
RLock lock = redisson.getLock("user:" + userId);

// ✅ 锁具体业务
RLock lock = redisson.getLock("payment:user:" + userId);
RLock lock2 = redisson.getLock("login:user:" + userId);
```

## 十一、实战案例：支付重复扣款

### 问题

支付接口并发调用导致同一订单被扣两次款。

### 排查

1. 查支付日志，发现同一订单在 100ms 内有两个支付请求
2. 查 Redis 锁日志，发现第二个请求没拿到锁直接返回「重复支付」
3. 但支付系统还是扣了两次款

### 根因

```python
# ❌ 锁在 try 块外，但业务异常没释放锁
lock = redis_lock.acquire("pay:order:" + order_id)
try:
    process_payment(order_id)
    save_payment_record(order_id)
except Exception:
    raise  # 锁没释放，下次请求永远拿不到锁
finally:
    pass  # 忘记释放锁
```

修复后：

```python
# ✅ 正确
lock = redis_lock.acquire("pay:order:" + order_id)
try:
    if payment_exists(order_id):
        return "already paid"
    process_payment(order_id)
    save_payment_record(order_id)
finally:
    lock.release()
```

但还是有重复扣款。深入排查发现是锁的 TTL 太短：

```python
lock = redis_lock.acquire("pay:order:" + order_id, ttl=5)  # 5 秒
```

支付流程需要 8 秒，锁在 5 秒时过期，第二个请求拿到锁重复执行。

### 最终修复

1. 用 Redisson 的看门狗机制自动续期
2. 业务层做幂等性检查（支付记录存在就跳过）
3. 数据库层加唯一约束 `UNIQUE(order_id)`，双重保险

```java
// Redisson + 业务幂等
RLock lock = redisson.getLock("pay:order:" + orderId);
lock.lock(30, TimeUnit.SECONDS);  // 看门狗续期
try {
    PaymentRecord existing = paymentRepo.findByOrderId(orderId);
    if (existing != null && existing.getStatus() == SUCCESS) {
        return existing;
    }
    PaymentRecord record = processPayment(orderId);
    paymentRepo.save(record);  // 数据库唯一约束兜底
    return record;
} finally {
    lock.unlock();
}
```

## 十二、分布式锁的替代方案

### 数据库唯一约束

```sql
INSERT INTO payment_lock (order_id, created_at)
VALUES ('123', now())
ON CONFLICT (order_id) DO NOTHING;
```

适合**简单幂等性检查**，比 Redis 锁更可靠（数据库事务保证）。

### Zookeeper / etcd

```java
InterProcessMutex lock = new InterProcessMutex(curator, "/locks/order/123");
lock.acquire();
try {
    // business
} finally {
    lock.release();
}
```

Zookeeper 用 ZAB 协议保证强一致性，etcd 用 Raft。比 Redis 更可靠，但性能稍低。

### 乐观锁

```sql
UPDATE inventory SET count = count - 1
 WHERE product_id = 123 AND count > 0 AND version = 5;
```

适合**库存扣减**等场景，不需要分布式锁。

## 十三、选型决策

| 场景           | 推荐方案                  |
| -------------- | ------------------------- |
| 防重复提交     | Redis SET NX EX           |
| 库存扣减       | 乐观锁 / 数据库原子更新   |
| 支付幂等       | Redis 锁 + 数据库唯一约束 |
| 强一致性要求高 | Zookeeper / etcd          |
| 简单互斥       | Redis SET NX              |

## 十四、总结

Redis 分布式锁的 6 条原则：

1. **`SET NX EX`** 一条命令加锁
2. **value 用 UUID**，防止误删
3. **解锁用 Lua 脚本**，原子校验
4. **TTL 加看门狗续期**，防止业务没执行完锁就过期
5. **金融场景用 Zookeeper / etcd**，不要用 Redis
6. **业务层做幂等**，锁只是第一道防线

锁不是万能的，但它能让大部分并发问题变得可控。**正确的锁 + 幂等业务 + 数据库约束**，三者结合才能真正做到生产级可靠。
