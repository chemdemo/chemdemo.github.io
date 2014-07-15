# JavaScript设计模式小计

## 单例模式

主要用来划分命名空间

``` javascript
var People = {
    name: 'xiaoming',
    age: 25,
    say: function(sth) {
        console.log(sth)
    }
};
```

或者：

``` javascript
function People() {
    this.name = 'xiaoming';
    this.getName = function() {
        return this.name;
    }
    this.say = function(sth) {}
};

## 简单工厂模式

``` javascript
// js对象就是最简单的工厂模式
var cache = {
    init: function() {},
    get: function(key) {},
    set: function(key, value) {}
};

// 还有函数
function Request() {};

Request.createXHR = function() {
    return window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
};
```

## 桥梁模式

将抽象部分与它的实现部分分离，多用于API设计。

