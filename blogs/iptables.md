# Linux防火墙配置小计

在使用[mms](https://mms.mongodb.com)监控MongoDB时，按照提示一步步安装完成mms agent并启动，但是到了mms提供的网页查看监控图表时却一直看不到数据，查看log发现报错了：`no reachable servers`，意思是agent连接不上mongodb，于是开始google搜索答案，无果之后邮件寻求官方support，他们给了一些连接和大概的错误说明，然后锁定是系统防火墙把连接block了。

接下来开始排查。

首先看了下防火墙配置：

``` bash
iptables -L -n
```

发现配置表里没有规则，这才想起来装好系统之后没动过iptables，配置是干净的。下面就来配置下防火墙规则，顺便修复下mms。

### 设置预设规则：

``` bash
# 当超出了iptables里filter表里的INPUT链规则时，数据包进行丢弃
iptables -P INPUT DROP
# 当超出了iptables里filter表里的OUTPUT链规则时，数据包进行接受
iptables -P OUTPUT ACCEPT
# 当超出了iptables里filter表里的FORWARD链规则时，数据包进行丢弃
iptables -P FORWARD DROP
```

INPUT，FORWARD两个链采用的是允许什么包通过，而OUTPUT链采用的是不允许什么包通过。

### 添加ssh访问规则（开启22端口）

``` bash
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 22 -j ACCEPT
```

如果需要限制只允许某台ip访问，则：

``` bash
iptables -A INPUT -s [YOUR_CLIENT_IP] -p tcp --dport 22 -j ACCEPT
iptables -A OUTPUT -s [YOUR_CLIENT_IP] -p tcp --sport 22 -j ACCEPT
```

### 开启HTTP端口和HTTPS端口

``` bash
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
```

### 开启ftp访问端口

``` bash
iptables -A INPUT -p tcp --dport 21 -j ACCEPT
```

### 允许loopback，不然会导致DNS无法正常关闭等问题

``` bash
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
```

### 允许ping外部服务器

``` bash
iptables -A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT
iptables -A INPUT -p icmp -m icmp --icmp-type 11 -j ACCEPT
```

### 允许从服务器ping外部服务器

``` bash
iptables -A OUTPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT
iptables -A OUTPUT -p icmp -m icmp --icmp-type 11 -j ACCEPT
```

### 允许mms服务器访问mongodb进程及端口：

先ping找到`mms.mongodb.com`的host是`75.101.156.249`。

``` bash
iptables -A INPUT -s 75.101.156.249 -p tcp --destination-port 27017 -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -d 75.101.156.249 -p tcp --source-port 27017 -m state --state ESTABLISHED -j ACCEPT
```

所有的配置规则都比较零散，最好是写成配置文件，方便维护，这里整理一份，存放到`/etc/iptables.sh`，直接运行`sh /etc/iptables.sh即可生效`：

``` bash
IPT="/sbin/iptables"
$IPT --delete-chain
$IPT --flush
$IPT -P INPUT DROP    #1
$IPT -P FORWARD DROP  #1
$IPT -P OUTPUT DROP   #1
$IPT -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT #设置当连接状态为RELATED和ESTABLISHED时，允许数据进入服务器
$IPT -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT #3
$IPT -A INPUT -p tcp -m tcp --dport 443 -j ACCEPT #3
$IPT -A INPUT -p tcp -m tcp --dport 22 -j ACCEPT #3
$IPT -A INPUT -s 75.101.156.249 -p tcp --destination-port 27017 -m state --state NEW,ESTABLISHED -j ACCEPT
# $IPT -A INPUT -p tcp -m tcp --dport 21 -j ACCEPT  #建议采用sftp连接
$IPT -A INPUT -i lo -j ACCEPT #4
$IPT -A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT  #5
$IPT -A INPUT -p icmp -m icmp --icmp-type 11 -j ACCEPT #5
$IPT -A OUTPUT -m state --state RELATED,ESTABLISHED -j ACCEPT #设置状态为RELATED和ESTABLISHED的数据可以从服务器发送到外部
$IPT -A OUTPUT -p udp -m udp --dport 53 -j ACCEPT #允许服务器使用外部dns解析域名
$IPT -A OUTPUT -o lo -j ACCEPT #4
$IPT -A OUTPUT -p tcp -m tcp --dport 80 -j ACCEPT #8
$IPT -A OUTPUT -p tcp -m tcp --dport 443 -j ACCEPT #9
$IPT -A OUTPUT -d 75.101.156.249 -p tcp --source-port 27017 -m state --state ESTABLISHED -j ACCEPT
$IPT -A OUTPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT  #10
$IPT -A OUTPUT -p icmp -m icmp --icmp-type 11 -j ACCEPT #10
service iptables save
service iptables restart
```

### 清空filters：

``` bash
iptables -F #清除预设表filter中的所有规则链的规则
iptables -X #清除预设表filter中使用者自定链中的规则
```

### 参数解释

- \-A 附加INPUT规则链

- \-s 来源IP

- \-d 目的地址

- \-p 通信协议

- \-\-dport 目的端口

- \-j 代表“Jump”，所有之前的规则都匹配，则接受数据包

- \-state 数据包的状态：

    NEW：第一服务器发送给第二服务器一个SYN数据包来新建一个连接

    RELATED: 第二服务器接收SYN数据包并发送给第一服务器一个SYN-ACK数据包来确定连接正常

    ESTABLISHED: 第一服务器接收到SYN-ACK数据包并发送给第二服务器ACK服务器来做最后的确认，至此连接建立完成，两台服务器开始传输数据

### 参考文献

- [适合Web服务器的iptables规则](https://www.centos.bz/2011/09/example-webserver-iptable-ruleset/)

- [linux下IPTABLES配置详解](http://www.cnblogs.com/JemBai/archive/2009/03/19/1416364.html)

- [Configure Linux iptables Firewall for MongoDB](http://docs.mongodb.org/manual/tutorial/configure-linux-iptables-firewall/)
