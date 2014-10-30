## Linux notes

### Console vi字符混乱

1. `Ctrl+L` 清屏

2. `reset` 重置终端到默认状态

3. `export TERM=xterm` 测试下上面的更改生效没

[Ref](http://serverfault.com/questions/327705/linode-lish-shell-vim-and-nano-rendering-troubles-lines-not-appearing-cursor)


### spawn-fcgi安装

1. `rpm -Uvh http://mirrors.neusoft.edu.cn/epel/6/x86_64/epel-release-6-8.noarch.rpm`

2. `yum install spawn-fcgi`


### spawn-fcgi启动

报错：Starting php-cgi: spawn-fcgi: can't find user name nginx

解决：`adduser -g nginx nginx`


### mysql

- install: `yum install mysql`

- config: `vi /etc/my.cnf`

- restart: `/etc/init.d/mysqld restart`

- 设置开机启动: `chkconfig --add mysqld;chkconfig mysqld on;`


### sys cmd

- 列出所有开机启动项: `chkconfig --list`

- 过滤注释：`cat vsftpd.conf | grep -v '^#'`

- 过滤进程并杀死：`ps -ef | grep fetch | awk '{print $2}' | xargs kill -9`

- 添加用户并指定用户目录：
``` bash
useradd [user] -g ftp-d [path]
chown alloyftp -R
```

* 抓80端口tcp包
``` bash
tcpdump tcp port 80 -n -X -s 0
```

- 查找出占用内存>1%的php-fpm进程
``` bash
ps aux | grep php-fpm | grep -v grep | awk '{if($2>1) print $2}'
```

- 统计最常使用的命令
``` bash
history | awk '{CMD[$2]++;count++;} END { for(a in CMD) {print CMD[a] " " CMD[a]/count*100 "% " a}}' \
| grep -v "./" | column -c3 -s " " -t | sort -nr | nl |  head -n10
```

### articles

- [使用 shell 脚本对 Linux 系统和进程资源进行监控](http://www.ibm.com/developerworks/cn/linux/l-cn-shell-monitoring/)
