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


### 基于桥协议的api设计

jsbridge作为一种通用私有协议，一般会在团队级或者公司级产品进行共享，所以需要和业务层进行解耦，将jsbridge的内部细节进行封装，对外暴露平台级的API。

【code...】

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

本质上，Native和H5都能完成界面开发。几乎所有hybrid的开发模式都会碰到同样的一个问题：哪些由Native负责哪些由H5负责。

这个回到原始的问题上来：我们为什么要采用hybrid模式开发？简而言之就是同时利用H5的跨平台、快速迭代能力以及Native的流畅性、系统API调用能力。

根据这个原则，为了充分利用二者的优势，应该尽可能地将app内容使用H5来呈现，而对于js语言本身的缺陷，应该使用Native语言来弥补，如转场动画、多线程作业（密集型任务）、本地存储。即总的原则是H5提供内容，Native提供容器，在有可能的条件下对Android原声webview进行优化和改造，提升H5的渲染效率。

整体架构：

![hybrid arch1](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/arch_1.png)

但是，在实际的项目中，将整个app所有界面都使用H5来开发也有不妥之处，根据经验，以下情形还是使用Native界面为好：

### 关键界面、交互性强的的界面使用Native

因H5比较容易被恶意攻击，对于安全性要求比较高的界面，如注册界面、登陆、支付等界面，会采用Native来取代H5开发，这些页面通常UI变更的频率也不高。

对于这些界面，降级的方案也有，就是HTTPS。但是想说的是在国内的若网络环境下，HTTPS的体验实在是不咋地（主要是慢），而且只能走现网不能走离线通道。

另外，H5本身的动画开发成本比较高，在低端机器上可能有些绕不过的性能坎，原生js对于手势的支持也比较弱，因此对于这些类型的界面，可以选择使用Native来实现，这也是Native本身的有时不是。比如要实现下面这个音乐播放界面，用H5开发门槛不小吧，留意下中间的波浪线背景，手指左右滑动可以切换动画。

![layout ui1](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/layout_1.jpg)

### 导航组件采用Native

导航组件，就是页面的头组件，左上角一般都是一个back键，中间一般都是界面的标题，右边的话有时是一个隐藏的悬浮菜单触发按钮有时则什么也没有。

移动端有一个特性就是界面下拉有个回弹效果，头不动body部分跟着滑动，这种效果H5比较难实现。

再者，也是最重要的一点，如果整个界面都是H5的，在H5加载过程中界面将是白屏，在弱网络下用户可能会很疑惑。

所以基于这两点，打开的界面都是Native的导航组件+webview来组成，这样即使H5加载失败或者太慢用户可以选择直接关闭。

在API层面，会相应的有一个接口来实现这一逻辑（例如叫`JSBridge.layout.setHeader`），下面代码表示定制一个只有back键和标题的导航组件:

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

![layout ui2](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/layout_2.jpg)

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

由于H5是在Native容器里进行加载和渲染，所以Native很容易对H5页面的行为进行监控，包括进度条、loading动画、404监控、5xx监控、网络诊断等，并且在H5加载异常时提供默认界面供用户操作，防止APP“假死”。

下面是微信的5xx界面示意：

![webview 5xx](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/hybrid/webview_1.png)

## 开发流程

## 离线包

http://o2o.meizu.com <=> /sdcard/0/o2o.meizu.com/
http://cdn.meizu.com <=> /sdcard/0/cdn.meizu.com/
