# 前端知识体系整理（不断更新）

#### **——人脑不是机器，记忆都会退化，我们需要文档辅助作知识沉淀**

## javascript

#### 基本功

###### 语言特性

* 数据类型：

    * `Undefined`, `Null`, `Bollean`, `Number`, `String`

    * `Object`、`Array`

    * `Date`、`RegExp`

* typeof输出（以下六个值之一）：

    * `undefined`
    ``` javascript
    var x;
    typeof(x); // "undefined"
    ```

    * `boolean`
    ```javascript
    var x = false;
    typeof x; // "boolean"
    ```

    * `string`
    ```javascript
    var x = '';
    typeof x; // "string"
    ```

    * `number`
    ```javascript
    var x = NaN;
    typeof x; // "number"
    ```

    * `object`
    ```javascript
    var x = {};
    var y = [];
    var z = null;
    typeof x; // "object"
    typeof y; // "object"
    typeof z; // "object"
    ```

    * `function`
    ```javascript
    var x = function() {};
    typeof x; // "function"
    ```

###### 类型转换：

* 简单类型 -> 简单类型：
``` javascript
'1'-0; // 0, equal to Number(1)
```

* 简单类型 -> 对象（使用基本函数的构造函数：Number(), String(), Boolean()等生成）：
``` javascript
var n = 5;
console.log(n.toString(2)); // 快速进制转换
```

* 对象 -> 简单类型（参考[JavaScript 类型转换](http://www.ituring.com.cn/article/53351)）

    1. 隐式转换：除Date外，统统是先 `valueOf`、再 `toString`（`Date` 在 `+` 和 `==` 时优先转化为字串）：
    ``` javascript
    [] + 1; // 1
    ```

    2. 显式Number(对象)：先`valueOf`，再`toString()`，都不存在则返回`NaN`：
    ``` javascript
    Number({}); // NaN
    ```

    3. 显式String(对象)：先取`valueOf()`，再取`valueOf()`，都不存在则抛异常：
    ``` javascript
    String({}); // [object Object]
    ```

###### DOM操作（增、删、查、改、移、数据交换）

* `createElement`, `createTextNode`, `createDocumentFragment`, `appendChild`

* `removeChild`, `removeNode`

* `getElementById`, `getElementsByTagName`, `getElementsByClassName`, `querySelector`, `querySelectorAll`,  `parentNode`, `firstChild`, `lastChild`, `nextSibling`, `previousSibling`, `childNodes`

* `replaceChild`, `insertBefore`

* `getAttribute`, `setAttribute`, `data-x`, `jQuery.attr()`, `jQuery().prop()`, `jQuery().data()`, `classList`, `innerHTML`, `innerText`, `textContent`

###### 事件机制（IE vs W3C）

* 事件绑定与解绑：`addEventListener(type, handler, flag)`, `attechEvent('on' + type, handler)`, `removeEventListener(type, handler)`, `detechEvent('on' + type, handler)`

* 事件流：

    * 事件捕获流：沿着文档树由外到内

    * 事件对象
    ``` javascript
    function handler(e) {
        var e = e || window.event;
        var target = e.target || e.srcElement;
        // e.currentTarget 指的是绑定事件的元素，不一定和target是同一个
    }
    ```

    * 事件冒泡流：沿着文档树由内到外，load、unload、focus、blur、submit和change事件不支持冒

###### OOP（原型链、继承。。。）

* 比较（参考 [全面理解面向对象的 JavaScript](http://www.ibm.com/developerworks/cn/web/1304_zengyz_jsoo/)）

    * 基于类`Class`的面向对象，对象由类`Class`产生：如`Java`、`C#`

    * javascript：基于原型`prototype`的OOP，对象由构造器（构造函数）`constructor`利用原型`prototype`产生

* 生成js对象：

    1. 类JSON的对象字面量：简单直观，但不适用于复杂的对象（类）
    ``` javascript
    var Preson = {
        name: 'xiaoming',
        age: 15
    };
    ```

    2. 构造函数模式：存在内存浪费的问题，比如下面例子里的`this.city`，在内存里生成了多次
    ``` javascript
    var Person = function(name, age) {
        // 全部标记为私有成员
        this.name = name;
        this.age = age;
        this.city = 'shen zhen';
    };
    var xm = new Person('xiaoming', 15);
    var xl = new Person('xiaoli;, 20);
    ```

    3. 原型`prototype`模式：每次实例化只增加私有的对象属性（或方法）到实例中，所有实例的公有属性（或方法）指向同一个内存地址
    ``` javascript
    var Person = function(name, age) {
        // 对象的私有成员
        this.name = name;
        this.age = age;
    };
    Person.prototype.city = 'shen zhen';// 共有成员
    ```

* 对象的继承

    1. 非构造函数的继承：继承可以简单使用对象之间的深、浅拷贝

    2. 构造函数的继承：大多是基于原型的继承，但是阅读性差，也不利于扩展

        1. 借调：依赖apply或者call实现
        ``` javascript
        function A(name) {
            this.name = name;
        }
        function B(name, age) {
            A.apply(this, arguments);
            this.age = age;
        }
        ```

        2. 子类prototype引用父类的prototype
        ``` javascript
        function A() {}
        A.prototype.propA = 'a';
        A.prototype.propB = 'b';
        function B() {}
        B.prototype = A.prototype; // 原型链引用，改成B.prototype = new A();可以解决引用的问题
        B.prototype.propB = 'B'; // 函数重载
        B.prototype.constructor = B;
        var b = new B();
        ```
        A、B的prototype引用同一个地址，实时上A的prototype.constructor已经被改成了B

        3. 借用空函数的prototype，类似YUI的实现：
        ``` javascript
        function extend(sub, sup) {
            var _f = function() {};
            _f.prototype = sup.prototype;
            sub.prototype = new _f();
            sub.prototype.constructor = sub;
            sub.super = sup.prototype;// 保存原构造函数
            _f = null;
        }
        A.prototype.propA = 'a';
        A.prototype.propB = 'b';
        function B() {}
        extend(B, A);
        ```

        构造函数的继承，重要的是理解原型链`prototype chain`，继承基本就是原型链的拷贝或者引用。

        理解原型链`prototype chain`：
        ``` javascript
        function A() {}
        function B() {}
        B.prototype = new A();
        function C(x, y) {}
        C.prototype = new B();
        var c = new C();
        c.__proto__ === C.prototype;// true
        B.prototype.__proto__ === A.prototype;// true
        B.__proto__ === B.prototype;// true
        A.__proto__ === Function.prototype;// true
        A.prototype.__proto__ === Object.prototype;// true
        ```
        ***__proto__属性***：对象的`__proto__`指向`Object.prototype`，Function对象的`__proto__`指向构造函数的prototype。

    3. 类式继承：本质上还是使用构造函数的`prototype`，封装成类，典型的例子是jQuery之父*John Resig*的[Simple JavaScript Inheritance](http://ejohn.org/blog/simple-javascript-inheritance/)，其他类库也有各自的实现

        * Simple Inheritance的用法
        ``` javascript
        var Person = Class.extend({
            init: function(gender) {
                this.gender = gender;
            }
        });
        var Teacher = Person.extend({
            init: funciton(gender, name) {
                this._super(gender);
                this.name = name;
            },
            role: 'teacher',
            speek: function() {
                console.log('Hello, i am a %s.', this.role);
            }
        });
        var Student = Person.extend({
            init: funciton(gender, name) {
                this._super(gender);
                this.name = name;
            },
            role: 'student',
            speek: function() {
                console.log('Hello, i am a %s.', this.role);
            }
        });
        ```

###### 函数式编程、作用域、闭包、this

* 实参、形参
``` javascript
foo(1, 2);
function foo(a, b, c) {
    console.log(arguments.length);//2 实际传入的参数
    console.log(foo.length);//3 期望传入的参数
}
```

* 函数申明与函数表达式
``` javascript
function foo() {} // 函数申明
var foor = function foo() {};// 函数表达式
```
执行顺序：解析器会率先读取函数声明，所以在任何代码执行前函数申明可用
``` javascript
fn(2); // 4
function fn(n) {console.log(n);}
fn(2); // 4
function fn(n) {console.log(n*n);} //重载
fn(2); // 4
var fn = function(n) {console.log(++n);};// 函数表达式，按照申明的顺序执行
fn(2); // 3
```

* arguments, callee, caller, apply, call

    * `arguments`，类数组，类似的还有NodeList、classList等对象。根据ECMA-262的标准，arguments属性是基于传入的参数来新建arguments，不是基于命名参数的数量。

    * `arguments.callee`，返回正在执行的`Function`对象的一个引用
    ``` javascript
    function foo(n) {
        console.log(arguments.callee.arguments.length);
        console.log(arguments.callee.length);
    }
    foo(1, 2, 3);// 分别打出3，1
    ```

    * `arguments.caller`，返回调用这个`Function`对象的`Function`对象的引用

    * `apply`和`call`，传参不同，功能相同，都是把`Function`对象绑定到另外一个对象上去执行，其内的`this`指向这个对象

* 作用域

    * 函数的局部变量：函数形参、函数内部`var`声明的变量

    * 变量的查找（作用域链）：查找函数内部变量 -> 查找嵌套的外部函数 ...-> 查找window对象 -> 未定义

    * js中没有块级作用域，可以用匿名函数模拟

    * 未用关键字`var`申明的变量，会自动升级为全局变量挂到window上

    * 顶级作用域内使用`var`申明的变量是window对象的一个属性

* 闭包

    * 由于作用域的限制，函数外部不能访问函数内部的局部变量

    * 闭包就是能够读取其他函数内部变量的函数*引自[学习Javascript闭包](http://www.ruanyifeng.com/blog/2009/08/learning_javascript_closures.html)*
    ``` javascript
    function foo() {
        var x = 1;
        return function fn() { // closure
            return x;
        }
    }
    var bar = foo();
    console.log(bar()); // get the local variables in foo
    ```

    * 闭包的另一个作用是在内存中保存函数的局部变量，这有可能导致内存泄露

* this：函数中的`this`始终指向函数的调用者
``` javascript
function foo(x) {
    this.x = x;
}
foo(1); // 调用者是window，也可以window.foo()
console.log(window.x); // 1
var o = {};
o.foo = foo;
o.foo(2); //　调用者是o
console.log(o.x); // 2
console.log(window.x); // 1
```
[这里](http://www.veryued.org/2011/09/javascript-scope-closure-this/)有一篇详细的例子

###### Ajax（XMLHttpRequest vs ActiveXObject）

* 请求过程

    * 建立到服务器的新请求：`xhr.open()`

    * 向服务器发送请求：`xhr.send()`

    * 退出当前请求：`xhr.abort()`

    * 查询当前`HTML`的就绪状态：`xhr.readyState`

    * 服务器返回的请求响应文本：`xhr.responseText`

* RUST API：`POST`, `GET`, `PUT`, `DELETE`

    * GET：更多的用于**读**操作，参数暴露到url，（服务器端可能对）url长度有限制

    * POST：更多的用于**写**操作

* HTTP状态码

* XHR2

#### 跨域问题

* 跨域的形成（同源限制）：主域、子域、ip和域名、协议不同、端口不同

* 常用解决方案

    * **iframe+document.domain**：适用于垮子域的情况
    缺点是如果一个域名下存在安全问题，另一个域名下可能也会有问题，还有就是创建iframe的开销

    * **动态引入js脚本**：适合所有的跨域场景
    引入的脚本会立刻执行，存在安全风险
    要与远端沟通约定变量，增加了开发和维护成本

    * **iframe+location.hash**：适合各种场景下跨域
    iframe嵌套引用，开销更大
    会产生历史记录，url中暴露传递的内容

    * **iframe+window.name**：使用iframe的window.name从外域传递数据到本地域，适合各种场景下跨域且数据安全
    缺点是数据有大小限制

    * `postMessage`跨域通讯

#### jQuery

可阅读yuanyan同学的[jQuery编程实践](https://github.com/modulejs/pragmatic-jquery)

#### 安全问题

* XSS

* CSRF

* SQL注入

* 敏感信息采用安全传输（SSL/HTTPS）

* 上传限制（大小、mime类型、可执行文件）

* （服务器端）严格的路径限制，比如杜绝路径跳转

## css

* css盒子模型

* css的继承规则

* IE低版本的hacks

* 浏览器的怪异模式与标准模式

## 性能优化（最佳实践）

#### HTML优化

* 语意化`html`结构：SEO友好，利于维护

* 精简`html`结构：嵌套过复杂的结构会导致浏览器构建DOM树缓慢

* `html`最小化：html大小直接关系到下载速度，移除内联的css，javascript，甚至模板片，有条件的话尽可能压缩html，去除注释、空行等无用文本

* 总是设置文档字符集：如果不设置，浏览器在渲染页面前会做一些查找，先搜索可进行解析的字符

* 显式设置图片的宽高：减少页面重绘（参考[【高性能前端1】高性能HTML](http://www.alloyteam.com/2012/10/high-performance-html/)）

* 去除空链接属性（`img`、`link`、`script`、`iframe`元素的`src`或`href`属性被设置了，但是属性却为空）：部分浏览器依然会去请求空地址

* 正确的闭合标签：浏览器不一定会将它们*修复*成正确的格式

* 避免`@import`引入样式表：IE低版本浏览器会再页面构建好之后再去加载import的样式表，会导致白屏

* 样式表放`head`里，脚本延后引入

* 未完待续。。。

#### CSS优化

* 避免css表达式：css表达式会不断的重复计算，导致页面性能下降

* 避免AlphaImageLoader滤镜：这个滤镜的问题在于浏览器加载图片时它会终止内容的呈现并且冻结浏览器（引自[【高性能前端1】高性能CSS](http://www.alloyteam.com/2012/10/high-performance-css/)）

* 合并图片（css sprites）

* 尽量避免通配符选择器：*CSS选择器是从右到左进行规则匹配*，基于这个机制，浏览器会查找所有同类节点然后逐级往上查找，知道根节点，这样效率很低

* 尽量避免属性选择器（`\*=`, `|=`, `^=`, `$=`, `~=`）：正则表达式匹配比基于类别的匹配慢

* 移除无匹配的规则：缩减文档体积；浏览器会把所有的样式规则都解析后索引起来，即使是当前页面无匹配的规则

* 合并多条可合并的规则，使用简写：
``` css
.box {margin-top: 10px; margin-left: 5px; margin-bottom: 15px;} /* bad */
.box {margin: 10px 0 15px 5px;} /* better */
```

* 对IE浏览器单独使用hack：代码清晰易读，同时也减小样式体积

* 模块化css，最好能够组件化：查找、维护方便，同时也利于代码复用

* 完善注释

* 未完待列。。

#### JavaScript优化

* 尽量减少或最少化对DOM的操作（脱离文档流对DOM进行修改）

    * 隐藏元素，对其进行修改之后再显示

    * 使用文档片段`DocumentFragement`批量修改，最后再插入文档

    * 将元素拷贝一份，修改完之后再替换原有元素

* 谨慎操作节点集合NodeList（`images`, `links`, `forms`, `document.getElementsByTagName`）：
缓存NodeList以及NodeList.length的引用

* 尽量操作元素节点（DOM节点如`childNodes`, `firstChild`不区分元素节点和其他类型节点，但大部分情况下只需要访问元素节点*引自《高性能JavaScript》*）：

    * `children`代替`childNodes`

    * `childElementCount`代替`childNodes.length`

    * `firstElementChild`代替`firstChild`

    * ...

* 读写分离，减少layout：
``` javascript
x = box.offsetLeft; // read
box.offsetLeft = '100px'; // write
y = box.offsetTop; // read
box.offsetTop = '100px'; // write
```
这个过程造成了两次的layout，可做如下改造：
``` javascript
x = box.offsetLeft; // read
y = box.offsetTop; // read
box.offsetLeft = '100px'; // write
box.offsetTop = '100px'; // write
```

* 最小化重排（`repeat`）：
``` javascript
box.style.width = '100px';
box.style.heihgt = '50px;';
box.style.left = '200px';
```
三个操作都会重新计算元素的几何结构，在部分浏览器可能会导致3次重排，可做如下改写：
``` javascript
var css = 'width: 100px; height: 50px; left: 200px;';
box.style.cssText += css;
```

* 使用事件委托：充分利用冒泡机制，减少事件绑定

* 无阻塞加载：脚本延后加载，合并加载，并行加载

* 函数内部的变量尽可能使用局部变量，缩短变量作用域的查找时间

* 缓存对象引用：
``` javascript
var a = $('#box .a');
var b = $('#box .b');
```
可以缓存`$('#box')`到临时变量：
``` javascript
var box = $('#box');
var a = box.find('.a');
var b = box.find('.b');
```

* 减少多级引用：
``` javascript
var $P = Jx().UI.Pager.create();// 同样可以先缓存结果
```

* 缓存Ajax：

    * 缓存Ajax数据，利用本地存储或者临时变量，存储不需要实时更新的数据

    * 设置HTTP `Expires`信息

* 复杂的计算考虑使用`Web Worker`

#### jQuery性能优化

###### 合理使用选择器

* id和标签选择器最快，因为是直接调用原生API
``` javascript
$('#box'); // document.getElementById | document.querySelector
$('div'); // document.getElementsByTagName
```

* 类选择器在低版本浏览器较慢，伪元素、属性选择器在不支持`querySelector`的浏览器很慢

* 尽可能优先使用符合CSS语法规范的CSS选择器表达式，以此来避免使用jQuery自定义的选择器表达式，因为当jQuery遇到单个id, 标签名，类名，选择器就会快速调用浏览器支持的DOM方法查询
``` javascript
$('input[checked="checked"]'); // 比较快
$('input:checked'); // 较慢
```

* 优先选择`$.fn.find`查找子元素，因为`find`之前的选择器并没有使用 jQuery 自带的 Sizzle 选择器引擎，而是使用原生API查找元素
``` javascript
$('#parent').find('.child'); // 最快
$('.child', $('#parent')); // 较快，内部会转换成第一条语句的形式，性能有一定损耗
$('#parent .child'); // 不如上一个语句块
```

* 使用组合选择器时，尽可能让右端更明确，因为Sizzle引擎是从右到左进行匹配的
``` javascript
$('div.foo .bar'); // slow
$('.foo div.bar'); // faster
```

* 避免过度具体，简洁的 DOM 结构也有助于提升选择器的性能
``` javascript
$('.foo .bar .baz');
$('.foo div.baz'); // better
```

* 尽量避免使用通配符选择器

###### 尽可能的少创建jQuery对象

* 如`document.getElementById('el')`比`$('#el')`块

* 如获取元素id：
``` javascript
$('div').click(function(e) {
    // 生成了个jQuery对象
    var id = $(this).attr('id');
    // 这样更直接
    var id = this.id;
});
```

* 使用链式调用缓存jQuery对象
``` xml
<div id="user" class="none">
    <p class="name"></p>
    <p class="city"></p>
</div>
```
``` javascript
$('#user')
    .find('.name').html('zhangsan').end()
    .find('.city').html('shenzhen').end()
    .removeClass('none');
```

* 做好jQuery对象缓存
``` javascript
var box = $('.box');
box.find('> .cls1');
box.find('> .cls2');
```

###### 避免频繁操作DOM

* 复杂操作把元素从DOM中移除再操作
``` javascript
var $el = $('.box').detach();
var $p = $el.parent();
// do some stuff with $el...
$p.append($el);
```

* 在循环外执行DOM修改
``` javascript
// 性能差
$.each(arr, function(i, el) {
	$('.box').prepend($(el));
});
// 较好的做法
var frag = document.createDocumentFragment();
$.each(arr, function(i, el) {
	flag.appendChild(el);
});
$('.box')[0].appendChild(flag);
```

###### 使用事件代理
``` javascript
$('ul li').on('click', fn);
// better
$('ul').on('click', 'li', fn);
```
使用事件代理（委托），当有新元素添加进来的时候，不需要再为它绑定事件，这里有[demo](http://jsfiddle.net/chemdemo/xy46G/2/)可以查看效果。

#### 整体优化

* 雅虎34条：合并压缩文件和图片、gzip/deflate、CDN、HTTP头设置Cache-Control/Expires和Last-Modified/ETag、并行下载与DNS查询的平衡等

* 缓存静态文件，尽可能采用CDN策略，并采用不带cookie的独立域名存放，并开启`keep-alive`

* 动态与静态结合，服务器端拼凑页面片，最快展现给用户，缩短白屏时间和页面可用时间，非首屏数据懒加载

* 内容分开存放，比如图片和ajax分别采用不用的服务器（域名下）

* 保证单个html的http请求数最少

* 确保网站有favicon.ico文件（浏览器会自动请求favicon.ico，如果不存在则会出现大量的404消耗带宽）

* 未完待续。。。

#### 【参考文献】

* [JavaScript 类型转换](http://www.ituring.com.cn/article/53351)

* [全面理解面向对象的 JavaScript](http://www.ibm.com/developerworks/cn/web/1304_zengyz_jsoo/)

* [Simple JavaScript Inheritance](http://ejohn.org/blog/simple-javascript-inheritance/)

* [学习Javascript闭包（Closure）](http://www.ruanyifeng.com/blog/2009/08/learning_javascript_closures.html)

* [JavaScript作用域、闭包、this的学习笔记](http://www.veryued.org/2011/09/javascript-scope-closure-this/)

* [jQuery 性能优化最佳实践](http://www.libuchao.com/2012/03/12/jquery-performance-best-practices/)

* [web安全实战](https://github.com/DoubleSpout/threadAndPackage/blob/master/web_safety.md)

* [Web开发中需要了解的东西](http://coolshell.cn/articles/6043.html)
