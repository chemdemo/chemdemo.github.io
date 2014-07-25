# JavaScript设计模式小计

参考书上的例子，仅供自己学习记录。

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

``` javascript
$('.btn').on('click', function() {
    var data = getDataById(this.data('id'));
    // TODO
});

// 不对外暴露内部实现细节，参数明了
function getDataById(id) {
    // code ...
};
```

## 装饰者模式

为对象添加属性和方法。

``` javascript
var student = {};

student.name = 'xiaoming';
student.say = function(sth) {
    console.log(sth);
};
student.scores = {};
student.scores.english = 82;
student.scores.math = 90;
```

## 组合模式

将所有对象组合成树形结构，使得用户只需要操作最上层的接口，就可以对所有成员做相同的操作，比较适合用在web动态用户界面。

``` javascript
var Gallery = function() {
    this.box = document.createElement('ul');
};

Gallery.prototype = {
    addPic: function(id, src) {
        var li = document.createElement('li');
        var img = document.createElement('img');

        img.src = src;
        li.id = id;

        li.appendChild(img);
        this.box.appendChild(li);
    },
    removePic: function(id) {},
    showGallery: function() {},
    getPic: function(id) {}
};
```

## 门面模式

提供统一的高层接口，内部则实现各个子系统不同的处理方式，比如用于处理浏览器差异。

``` javascript
var eventFactory = {
    addEvent: function(el, evt, handler) {
        if('addEventListener' in window) {
            el.addEventListener(evt, handler);
        } else if('attachEvent' in window) {
            el.attachEvent('on' + type, handler);
        } else {
            el['on' + type] = handler;
        }
    },
    delEvent: function(el, evt) {},
    getTarget: function(e) {
        return e.target || e.srcElement;
    }
};
```

## 适配器模式

用新的接口对现有接口的一个包装，它不会改变现有接口的工作。

``` javascript
var foo = function(strA, strB) {
    ;
};

var adapter = function(obj) {
    foo(obj.a, obj.b);
};
```

## 【参考】

- [javascript设计模式](http://www.cnblogs.com/Darren_code/archive/2011/08/31/JavascripDesignPatterns.html?a=1)

- [javascript设计模式](http://www.alloyteam.com/2012/10/commonly-javascript-design-pattern-observer-mode/)
