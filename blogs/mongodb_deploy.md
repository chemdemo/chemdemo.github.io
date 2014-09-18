# MongoDB部署实战

MongoDB安装和配置很简单，下载解压完成之后，使用`mongod --help`查看启动配置项，即可简单快速启动MongoDB。

MongoDB的部署，简单总结了下有四种：

### 单机模式

启动：

``` bash
mongod --dbpath [path/to/db] --logpath [path/to/log/xx.log] --logappend --directoryperdb --fork
```

其中，directoryperdb表示每个数据库的文件存放在一个文件夹，推荐这样做，便于管理。

fork表示启动后一直在后台运行，如果只是简单调试就不需要fork参数。

一般来说，配置参数较多的进程我们都推荐采用配置文件启动，假如配置文件存放在`/etc/mongodb.conf`，即可这样启动：

``` bash
mongod -f /etc/mongodb.conf
```

注意，生产环境永远不要用单机模式部署。

### 主从（master-slave）模式

主从模式，顾名思义，主机+从机模式，至少需要两台机器（同一台机器不同端口也行）。

主节点的启动：跟单机启动差不多，只不过加上`master`参数

``` bash
mongod ... --master
```

从节点启动：

``` bash
mongod ... --slave --source [master节点host:master节点端口]
```

原则上，从节点的数量是不限制的，很方便横向扩展。

主从模式可用性提高了些，不过这种模式有很多缺陷：

- 主节点挂了，从节点无法自动传换成主节点（一般主节点负责写，从节点负责读），需要手动切换，这意味着主机挂了就无法写入了

- 无法解决写节点压力大的问题

- 主从同步时数据库的全量同步，效率低下

基于种种原因，MongoDB官方已经不推荐采用主从模式了。

### 副本集群

副本集群即主节点-副本节点模式，主节点负责写入，副本节点负责读。

下面是副本集群方式的部署：

先准备多太机器，我在里用的是两台物理机器，其中一台使用两个端口（官方说副本集数量最好是奇数）。

在机器192.168.44.171上建立数据存放目录：

``` bash
mkdir -p /db/mongodb/replset/mongo1/data /db/mongodb/replset/mongo2/data
```

命令行分别启动副本：

``` bash
mongod --port 27020 --dbpath /db/mongodb/replset/mongo1/data --logpath=/db/mongodb/replset/mongo1/mongo1.log --replSet mstats --directoryperdb --logappend --fork

mongod --port 27021 --dbpath /db/mongodb/replset/mongo2/data --logpath=/db/mongodb/replset/mongo2/mongo2.log --replSet mstats --directoryperdb --logappend --fork
```

这里，`replSet`参数是副本集群的标志，给这个副本集群起个名字叫`mstats`。

在机器192.168.42.14上启动：

``` bash
mkdir -p /db/mongodb/replset/mongo1/data

mongod --port 27020 --dbpath /db/mongodb/replset/mongo1/data --logpath=/db/mongodb/replset/mongo1/mongo1.log --replSet mstats --directoryperdb --logappend --fork
```

下面是配置集群：

假设我们想要192.168.44.171的27020端口作为主节点，那登录到192.168.44.171机器，进行以下配置：

``` bash
mongo --port 27020
```

会发现跟单机模式一样，终端只显示`>`输入标志。接着运行以下命令进行配置：

``` bash
use admin;
conf = {
    _id: "mstats",
    members: [
        {
            _id: 0,
            host: "192.168.44.171:27020",
        },
        {
            _id: 1,
            host: "192.168.44.171:27021",
        },
        {
            _id: 2,
            host: "192.168.42.14:27020",
        }
    ]
}
rs.initiate(conf);
```

过上一段时间，终端显示

``` bash
{
    "info" : "Config now saved locally.  Should come online in about a minute.",
    "ok" : 1
}
```

则表示配置成功，如果没有则检查下配置是否写错。

接着运行`rs.status()`则可以查看副本集状态：

``` bash
mstats:PRIMARY> rs.status()
```

输出：

``` bash
{
    "set" : "mstats",
    "date" : ISODate("2014-09-18T15:13:39Z"),
    "myState" : 1,
    "members" : [
        {
            "_id" : 0,
            "name" : "192.168.44.171:27020",
            "health" : 1,
            "state" : 1,
            "stateStr" : "PRIMARY",
            "uptime" : 1616,
            "optime" : Timestamp(1411053004, 1),
            "optimeDate" : ISODate("2014-09-18T15:10:04Z"),
            "electionTime" : Timestamp(1411052557, 1),
            "electionDate" : ISODate("2014-09-18T15:02:37Z"),
            "self" : true
        },
        {
            "_id" : 1,
            "name" : "192.168.44.171:27021",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 670,
            "optime" : Timestamp(1411053004, 1),
            "optimeDate" : ISODate("2014-09-18T15:10:04Z"),
            "lastHeartbeat" : ISODate("2014-09-18T15:13:38Z"),
            "lastHeartbeatRecv" : ISODate("2014-09-18T15:13:39Z"),
            "pingMs" : 0,
            "syncingTo" : "192.168.44.171:27020"
        },
        {
            "_id" : 2,
            "name" : "192.168.42.14:27020",
            "health" : 1,
            "state" : 2,
            "stateStr" : "SECONDARY",
            "uptime" : 670,
            "optime" : Timestamp(1411053004, 1),
            "optimeDate" : ISODate("2014-09-18T15:10:04Z"),
            "lastHeartbeat" : ISODate("2014-09-18T15:13:37Z"),
            "lastHeartbeatRecv" : ISODate("2014-09-18T15:13:37Z"),
            "pingMs" : 0,
            "syncingTo" : "192.168.44.171:27020"
        }
    ],
    "ok" : 1
}
```

查看副本集：

``` bash
mongod --port 27021
```

这时候我们将看到终端显示`mstats:SECONDARY>`，表示当前登陆的是mstats副本集的副本节点，插入数据试试：

``` bash
use test;
db.testtable.insert({'foo': 'bar'});
```

在命令行将看到错误信息`WriteResult({ "writeError" : { "code" : undefined, "errmsg" : "not master" } })`，说明副本集是不能写入的。

切换到主机后插入一条测试数据：

``` bash
use test;
db.testtable.insert({'foo': 'bar'});
```

再切到副本集读数据：

``` bash
use test;
db.testtable.find();
```

这时候又看到报错`error: { "$err" : "not master and slaveOk=false", "code" : 13435 }`，显示需要开启副本集可写，运行：

``` bash
db.getMongo().setSlaveOk();
```

这时候再查询就ok了。

副本集具有故障转移的功能，即主机不可用时，副本集内部会采用选举机制选出新的主节点，解决了主节点的自动切换问题。

副本集群的同步机制：

查看副本集群内部`local`数据库中，发现会有一个`oplog.rs`表：

``` bash
use local;
show collections;
```

输出：

``` bash
me
oplog.rs
replset.minvalid
startup_log
system.indexes
system.replset
```

oplog.rs表存放本机的所有操作记录，方便和主服务器进行对比数据是否同步还可以用于错误恢复。oplog是一个固定大小的集合，新数据加入超过集合的大小会覆盖。当落后的数据超过了oplog大小，就会触发集群间数据同步，所以需要设置合理的oplog大小避免在生产环境全量复制。

可以通过启动参数`--oplogSize`设置oplogoplogSize，oplogSize默认为剩余磁盘空间的5%。新节点的加入，会全量同步数据库，但同步也并非只能从主节点同步，可以从就近的副本集同步。

副本集的选举机制，采用Bully算法，[这里](http://blog.nosqlfan.com/html/4139.html)有文章介绍。

---

至此，副本集群解决了以下问题：

- 主节点自动切换

- 读写分离策略缓解了主节点压力大的问题

- 副本集群的同步机制以及合理的配置，解决了节点间全量拷贝的问题

但是，集群怎么做到自动扩容呢？

答案是有的，就是分片模式。这里限于篇幅，不再继续，下一篇实践下分片。

### 参考文献

[搭建高可用mongodb集群（三）—— 深入副本集内部机制](http://www.lanceyan.com/tech/mongodb_repset2.html)
