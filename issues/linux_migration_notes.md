几经折腾，总算成功把团队博客迁移到新的VPS，并完成部署。一开始使用外网机器[hostmonster](hostmonster.com)，hostmonster还挺划算，￥700多一年，不限容量和流量，只是在米国的机器太慢。

后来公司运维同事提供了IDC支持，因此迁回，再后来是发生了点小意外，不得不从IDC迁出，自己找地儿放，综合考虑了下，打算试用下口碑不错的[Linode](https://www.linode.com/)，期间是各种折腾和走弯路，linux的东西还是定制化比较好，避免重复性的工作，在这里感慨下，做运维的童鞋也不容易哈～

### Linode账号注册

注册很方便，按照linode官网一步步下去就行，可以使用招商银行信用卡进行支付，注册完毕立马可以使用。打开linode的管理面板，里面列出了很详细的功能项，可以方便的查看拥有的各台VPS的运行状况、远程登录、对VPS进行配置、添加账号等等，可以说做的很成熟了。

### VPS的初始化和一些基本配置

进入管理页面，选择OS，这里选择熟悉的CentOS 6，选择东京机房，开始build，很快安装完成之后点击boot启动。  
接下来远程连接VPS，windows的话使用[putty](http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html)，这几天使用下来还挺满意，就是界面丑了点。mac就更方便了，系统自带的终端直连。再不然，linode还提供了便捷的Ajax Console登陆方式，只要点一下开个新窗口就可以登陆。只是在通过jax Console连接使用vi时会遇到串行的情况，这时候`ctrl + L`清下屏再`reset`重置下即可。  

接下来就开始搞机了：

#### 更新下系统软件
``` bash
yum update
```

#### 设置Hostname，给机器起个名字，ip记不住
``` bash
echo 'HOSTNAME=alloyteam' >> /etc/sysconfig/network
hostname 'alloyteam'
```

#### 设置下区时，设置为香港时间
``` bash
ln -sf /usr/share/zoneinfo/Hongkong /etc/localtime
```
其实就是做个软链接

#### 添加个用户，root权限太高
``` bash
adduser *[user]*
usermod -a -G sudo *[user]*
```
添加名为*user*的账户到admin组，在执行关键命令的时候需要`sudo`授权  
接着给*user*账户设置密码：`passwd *user`安提示输入两遍即可，至于声称ssh key什么的就算了，每次都输下密码感觉踏实些（心理作用），嘿嘿  
完成之后`logout`登出，用新账户登入

#### 简单配置下防火墙（iptables）
按照[教程](https://library.linode.com/securing-your-server)里写的，把rules规则贴到iptables.firewall.rules文件里，然后导入到iptables配置文件：
``` bash
iptables-restore < /etc/iptables.firewall.rules
```
接着再保存下即可
``` bash
service iptables save
```
查看防火墙规则
``` bash
iptables -L
```
查看过滤注释之后的iptables list
``` bash
cat /etc/sysconfig/iptables | grep -v '^#'
```

#### 安装LEMP环境
采用nginx+fastcgi作为反向代理和负载均衡器，并使用fastcgi处理php脚本，据说比apache要快，这个按照[文档](https://library.linode.com/lemp-guides/centos-6)一步步来就好了。  

下面是配置nginx，http部分再原来基础上开启gzip和设置下常用的文件mime types
``` nginx
include         mime.types;
gzip            on;
gzip_comp_level 5;
gzip_min_length 1024;
keepalive_timeout  65;
```
通过`include`的方式引入各反向代理的配置文件
``` nginx
include vhost/*.conf
```
接下来配置反向代理，由于主域名下有好多个子域名，各个站点又是彼此独立的文件夹，故这里采用泛域名解析：
``` nginx
server_name ~^(?<subdomain>.+)\.alloyteam\.com$;
root /[rootpath]/$subdomain;
\# error_log /[logpath]/$host.error.log error; # nginx日志不支持变量，蛋疼
\# access_log /[logpath]/$host.error.log combined;
error_log /[logpath]/alloysites.error.log error;
```
这里太坑了，log path不支持变量，想每个host指定一个log文件都不行，只能先合到一起，配置下log format来区分咯。    
*有个小工具`pcretest`可以测试下nginx配置的正则表达式*  
其他地方参考默认的配置即可，php文件的`fastcgi_param`参数作如下设置
``` nginx
fastcgi_param   domain $subdomain;
fastcgi_param   SCRIPT_FILENAME $document_root$fastcgi_script_name;
```
ok，完成，保存退出后，重启nginx，语法检查通过之后会看到显示`[ok]`字样，说明启动成功，配置生效
``` bash
service nginx restart
```

mysql的安装配置，指定下db path和log path
``` bash
vim /etc/my.cnf
```
设置开机启动以及重启
``` bash
chkconfig --add mysqld;chkconfig mysqld on;
/etc/init.d/mysqld restart
```
mysql数据库导入
``` sql
mysql -h localhost -d [db_name] -uroot -p[rootpass] < /tmp/localhost.sql --default-character-set=utf8; /* 导入sql */
insert into mysql.user(Host,User,Password) values("localhost","[user]",password("[pass])); /* 新建用户 */
grant all privileges on [dbname].* to [user]@localhost identified by '[pass]'; /* 分配权限 */
flush privileges; /* 刷新系统权限 */
```
根据需要重置下管理员账号密码
``` sql
update wp_users set user_pass=MD5("PASSWORD") where wp_users.user_nicename='[user]';
```

到此为止，算是基本完成wordpress站点的恢复，后面是准备搭建nodejs环境进行各种折腾。  

一开始比较盲目去配置，走了不少的弯路，因为一开始分配的ip被传说中的`GWT`给挡在墙外了，ssh和ftp连接一直不稳定，还以为是配置的原因，然后进行了很久的折腾配置，当时真的是想shi的心都有了。第二天果断寻求linode官方技术支持，没想到客服很给力，第一时间回复并给出解决建议，其中ip被墙那个，看得出来我们不是第一个，客服GG用很娴熟的语气说大概是你ip被**block**了，我给你换一个ip试试，然后，所有问题都不再是问题了！ 
