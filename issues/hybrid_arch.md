# Hybrid APP架构设计思路

关于Hybrid开发app的好处，网络上已有很多文章阐述了，这里不展开。

本文将从以下几个方面阐述Hybrid app架构设计的一些经验和思考。

## 通讯

作为一种跨语言开发模式，通讯层是Hybrid架构首先应该考虑和设计的，往后所有的逻辑都是基于通讯层展开。

Native（以Android为例）和H5通讯，基本原理：

- Android调用H5：通过webview类的`loadUrl`方法可以直接执行js代码，类似浏览器地址栏输入一段js一样的效果

``` java
webview.loadUrl("javascript: alert('hello world')");
```

- H5调用Android：webview可以拦截H5发起的任意url请求，webview通过约定的规则对拦截到的url进行处理（消费），即可实现H5调用Android

``` js
var ifm = document.createElement('iframe');
ifm.src = 'jsbridge://namespace.method?[...args]';
```

JSBridge即我们通常说的桥协议，基本的通讯原理很简单，接下来就是桥协议具体实现。

P.S：注册私有协议的做法很常见，我们经常遇到的在网页里拉起一个系统app就是采用私有协议实现的。app在安装完成之后会注册私有协议到OS，浏览器发现自身不能是别的协议（http、https、file等）时，会将链接抛给OS，OS会寻找可识别此协议的app并用该app处理链接。比如在网页里以`itunes://`开头的链接是Apple Store的私有协议，点击后可以启动Apple Store并且跳转到相应的界面。国内软件开发商也经常这么做，比如支付宝的私有协议`alipay://`，腾讯的`tencent://`等等。

### 桥协议的具体实现

由于JavaScript语言自身的特殊性（单进程），为了不阻塞主进程并且保证H5调用的有序性，与Native通讯时对于需要获取结果的接口，采用类似于JSONP的设计理念:

![hybrid jsbridge1](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/jsbridge_1.png)

类比HTTP的request和response对象，调用方会将调用的api、参数、以及请求签名（由调用方生成）带上传给被调用方，被调用方处理完之后会吧结果以及请求签名回传调用方，调用方再根据请求签名找到本次请求对应的回调函数并执行，至此完成了一次通讯闭环。

H5调用Native（以Android为例）示意图：

![hybrid jsbridge2](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/jsbridge_2.png)

Native（以Android为例）调用H5示意图：

![hybrid jsbridge3](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/jsbridge_3.png)


### 基于桥协议的api设计（HybridApi）

jsbridge作为一种通用私有协议，一般会在团队级或者公司级产品进行共享，所以需要和业务层进行解耦，将jsbridge的内部细节进行封装，对外暴露平台级的API。

以下是笔者剥离公司业务代码后抽象出的一份HybridApi的实现，项目地址：

[hybrid](#)

另外，对于Native提供的各种接口，也可以简单封装下，使之更贴近前端工程师的使用习惯：

``` js
// /lib/jsbridge/core.js
function assignAPI(name, callback) {
    var names = name.split(/\./);
    var ns = names.shift();

    var fnName = names.pop();
    var root = createNamespace(JSBridge[ns], names);

    if(fnName) root[fnName] = callback || function() {};
}
```

增加api：

``` js
// /lib/jsbridge/api.js
var assign = require('./core.js').assignAPI;
...
assign('util.compassImage', function(path, callback, quality, width, height) {
    JSBridge.invokeApp('os.getInfo', {
        path: path,
        quality: quality || 80,
        width: width || 'auto',
        height: height || 'auto',
        callback: callback
    });
});
```

H5上层应用调用：
``` js
// h5/music/index.js
JSBridge.util.compassImage('http://cdn.foo.com/images/bar.png', function(r) {
    console.log(r.value); // => base64 data
});
```

## 界面与交互（Native与H5职责划分）

本质上，Native和H5都能完成界面开发。几乎所有hybrid的开发模式都会碰到同样的一个问题：哪些由Native负责哪些由H5负责？

这个回到原始的问题上来：我们为什么要采用hybrid模式开发？简而言之就是同时利用H5的跨平台、快速迭代能力以及Native的流畅性、系统API调用能力。

根据这个原则，为了充分利用二者的优势，应该尽可能地将app内容使用H5来呈现，而对于js语言本身的缺陷，应该使用Native语言来弥补，如转场动画、多线程作业（密集型任务）、IO性能等。即总的原则是H5提供内容，Native提供容器，在有可能的条件下对Android原生webview进行优化和改造（参考阿里Hybrid容器的JSM），提升H5的渲染效率。

但是，在实际的项目中，将整个app所有界面都使用H5来开发也有不妥之处，根据经验，以下情形还是使用Native界面为好：

### 关键界面、交互性强的的界面使用Native

因H5比较容易被恶意攻击，对于安全性要求比较高的界面，如注册界面、登陆、支付等界面，会采用Native来取代H5开发，保证数据的安全性，这些页面通常UI变更的频率也不高。

对于这些界面，降级的方案也有，就是HTTPS。但是想说的是在国内的若网络环境下，HTTPS的体验实在是不咋地（主要是慢），而且只能走现网不能走离线通道。

另外，H5本身的动画开发成本比较高，在低端机器上可能有些绕不过的性能坎，原生js对于手势的支持也比较弱，因此对于这些类型的界面，可以选择使用Native来实现，这也是Native本身的有时不是。比如要实现下面这个音乐播放界面，用H5开发门槛不小吧，留意下中间的波浪线背景，手指左右滑动可以切换动画。

![layout ui1](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/layout_1.png)

### 导航组件采用Native

导航组件，就是页面的头组件，左上角一般都是一个back键，中间一般都是界面的标题，右边的话有时是一个隐藏的悬浮菜单触发按钮有时则什么也没有。

移动端有一个特性就是界面下拉有个回弹效果，头不动body部分跟着滑动，这种效果H5比较难实现。

再者，也是最重要的一点，如果整个界面都是H5的，在H5加载过程中界面将是白屏，在弱网络下用户可能会很疑惑。

所以基于这两点，打开的界面都是Native的导航组件+webview来组成，这样即使H5加载失败或者太慢用户可以选择直接关闭。

在API层面，会相应的有一个接口来实现这一逻辑（例如叫`JSBridge.layout.setHeader`），下面代码演示定制一个只有back键和标题的导航组件:

``` js
// /h5/pages/index.js
JSBridge.layout.setHeader({
    background: {
        color: '#00FF00',
        opacity: 0.8
    },
    buttons: [
        // 默认只有back键，并且back键的默认点击处理函数就是back()
        {
            icon: '../images/back.png',
            width: 16,
            height: 16,
            onClick: function() {
                // todo...
                JSBridge.back();
            }
        },
        {
            text: '音乐首页',
            color: '#00FF00',
            fontSize: 14,
            left: 10
        }
    ]
});
```

上面的接口，可以满足绝大多数的需求，但是还有一些特殊的界面，通过H5代码控制生成导航组件这种方式达不到需求：

![layout ui2](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/layout_2.png)

如上图所示，界面含有tab，且可以左右滑动切换，tab标题的下划线会跟着手势左右滑动。大多见于app的首页（mainActivity）或者分频道首页，这种界面一般采用定制webview的做法：定制的导航组件和内容框架（为了支持左右滑动手势），H5打开此类界面一般也是开特殊的API：

``` js
// /h5/pages/index.js
// 开打音乐频道下“我的音乐”tab
JSBridge.view.openMusic({'tab': 'personal'});
```

这种打开特殊的界面的API之所以特殊，是因为它内部要么是纯Native实现，要么是和某个约定的html文件绑定，调用时打开指定的html。假设这个例子中，tab内容是H5的，如果H5是SPA架构的那么`openMusic({'tab': 'personal'})`则对应`/music.html#personal`这个url，反之多页面的则可能对应`/mucic-personal.html`。

至于一般的打开新界面，则有两种可能：

- app内H5界面

    指的是由app开发者开发的H5页面，也即是app的功能界面，一般互相跳转需要转场动画，打开方式是采用Native提供的接口打开，例如：

    ``` js
    JSBridge.view.openUrl({
        url: '/music-list.html',
        title: '音乐列表'
    });
    ```

    再配合下面即将提到的离线访问方式，基本可以做到模拟Native界面的效果。

- 第三方H5页面

    指的是app内嵌的第三方页面，一般由`a`标签直接打开，没有转场动画，但是要求打开webview默认的历史列表，以免打开多个链接后点回退直接回到Native主界面。


### 系统级UI组件采用Native

基于以下原因，一些通用的UI组件，如alert、toast等将采用Native来实现：

- H5本身有这些组件，但是通常比较简陋，不能和APP UI风格统一，需要再定制，比如alert组件背景增加遮罩层

- H5来实现这些组件有时会存在坐标、尺寸计算误差，比如笔者之前遇到的是页面load异常需要调用对话框组件提示，但是这时候页面高度为0，所以会出现弹窗“消失”的现象

- 这些组件通常功能单一但是通用，适合做成公用组件整合到HybridApi里边

下面代码演示H5调用Native提供的UI组件：

``` js
JSBridge.ui.toast('Hello world!');
```

### 默认界面采用Native

由于H5是在H5容器里进行加载和渲染，所以Native很容易对H5页面的行为进行监控，包括进度条、loading动画、404监控、5xx监控、网络诊断等，并且在H5加载异常时提供默认界面供用户操作，防止APP“假死”。

下面是微信的5xx界面示意：

![webview monitor](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/webview-monitor.png)

## 设计H5容器

Native除了负责部分界面开发和公共UI组件设计之外，作为H5的runtime，H5容器是hybrid架构的核心部分，为了让H5运行更快速稳定和健壮，还应当提供并但不局限于下面几方面。

### H5离线访问

之所以选择hybrid方式来开发，其中一个原因就是要解决webapp访问慢的问题。即使我们的H5性能优化做的再好服务器在牛逼，碰到蜗牛一样的运营商网络你也没辙，有时候还会碰到流氓运营商再给webapp插点广告。。。哎说多了都是泪。

离线访问，顾名思义就是将H5预先放到用户手机，这样访问时就不会再走网络从而做到看起来和Native APP一样的快了。

但是离线机制绝不是把H5打包解压到手机sd卡这么简单粗暴，应该解决以下几个问题：

1. H5应该有线上版本

    作为访问离线资源的降级方案，当本地资源不存在的时候应该走现网去拉取对应资源，保证H5可用。另外就是，对于H5，我们不会把所有页面都使用离线访问，例如活动页面，这类快速上线又快速下线的页面，设计离线访问方式开发周期比较高，也有可能是页面完全是动态的，不同的用户在不同的时间看到的页面不一样，没法落地成静态页面，还有一类就是一些说明类的静态页面，更新频率很小的，也没必要做成离线占用手机存储空间。

2. 开发调试&抓包

    我们知道，基于file协议开发是完全基于开发机的，代码必须存放于物理机器，这意味着修改代码需要push到sd卡再看效果，虽然可以通过假链接访问开发机本地server发布时移除的方式，但是个人觉得还是太麻烦易出错。

为了实现同一资源的线上和离线访问，Native需要对H5的静态资源请求进行拦截判断，将静态资源“映射”到sd卡资源，即实现一个处理H5资源的本地路由，暂且称之为`Local Url Router`，下一节是具体实现。

### H5离线动态更新机制

将H5资源放置到本地离线访问，最大的挑战就是本地资源的动态更新如何设计，这部分可以说是最复杂的了，因为这同时涉及到H5、Native和服务器三方，覆盖式离线更新示意图如下：

![workflow](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/workflow.png)

解释下上图，开发阶段H5代码可以通过HTTP代理方式直接访问开发机。完成开发之后，将H5代码推送到管理平台进行构建、打包，然后管理平台再通过事先设计好的长连接通道将H5新包信息推送给客户端，客户端收到更新指令后开始下载新包、对包进行完整性校验、merge回本地对应的包，更新结束。

其中，管理平台推送给客户端的信息主要包括项目名（包名）、版本号、更新策略（增量or全量）、包CDN地址、MD5等。

通常来说，H5资源分为两种，经常更新的业务代码和不经常更新的框架、库代码和公用组件代码，为了实现离线资源的共享，在H5打包时可以采用分包的策略，将公用部分单独打包，在本地也是单独存放，分包及合并示意图：

![multi package](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/multi-pack.png)

### Local Url Router

到目前为止，离线资源更新的问题解决了，剩下的就是如何使用离线资源了。

上面已经提到，对于H5的请求，线上和离线采用相同的url访问，这就需要H5容器对H5的资源请求进行拦截“映射”到本地，暂且将实现这一逻辑的模块成为`Local Url Router`。

Local Url Router主要负责H5静态资源请求的分发（线上资源到sd卡资源的映射），但是不管是白名单还是过滤静态文件类型，Native拦截规则和映射规则将变得比较复杂。这里，[阿里去啊app](http://www.infoq.com/cn/presentations/look-the-fusion-of-web-and-native-from-the-architecture-evolution-of-alitrip)的思路就比较赞，我们借鉴一下，将映射规则交给H5去生成：H5开发完成之后会扫描H5项目然后生成一份线上资源和离线资源路径的映射表（souce-router.json），H5容器只需负责解析这个映射表即可。

H5资源包解压之后在本地的目录结构类似：

``` bash
$ cd h5 && tree
.
├── js/
├── css/
├── img/
├── pages
│   ├── index.html
│   └── list.html
└── souce-router.json
```

souce-router.json的数据结构类似：

``` js
{
    "protocol": "http",
    "host": "o2o.xx.com",
    "localRoot": "[/storage/0/data/h5/o2o/]",
    "localFolder": "o2o.xx.com",
    "rules": {
        "/index.html": "pages/index.html",
        "/js/": "js/"
    }
}
```

H5容器拦截到静态资源请求时，如果本地有对应的文件则直接读取本地文件返回，否则发起HTTP请求获取线上资源，如果设计完整一点还可以考虑同时开启新线程去下载这个资源到本地，下次就走离线了。

下图反应了资源在app内部的访问流程图：

![url router](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/url-router.png)

其中proxy指的是开发时手机设置代理http代理到开发机。

### 数据通道

- 上报

 由于界面由H5和Native共同完成，界面上的用户交互埋点数据最好由H5容器统一采集、上报，还有，由页面跳转产生的浏览轨迹（转化漏斗），也由H5容器记录和上报

- ajax代理

 因ajax受同源策略限制，可以在hybridApi层对ajax进行统一封装，同时兼容H5容器和浏览器runtime，采用更高效的通讯通道加速H5的数据传输

### Native对H5的扩展

主要指扩展H5的硬件接口调用能力，比如屏幕旋转、摄像头、麦克风、位置服务等等，将Native的能力通过接口的形式提供给H5。

## 综述

最后来张图总结下，hybrid客户端整体架构图：

![hybrid architecture](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/architecture.png)

其中的`Synchronize Service`模块表示和服务器的长连接通信模块，用于接受服务器端各种推送，包括离线包等。`Source Merge Service`模块表示对解压后的H5资源进行更新，包括增加文件、以旧换新以及删除过期文件等。

可以看到，hybrid模式的app架构，最核心和最难的部分都是H5容器的设计。
