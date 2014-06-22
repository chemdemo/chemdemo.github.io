# redis备忘录

## redis数据类型

- 字符串（string）：能存储任何形式的字符串，也包括二进制。它是其他四种类型的基础。

- 哈希（hash）：用于存储对象。

- 链表（list）：存储一个有序的字符串列表，内部使用双向链表实现的。通常用`LPUSH`、`LPOP`或`RPUSH`、`RPOP`实现栈功能，用`LPUSH`、`RPOP`或`RPUSH`、`LPOP`实现队列功能。

- 无序集合（set）：与数学中的集合类似，集合中的元素是唯一的、无序的、集合之间可以进行交并差等运算。

- 有序集合（zset）：与无序集合类似，不过每个元素都关联了一个分数，集合中的元素不同但是分数可能相同。

注：hash、list、set、zset中的元素都不支持数据类型嵌套。

## redis-cli基本使用

### 字符串类型常用命令：

- `SET key value`：设置key的值为value，成功则返回ok

- `GET key`：获取key的值

- `INCR key`：key的值加1

### 哈希类型

- `HSET key field value`：设置key的field字段的值是value，成功则返回1，如果key中field字段已经存在且旧指已被新值覆盖则=返回0

- `HGET key field`：获取key中field字段的值

- `HGETALL key`：获取key中所有字段和值，key不存在则返回空（nil）

### 链表类型

- `LPUSH key value [value2 ...]`：往key链表左边添加元素，返回链表长度

- `RPUSH key value [value2 ...]`：同上，往右边添加元素

- `LPOP key`：移除key链表左边第一个元素，并返回被移除元素的值

- `RPOP key`：同上，移除右边第一个元素

- `LRANGE key start stop`：获取链表中某一个片段，但不修改原链表的值（LRANGE返回的值是包含最右边的元素的！），`LRANGE key 0 -1`可获取链表key中所有元素

### 无序集合类型

- `SADD key number [number2 ...]`：向集合中添加一个或多个元素，如果元素已经存在则忽略。返回成功加入的元素数量

- `SREM key number [number2 ...]`：从集合中删除一个或多个元素，返回成功移除的元素数量

- `SMEMBERS key`：返回集合中所有元素

- `SINTER key [key2 ...]`：多个集合执行交集运算并返回结果

- `SDIFF key [key2 ...]`：取差集

- `SUNION key [key2 ...]`：取并集

### 有序集合类型

- `ZADD key score number [score number ...]`：向有序集合中加入一个或多个元素和该元素的值，如果该元素已经存在则用新分数替换原来的。返回新加入的元素个数

- `ZREM key number [number ...]`：删除集合中一个或多个元素，返回成功删除的元素个数

- `ZRANGE key start end [WITHSCORES]`：按元素分数大小顺序（从小到大）返回从start到end的之间的所有元素（含短点）。如果需要获取元素分数则带上WITHSCORES参数

- `ZREVRANGE key start end [WITHSCORES]`：同上，按照分数大小排序（从大到小）

## 其他

redis默认支持16个数据库，顺序编号是0, 1, 2 ,...16，可以使用`SELECT`命令选择db，默认是0

## 更多

[redis命令行参考](http://www.redis.cn/commands.html)
