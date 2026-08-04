---
title: PostgreSQL 索引实战：从 B-tree 到 GIN 踩坑录
date: 2026-07-24
tags: [PostgreSQL, 后端, 数据库, 技术, 踩坑]
excerpt: 一张 800 万行的表 LIKE 查询要 12 秒。本文讲 B-tree / Hash / GIN / GiST / BRIN 五种索引选型、部分索引、表达式索引、覆盖索引，再到 7 个真实生产事故的根因。
---

# PostgreSQL 索引实战：从 B-tree 到 GIN 踩坑录

线上一个日志查询接口超时。查下来发现是一张 800 万行的 `audit_log` 表，按 `path LIKE '/api/%'` 查询要 12 秒。建了 B-tree 索引也没用，因为 `LIKE` 以通配符开头时索引会失效。这篇文章系统梳理 PostgreSQL 五种索引的选型逻辑，再列出 7 个真实生产事故的根因和修复。

## 一、五种索引的本质差异

| 索引类型 | 数据结构      | 适用场景             | 不适用                  |
| -------- | ------------- | -------------------- | ----------------------- |
| B-tree   | 平衡多叉树    | 等值、范围、排序     | 数组、全文搜索          |
| Hash     | 哈希表        | 仅等值查询           | 范围、排序              |
| GIN      | 倒排索引      | 数组、JSON、全文搜索 | 高更新频率表            |
| GiST     | 平衡树 + 谓词 | 几何、范围、模糊匹配 | 等值查询性能不如 B-tree |
| BRIN     | 块范围索引    | 大表 + 物理有序数据  | 随机写入的小表          |

**默认是 B-tree**。`CREATE INDEX idx ON t(col)` 就是 B-tree。

## 二、踩坑 1：LIKE '%xxx' 让索引失效

```sql
-- ❌ 索引失效，全表扫描
SELECT * FROM audit_log WHERE path LIKE '/api/%'

-- 实际上 path LIKE 'xxx%' 可以用 B-tree
-- 但 LIKE '%xxx' 或 LIKE '/api/%' 中间有 % 的话，要看模式
```

`LIKE '/api/%'` 在默认 `C` locale 下是可以用索引的，因为 `path` 字段是按字典序排列的，`LIKE 'prefix%'` 等价于一个范围查询。

但 `LIKE '%suffix'` 必须从尾部匹配，B-tree 索引按升序排列，无法跳过中间部分。

**解决方案**：

### 方案 A：pg_trgm 扩展 + GIN 索引

```sql
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_audit_log_path_trgm ON audit_log USING gin (path gin_trgm_ops);

-- 现在任意位置的模糊匹配都能用索引
SELECT * FROM audit_log WHERE path LIKE '%user%';
```

`pg_trgm` 把字符串切成 3-gram（三字符组合），GIN 倒排索引能快速定位包含特定 trigram 的行。

### 方案 B：反序字段 + B-tree

```sql
-- 加一个反序字段
ALTER TABLE audit_log ADD COLUMN path_reverse text;
UPDATE audit_log SET path_reverse = reverse(path);
CREATE INDEX idx_audit_log_path_rev ON audit_log(path_reverse);

-- LIKE '%suffix' 等价于反序字段的 LIKE 'suffix%'
SELECT * FROM audit_log WHERE path_reverse LIKE reverse('user') || '%';
```

适合固定后缀匹配。但需要触发器维护 `path_reverse`。

## 三、踩坑 2：低选择性字段建索引没用

```sql
CREATE INDEX idx_user_active ON users(is_active);
```

`is_active` 只有 true / false 两个值，索引选择性极低。PostgreSQL 查询规划器看到「95% 的行匹配条件」时，会**直接走全表扫描**，跳过索引。

**解决方案**：

### 方案 A：部分索引

```sql
-- 只对 is_active = false 的行建索引
CREATE INDEX idx_user_inactive ON users(id) WHERE is_active = false;
```

索引大小可能从 100MB 缩到 5MB，且查询时规划器会优先用这个「小而精」的索引。

### 方案 B：组合索引

```sql
CREATE INDEX idx_user_active_email ON users(is_active, email);
```

`(is_active, email)` 组合索引可以服务 `WHERE is_active = true AND email = '...'` 查询。但**列顺序很重要**——`is_active` 在前，过滤大量行；`email` 在后，精确匹配。

## 四、踩坑 3：组合索引列顺序

```sql
CREATE INDEX idx_user_country_city ON users(country, city);

-- ✅ 能用索引
SELECT * FROM users WHERE country = 'US' AND city = 'NYC';
SELECT * FROM users WHERE country = 'US';

-- ❌ 不能用索引（city 在前跳过了 country）
SELECT * FROM users WHERE city = 'NYC';
```

**最左前缀原则**：组合索引只能从最左列开始用。如果查询条件涉及 `(country, city)`，那索引应该是 `(country, city)` 或 `(city, country)`，看哪个选择性更高。

**通用经验**：

1. 等值查询列在前，范围查询列在后
2. 选择性高的列在前
3. 排序列紧跟等值列

## 五、踩坑 4：COUNT(*) 索引不生效

```sql
SELECT COUNT(*) FROM orders WHERE status = 'pending';
```

即使 `status` 上有索引，PostgreSQL 也可能走全表扫描。原因：`COUNT(*)` 需要扫描所有匹配行确认可见性（MVCC 多版本可见性检查），索引里没有完整的可见性信息。

**解决方案**：

### 方案 A：维护计数表

```sql
CREATE TABLE order_counts (
  status text PRIMARY KEY,
  count bigint NOT NULL
);

-- 触发器维护
CREATE TRIGGER update_order_count
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_order_count();
```

### 方案 B：估算计数

```sql
-- 用 pg_class.reltuples 估算
SELECT reltuples::bigint AS estimate
  FROM pg_class
  WHERE relname = 'orders';
```

适合分页总数显示，不需要精确值。

## 六、踩坑 5：JSON 查询的索引

```sql
CREATE TABLE events (
  id serial PRIMARY KEY,
  data jsonb
);

-- ❌ 查询不走索引
SELECT * FROM events WHERE data->>'user_id' = '123';

-- ✅ 表达式索引
CREATE INDEX idx_events_user_id ON events ((data->>'user_id'));
```

表达式索引 `(data->>'user_id')` 会把 JSON 字段提取出来做索引。但**每次 UPDATE JSON 都会重建索引**，写入性能会受影响。

### GIN 索引

```sql
CREATE INDEX idx_events_data ON events USING gin (data);

-- ✅ 支持各种 JSON 操作
SELECT * FROM events WHERE data @> '{"user_id": "123"}';
SELECT * FROM events WHERE data ? 'user_id';
```

`@>` 是包含查询，`?` 是 key 存在查询。GIN 索引同时支持这两种。

## 七、踩坑 6：索引膨胀（bloat）

PostgreSQL 的 MVCC 机制是「标记删除 + 后台 VACUUM 清理」。UPDATE 实际上是「DELETE + INSERT」，旧版本行留在数据文件里，等 VACUUM 回收。

索引膨胀问题：UPDATE 不更新的列也会在索引里留下「死项」。

诊断：

```sql
SELECT schemaname, relname, indexrelname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
       idx_scan AS index_scans
  FROM pg_stat_user_indexes
  WHERE idx_scan < 50  -- 几乎没用的索引
  ORDER BY pg_relation_size(indexrelid) DESC;
```

**解决方案**：

### 方案 A：定期 REINDEX

```sql
-- 锁表，慎用
REINDEX INDEX idx_events_user_id;

-- 并发 REINDEX（PG 12+）
REINDEX INDEX CONCURRENTLY idx_events_user_id;
```

### 方案 B：pg_repack 在线重建

```bash
pg_repack -d mydb -t events
```

`pg_repack` 用触发器保证重建期间不丢更新，业务无感知。

## 八、踩坑 7：并发建索引的坑

```sql
-- ❌ 锁表，业务无法写入
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ✅ 并发建索引，不阻塞写入
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
```

但 `CONCURRENTLY` 有几个坑：

1. **构建时间长**：需要扫两遍表，约 2-3 倍于普通方式
2. **失败留下 INVALID 索引**：构建中断后索引处于 invalid 状态，必须 `DROP INDEX` 后重建
3. **不能在事务里用**：

```sql
BEGIN;
CREATE INDEX CONCURRENTLY ...;  -- ❌ 报错
COMMIT;
```

## 九、覆盖索引：避免回表

```sql
-- 普通查询需要回表
SELECT user_id, order_date FROM orders WHERE user_id = 123;

-- 覆盖索引直接命中
CREATE INDEX idx_orders_user_id_date ON orders(user_id, order_date);
```

包含索引（PG 11+）：

```sql
-- INCLUDE 列不参与索引排序，但可以避免回表
CREATE INDEX idx_orders_user_id ON orders(user_id) INCLUDE (order_date, total);
```

`INCLUDE` 列对查询过滤无效，但 SELECT 时可以直接从索引返回，省一次 IO。

## 十、BRIN 索引：大表日志场景

```sql
-- 假设 audit_log 按 created_at 物理有序插入
CREATE INDEX idx_audit_log_created_brin ON audit_log USING brin (created_at);
```

BRIN（Block Range Index）只存每个数据块的「min/max」值，索引极小。

适合：

- 时间序列日志表
- 物理顺序与查询顺序一致的场景
- 行数极大（10 亿+）但查询都是范围扫描

不适合：

- 大量随机 UPDATE / DELETE 的表
- 需要等值查询的场景

## 十一、索引实战案例：12 秒 → 80ms

`audit_log` 表 800 万行，查询：

```sql
SELECT * FROM audit_log
 WHERE path LIKE '/api/users/%'
   AND created_at > now() - interval '7 days'
 ORDER BY created_at DESC
 LIMIT 50;
```

慢的原因：

1. `path LIKE '/api/users/%'` 是范围匹配，但中间的 `%` 让 B-tree 失效
2. `created_at > ...` 是范围扫描，B-tree 可以用
3. ORDER BY + LIMIT 想用 index scan，但前面的过滤条件不让用

**解决方案**：

```sql
-- 1. pg_trgm + GIN 解决 LIKE 模糊匹配
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_audit_log_path_trgm
  ON audit_log USING gin (path gin_trgm_ops);

-- 2. B-tree 索引覆盖 created_at 排序
CREATE INDEX idx_audit_log_created_desc
  ON audit_log (created_at DESC);

-- 3. 组合索引（最有效）
CREATE INDEX idx_audit_log_path_created
  ON audit_log (created_at DESC, path gin_trgm_ops);
```

效果：

```
Before: 12.3s
After:  80ms
```

查询计划：

```
Limit  (cost=0.43..1.95 rows=50 width=...)
  ->  Index Scan using idx_audit_log_created_desc on audit_log
        Index Cond: (created_at > (now() - '7 days'::interval))
        Filter: (path ~~ '/api/users/%'::text)
        Rows Removed by Filter: 1523
```

走 `idx_audit_log_created_desc`，按时间倒序扫，过滤 path。LIMIT 50 让扫描提前结束。

## 十二、索引维护清单

定期执行：

```sql
-- 1. 分析未使用的索引
SELECT relname, indexrelname, idx_scan
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey';

-- 2. 检查膨胀率
SELECT schemaname, tablename, attname,
       (n_distinct >= 0 OR n_distinct < -0.5) AS is_good_selectivity
  FROM pg_stats
  WHERE schemaname = 'public';

-- 3. VACUUM ANALYZE
VACUUM ANALYZE audit_log;

-- 4. 自动 vacuum 调参
ALTER TABLE audit_log SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE audit_log SET (autovacuum_analyze_scale_factor = 0.02);
```

## 十三、总结

PostgreSQL 索引的 7 条原则：

1. **B-tree 是默认**，等值/范围/排序都靠它
2. **LIKE '%xxx' 用 pg_trgm + GIN**
3. **低选择性字段用部分索引**，别建普通 B-tree
4. **组合索引按选择性排序**，等值列在前
5. **JSON 查询用表达式索引或 GIN**
6. **大表日志用 BRIN**，索引体积小
7. **生产环境建索引用 CONCURRENTLY**，避免锁表

索引不是越多越好——每个索引都是 UPDATE 时的额外开销。精准的索引策略能让查询速度提升 100 倍，同时减少磁盘占用。
