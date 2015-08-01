### WTS介绍

WTS，全称web terminal shell，在web窗口和远程服务器分别建立一个虚拟term，实现在web端输入命令并在远程机器上执行，然后把结果回写到web控制台。

### 系统架构

![wts architecture](https://raw.githubusercontent.com/chemdemo/wts-monit/master/images/architecture.png)

WTS分为两部分，其中monitor（[wts-monit](https://github.com/chemdemo/wts-monit)）用于web端输入以及管理remote clients，客户端模块（如[Node.js版](https://github.com/chemdemo/wts-node)）用于处理monit发来的指令。

monitor基于koa启动一个webserver，再使用websocket与前端实时互推数据。monit和remote client之间建立TCP长连接，client端掉线后会自动重连。

### 运行截图

![wts architecture](https://raw.githubusercontent.com/chemdemo/wts-monit/master/images/wts.png)


### 使用场景

- 偷懒：不用安装类似xshell的terminal软件了，开个网页即可连到服务器

- 当跳板机使用：由于安全限制，一般不直接登陆IDC机器，需要跳板机作为中转，做好权限控制即可。

### 如何使用

- #### monit机器

wts-monit已经作为node模块发布到npm，可以直接通过npm安装（选择一台与公网隔离的机器）：

``` bash
npm install wts-monit
```

安装好依赖模块之后即可启动monit（由于使用了koa框架，所以需要Node版本0.12+或者io.js）

``` bash
cd wts-monit && node index.js
```

或者推荐使用pm2来启动：

``` bash
pm2 start pm2_deploy.json
```


然后在浏览器打开`http://[monit host]:3005`即可看到web界面。

- #### client机器

接着在各remote机器上安装client模块：

``` bash
npm install wts-node
```

一般来说，一台remote机器上器启一个实例即可，然后为了方便管理，最好给remote机器分配一个group：

``` bash
cd wts-node && vim conf.js # 一般只需要设置group项即可
```

调试：

``` bash
node index.js
```

部署启动：

``` bash
pm2 start pm2_deploy.json
```
