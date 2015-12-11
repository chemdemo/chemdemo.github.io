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

### 异步的实现

ajax => 异步

JSBridge即我们通常说的桥协议，基本的通讯原理很简单，接下来就是桥协议具体实现。

### 基于桥协议的api设计


## 界面与交互（Native与H5职责划分）

## 开发调试

## 离线包
