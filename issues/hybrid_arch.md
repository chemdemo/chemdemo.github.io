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

### 桥协议的具体实现

由于JavaScript语言自身的特殊性（单进程），为了不阻塞主进程并且保证H5调用的有序性，与Native通讯时对于需要获取结果的接口，采用类似于JSONP的设计理念:

【图 类JSONP的通讯机制】

类比HTTP的request和response对象，调用方会将调用的api、参数、以及请求签名（由调用方生成）带上传给被调用方，被调用方处理完之后会吧结果以及请求签名回传调用方，调用方再根据请求签名找到本次请求对应的回调函数并执行，至此完成了一次通讯闭环。

【图 H5调用Android示例】

【图 Android调用H5】


### 基于桥协议的api设计

jsbridge作为一种通用私有协议，一般会在团队级或者公司级产品进行共享，所以需要和业务层进行解耦，将jsbridge的内部细节进行封装。

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

本质上，Native和H5都能完成界面开发。几乎所有hybrid的开发模式都会碰到同样的一个问题：哪些由Native负责哪些由H5负责。这个根据笔者经验，

// mockplus

## 开发调试

## 离线包

http://o2o.meizu.com <=> /sdcard/0/o2o.meizu.com/
http://cdn.meizu.com <=> /sdcard/0/cdn.meizu.com/
