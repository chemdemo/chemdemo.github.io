## Node.js异常捕获

本篇谈谈Node.js捕获异常的一些探索。

采用事件轮询、异步IO等机制使得Node.js能够从容应对无阻塞高并发场景，令工程师很困扰的几个理解Node.js的地方除了它的事件（回调）机制，还有一个同样头痛的是异常代码的捕获。

### try/catch之痛

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

随Node.js v0.8版本发布了一个[domain](http://nodejs.org/api/domain.html)（域）模块，专门用于处理异步回调的异常，使用`domain`我们将很轻松的捕获异步异常：

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

结合[should](https://github.com/visionmedia/should.js)断言库测试下上面说的：

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

bind:

``` javascript
fs.readFile('non_existent.js', d.bind(function(err, buf) {
    if(err) throw err;
    else res.end(buf.toString());
}));
```

intercept：

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

在这个例子里面，使用了domain捕获异常但是没有监听domain的error事件，监听了uncaughtException，但是还是抛出了异常，个人觉得觉得这里是个bug，domain没有errorHandle应该把异常交给全局的uncaughtException，后面有例子验证这一点。

还有一个小问题，同时监听了uncaughtException和domain的error事件，在node v0.8里有个bug，uncaughtException和domain都能捕获异常，0.10+已经修复。

#### domain的显式绑定

上面没有提到的两个API是`add()`和`remove()`，add作用是把domain创建之前创建的（EventEmitter实例）对象添加到这个domain里边，然后这个对象即可使用domain捕捉异常了，remove则相反。domain对象上有个numbers队列专门用于管理add后的对象。

这里可参考[官方示例](http://nodejs.org/api/domain.html#domain_explicit_binding)。

#### domain如何抛出异常

我们看[node源码](https://github.com/joyent/node/blob/v0.10.4/src/node.js#L43)有这么一行：

``` javascript
// do this good and early, since it handles errors.
startup.processFatal();
```

`processFatal`里边调用`process._fatalException()`，先判断是否存在process.domain，尝试把错误交给process.domain处理，如果不存在才交给uncaughtException处理，所以domain捕获异常的关键代码在[node.js#L219](https://github.com/joyent/node/blob/v0.10.4/src/node.js#L219)。

这里尝试修改下上面的例子，在抛出异常前把process.domain设为null：

``` javascript
d.run(function() {
    process.domain = null;
    process.nextTick(function() {
        fs.readFile('non_existent.js', function(err, str) {
            if(err) throw err;
            else console.log(str);
        });
    });
});
```

这下uncaughtException将捕获异常！

当上面提到的异常都没被捕获，进程将直接退出[node.js#L280](https://github.com/joyent/node/blob/v0.10.4/src/node.js#L280)：

``` javascript
// if someone handled it, then great.  otherwise, die in C++ land
// since that means that we'll exit the process, emit the 'exit' event
...
process.emit('exit', 1);
```

另外关于domain如何在多个不同的事件循环中传递，可以参考下[这篇](http://deadhorse.me/nodejs/2013/04/13/exception_and_domain.html)文章。

值得关注的是，并不是所有在domain域下创建的事件分发器（EventEmitter）上面的异步异常都能捕获：

``` javascript
var d = domain.create();
var msg;
var Msg = function() {
    events.EventEmitter.call(this);

    this.on('msg', function(msg) {
        console.log(msg);
    });

    this.send = function(msg) {
        this.emit('msg', msg);
    };

    this.read = function(file) {
        var root = this;
        fs.readFile(file, function(err, buf) {
            if(err) throw err;
            else root.send(buf.toString());
        });
    };
};

require('util').inherits(Msg, events.EventEmitter);

d.on('error', function(err) {
    console.error('Error caught by domain:', err);
});

d.run(function() {
    msg = new Msg();
});

msg.read('non_existent.js');
```

这个例子中，msg对象虽然是在domain中实例化，但是msg.send里边fs.readFile在执行回调的时候，process.domain是`undefined`。

我们稍微改造下，把readFile的回调绑定到domain上，或者把msg.send()的调用放到d.run()包裹，结果可预知，能正常捕获抛出的异常。为了验证，尝试改造下readFile：

``` javascript
fs.readFile(file, function(err, buf) {
    process.domain = d;
    if(err) throw err;
    else root.send(buf.toString());
});
```

这样亦可捕获异常，不过实际中不要这样写，还是要采用domain提供的方法。

#### 更好的使用domain

其实上，更推荐的做法是，如果在活动domain里面创建了事件分发器（EventEmitter）实例，我们应该尽可能的给它注册error事件，把错误都抛给这个EventEmitter实例处理，就像上面的例子，我们改造下，绑定error事件并把readFile的错误交给Msg实例处理：

``` javascript
this.on('error', function(err) {
    throw err;
});

this.read = function(file) {
    var root = this;
    fs.readFile(file, function(err, buf) {
        if(err) root.emit('error', err);
        else root.send(buf.toString());
    });
};
```

在书写Node.js代码的时候，对于事件分发器，应该养成先绑定（`on()`或`addEventListener()`）后触发（`emit()`）的习惯。在执行事件回调的时候，**对于有可能抛异常的情况，应该把emit放到domain里去**：

``` javascript
var d = domain.create();
var e = new events.EventEmitter();

d.on('error', function(err) {
    console.error('Error caught by domain:', err);
});

e.on('data', function(err) {
    if(err) throw err;
});

if(Math.random() > 0.5) {
    d.run(function() {
        e.emit('data', new Error('Error in domain runtime.'));
    });
} else {
    e.emit('data', new Error('Error without domain.'));
}
```

根据[domain#L187](https://github.com/joyent/node/blob/v0.10.4/lib/domain.js#L187)可知，run会把传进去的函数包装成另一个函数返回，并在这个返回的函数上设置domain：

``` javascript
b.domain = this;
```

events模块[events.js#L85](https://github.com/joyent/node/blob/v0.10.4/lib/events.js#L85)有这么一行：

``` javascript
if (this.domain && this !== process) this.domain.enter();
```

当调用e.emit()的时候，如果回调函数上挂有domain，则将这个domain激活，进而可以捕获异常。

#### domain的缺陷

有了domain，似乎异步异常捕捉已经不再是难事。Node.js允许创建多个domain实例，并允许使用add添加多个事件分发器给domain管理，，而且domain之间可以相互嵌套，而创建domain，是有一定的性能耗损的，这样带来了一个棘手的问题是：多个domain如何合理的创建与销毁，domain的运行期应该如何维护？

还有一点，domain并不能捕捉所有的异常，看[这里](https://github.com/domenic/domains-tragedy)。

#### domain实践

关于使用domain到集群环境，推荐都看看官方的说明：[Warning: Don't Ignore Errors!](http://nodejs.org/docs/latest/api/domain.html#domain_warning_don_t_ignore_errors)。把每一个网络请求都包在一个domain里边，捕获到异常时，不要立即退出进程，应该保证进程中其他连接正常退出之后再exit，官方推荐的是设一个定时器，过3min后退出进程，接下去做善后处理，然后应该返回应该有的错误（如500）给客户端。

对于connect或者express创建的web服务，有一个[domain-middleware](https://github.com/fengmk2/domain-middleware)中间件可以直接用，它会把next包装到一个已经定制好的domain里边。

在具体应用场景，应该uncaughtException事件配合domain来用。

本篇完，欢迎补充指正，所有用到的例子都在[这里](https://github.com/chemdemo/chemdemo.github.io/blob/master/demos/domain_demo.js)。

参考资料：

- [http://nodejs.org/docs/latest/api/domain.html](http://nodejs.org/docs/latest/api/domain.html)
- [https://github.com/joyent/node](https://github.com/joyent/node)
- [http://www.slideshare.net/domenicdenicola/domains-20010482](http://www.slideshare.net/domenicdenicola/domains-20010482)
- [http://deadhorse.me/nodejs/2013/04/13/exception_and_domain.html](http://deadhorse.me/nodejs/2013/04/13/exception_and_domain.html)
