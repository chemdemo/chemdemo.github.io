## Node.js系列之——异常捕获

本篇谈谈Node.js捕获异常的一些探索。

采用事件轮训、异步IO等机制使得Node.js能够从容应对无阻塞高并发场景，令工程师很困扰的几个理解Node.js的地方除了它的事件（回调）机制，还有一个同样头痛的是异常代码的捕获。

### 早期的处理方式

一般情况下，我们会将有可能出错的代码放到`try/catch`块里。但是到了Node.js，由于`try/catch`无法捕捉异步回调里的异常，Node.js原生提供`uncaughtException`事件挂到`process`对象上，用于捕获所有未处理的异常：

``` javascript
process.on('uncaughtException', function(err) {
    console.error('Error caught in uncaughtException event:', err);
});

try {
    process.nextTick(function() {
        fs.readFile('non_existent.js', function(err, str) {
            if(err) throw err;
            else console.log(str);
        });
    });
} catch(e) {
    console.error('Error caught by catch block:', e);
}
```

执行的结果是代码进到了uncaughtException的回调里而不是catch块。

uncaughtException虽然能够捕获异常，但是此时错误的上下文已经丢失，即使看到错误也不知道哪儿报的错，定位问题非常的不利。而且一旦uncaughtException事件触发，整个node进程将crash掉，如果不做一些善后处理的话会导致整个服务挂掉，这对于线上的服务来说将是非常不好的。

### 使用domain模块捕捉异常

随Node.js v0.8版本发布了一个`[domain](http://nodejs.org/api/domain.html)`（域）模块，专门用于处理异步回调的异常，使用`domain`我们将很轻松的捕获异步异常：

``` javascript
process.on('uncaughtException', function(err) {
    console.error('Error caught in uncaughtException event:', err);
});

var d = domain.create();

d.on('error', function(err) {
    console.error('Error caught by domain:', err);
});

d.run(function() {
    process.nextTick(function() {
        fs.readFile('non_existent.js', function(err, str) {
            if(err) throw err;
            else console.log(str);
        });
    });
});
```

运行上面的代码，我们会看到错误被domain捕获到，并且uncaughtException回调并不会执行，事情似乎变得稍微容易些了。

但是如果研究domain模块的API很快我们会发现，domain提供了好几个方法，理解起来似乎不是那么直观（其实为啥这个模块叫“域(domain)”呢，总感觉些许别扭），这里简单解释下：

首先，关于domain模块，我们看到它的稳定性是2，也就是不稳定，API可能会变更。

默认情况下，domain模块是不被引入的，当`domain.create()`创建一个domain之后，调用`enter()`方法即可“激活”这个domain，具体表现为全局的进程（`process`）对象上会有一个domain属性指向之前创建的这个的domain实例，同时，domain模块上有个`active`属性也指向这个的domain实例。

结合`[should](https://github.com/visionmedia/should.js)`断言库测试下上面说的：

``` javascript
// domain was not exists by default
should.not.exist(process.domain);

var d = domain.create();

d.on('error', function(err) {
    console.log(err);
});

d.enter(); // makes d the current domain

process.domain.should.be.an.Object;
process.domain.should.equal(domain.active);

d.exit(); // makes d inactive

should.not.exist(process.domain);
```

执行之后发现几个断言都能pass。`exit()`方法的意思是退出当前“域”，将会影响到后续异步异常的捕获，后面会提到。

`enter`和`exit`组合调用这样会使代码有些混乱，尤其是当多个domain混合、嵌套使用时比较难理解。

这时候可以使用`run()`方法，`run()`其实就是对`enter`和`exit`以及回调的简单封装，即：run() -- callback() -- exit()这样，就像上面例子中的`run()`一样。

还有两个方法，`bind()`和`intercept()`：

`bind()`:

``` javascript
fs.readFile('non_existent.js', d.bind(function(err, buf) {
    if(err) throw err;
    else res.end(buf.toString());
}));
```

`intercept()`：
``` javascript
fs.readFile('non_existent.js', d.intercept(function(buf) {
    console.log(buf);
}));
```

用法差不多，只是intercept拦截了异步回调，如果抛出异常就自己处理掉了。

#### domain的隐式绑定

domain主要会影响`timers`模块（包括`setTimeout`, `setInterval`, `setImmediate`）, 事件循环`process.nextTick`，还有就是event。

实现的思路都差不多，都是通过注入domain代码到timer、nextTick、event模块中，在创建的时候检查当前有没有激活（active）的domain，有则记录下，如果是timer和nextTick，当在事件循环中执行回调的时候，把process.domain设置为之前记录的domain并把错误交给它处理。如果是event，多一步判断，先会把异常交给event自己定义的error事件处理。

这里要注意，如果这个domain没有绑定`error`事件的话，node会直接抛出错误，即使uncaughtException绑定了也没有用：

``` javascript
var d = domain.create();

process.on('uncaughtException', function(err) {
    console.error('Error caught in uncaughtException event:', err);
});

d.run(function() {
    process.nextTick(function() {
        fs.readFile('non_existent.js', function(err, str) {
            if(err) throw err;
            else console.log(str);
        });
    });
});
```

在这个例子里面，使用了domain捕获异常但是没有监听domain的error事件，监听了uncaughtException，但是还是抛出了异常，个人觉得这里设计不合理，domain没有errorHandle应该把异常交给全局的uncaughtException。

这里还有一个小问题，同时监听了uncaughtException和domain的error事件，在node v0.8里有个bug，uncaughtException和domain都能捕获异常，0.10+已经修复。

#### domain的显式绑定

上面没哟提到的两个API是`add()`和`remove()`，add作用是把domain创建之前创建的对象添加到这个domain里边，然后这个对象即可使用domain捕捉异常了，remove则相反。domain对象上有个numbers队列专门用于管理add后的对象。

这里可参考官方示例。
