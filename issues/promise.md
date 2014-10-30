# JavaScript Promise启示录

本篇，主要普及promise的用法。

一直以来，JavaScript处理异步都是以callback的方式，在前端开发领域callback机制几乎深入人心。在设计API的时候，不管是浏览器厂商还是SDK开发商亦或是各种类库的作者，基本上都已经遵循着callback的套路。

近几年随着JavaScript开发模式的逐渐成熟，CommonJS规范顺势而生，其中就包括提出了Promise规范，Promise完全改变了js异步编程的写法，让异步编程变得十分的易于理解。

在callback的模型里边，我们假设需要执行一个异步队列，代码看起来可能像这样：

``` javascript
loadImg('a.jpg', function() {
	loadImg('b.jpg', function() {
    	loadImg('c.jpg', function() {
        	console.log('all done!');
        });
    });
});
```

这也就是我们常说的回调金字塔，当异步的任务很多的时候，维护大量的callback将是一场灾难。当今Node.js大热，好像很多团队都要用它来做点东西以沾沾“洋气”，曾经跟一个运维的同学聊天，他们也是打算使用Node.js做一些事情，可是一想到js的层层回调就望而却步。

好，扯淡完毕，下面进入正题。

Promise可能大家都不陌生，因为Promise规范已经出来好一段时间了，同时Promise也已经纳入了ES6，而且高版本的chrome、firefox浏览器都已经原生实现了Promise，只不过和现如今流行的类Promise类库相比少些API。

所谓Promise，字面上可以理解为“承诺”，就是说A调用B，B返回一个“承诺”给A，然后A就可以在写计划的时候这么写：当B返回结果给我的时候，A执行方案S1，反之如果B因为什么原因没有给到A想要的结果，那么A执行应急方案S2，这样一来，所有的潜在风险都在A的可控范围之内了。

上面这句话，翻译成代码类似：

``` javascript
var resB = B();
var runA = function() {
	resB.then(execS1, execS2);
};
runA();
```

只看上面这行代码，好像看不出什么特别之处。但现实情况可能比这个复杂许多，A要完成一件事，可能要依赖不止B一个人的响应，可能需要同时向多个人询问，当收到所有的应答之后再执行下一步的方案。最终翻译成代码可能像这样：

``` javascript
var resB = B();
var resC = C();
...

var runA = function() {
    reqB
        .then(resC, execS2)
        .then(resD, execS3)
        .then(resE, execS4)
        ...
        .then(execS1);
};

runA();
```

在这里，当每一个被询问者做出不符合预期的应答时都用了不同的处理机制。事实上，Promise规范没有要求这样做，你甚至可以不做任何的处理（即不传入then的第二个参数）或者统一处理。

好了，下面我们来认识下[Promise/A+规范](http://promises-aplus.github.io/promises-spec/)：

- 一个promise可能有三种状态：等待（pending）、已完成（fulfilled）、已拒绝（rejected）

- 一个promise的状态只可能从“等待”转到“完成”态或者“拒绝”态，不能逆向转换，同时“完成”态和“拒绝”态不能相互转换

- promise必须实现`then`方法（可以说，then就是promise的核心），而且then必须返回一个promise，同一个promise的then可以调用多次，并且回调的执行顺序跟它们被定义时的顺序一致

- then方法接受两个参数，第一个参数是成功时的回调，在promise由“等待”态转换到“完成”态时调用，另一个是失败时的回调，在promise由“等待”态转换到“拒绝”态时调用。同时，then可以接受另一个promise传入，也接受一个“类then”的对象或方法，即thenable对象。

可以看到，Promise规范的内容并不算多，大家可以试着自己实现以下Promise。

以下是笔者自己在参考许多类Promise库之后简单实现的一个Promise，代码请移步[promiseA](https://github.com/chemdemo/promiseA/blob/master/lib/Promise.js)。

简单分析下思路：

构造函数Promise接受一个函数`resolver`，可以理解为传入一个异步任务，resolver接受两个参数，一个是成功时的回调，一个是失败时的回调，这两参数和通过then传入的参数是对等的。

其次是then的实现，由于Promise要求then必须返回一个promise，所以在then调用的时候会新生成一个promise，挂在当前promise的`_next`上，同一个promise多次调用都只会返回之前生成的`_next`。

由于then方法接受的两个参数都是可选的，而且类型也没限制，可以是函数，也可以是一个具体的值，还可以是另一个promise。下面是then的具体实现：

``` javascript
Promise.prototype.then = function(resolve, reject) {
    var next = this._next || (this._next = Promise());
    var status = this.status;
    var x;

    if('pending' === status) {
        isFn(resolve) && this._resolves.push(resolve);
        isFn(reject) && this._rejects.push(reject);
        return next;
    }

    if('resolved' === status) {
        if(!isFn(resolve)) {
            next.resolve(resolve);
        } else {
            try {
                x = resolve(this.value);
                resolveX(next, x);
            } catch(e) {
                this.reject(e);
            }
        }
        return next;
    }

    if('rejected' === status) {
        if(!isFn(reject)) {
            next.reject(reject);
        } else {
            try {
                x = reject(this.reason);
                resolveX(next, x);
            } catch(e) {
                this.reject(e);
            }
        }
        return next;
    }
};
```

这里，then做了简化，其他promise类库的实现比这个要复杂得多，同时功能也更多，比如还有第三个参数——notify，表示promise当前的进度，这在设计文件上传等时很有用。对then的各种参数的处理是最复杂的部分，有兴趣的同学可以参看其他类Promise库的实现。

在then的基础上，应该还需要至少两个方法，分别是完成promise的状态从pending到resolved或rejected的转换，同时执行相应的回调队列，即`resolve()`和`reject()`方法。

到此，一个简单的promise就设计完成了，下面简单实现下两个promise化的函数：

``` javascript
function sleep(ms) {
	return function(v) {
    	var p = Promise();

        setTimeout(function() {
        	p.resolve(v);
        }, ms);

        return p;
    };
};

function getImg(url) {
	var p = Promise();
    var img = new Image();

    img.onload = function() {
    	p.resolve(this);
    };

    img.onerror = function(err) {
    	p.reject(err);
    };

    img.url = url;

    return p;
};
```

由于Promise构造函数接受一个异步任务作为参数，所以`getImg`还可以这样调用：

``` javascript
function getImg(url) {
	return Promise(function(resolve, reject) {
    	var img = new Image();

        img.onload = function() {
            resolve(this);
        };

        img.onerror = function(err) {
            reject(err);
        };

        img.url = url;
    });
};
```

接下来（见证奇迹的时刻），假设有一个BT的需求要这么实现：异步获取一个[json配置](http://chemdemo.github.io/demos/promise/map.json)，解析json数据拿到里边的图片，然后按顺序队列加载图片，没张图片加载时给个loading效果

``` javascript
function addImg(img) {
    $('#list').find('> li:last-child').html('').append(img);
};

function prepend() {
    $('<li>')
        .html('loading...')
        .appendTo($('#list'));
};

function run() {
    $('#done').hide();
    getData('map.json')
        .then(function(data) {
            $('h4').html(data.name);

            return data.list.reduce(function(promise, item) {
                return promise
                    .then(prepend)
                    .then(sleep(1000))
                    .then(function() {
                        return getImg(item.url);
                    })
                    .then(addImg);
            }, Promise.resolve());
        })
        .then(sleep(300))
        .then(function() {
            $('#done').show();
        });
};

$('#run').on('click', run);
```

这里的sleep只是为了看效果加的，可猛击查看[demo](http://chemdemo.github.io/demos/promise/browser.html)！当然，Node.js的例子可查看[这里](https://github.com/chemdemo/promiseA/blob/master/test/nodejs.js)。

在这里，`Promise.resolve(v)`静态方法只是简单返回一个以v为肯定结果的promise，v可不传入，也可以是一个函数或者是一个包含`then`方法的对象或函数（即thenable）。

类似的静态方法还有`Promise.cast(promise)`，生成一个以promise为肯定结果的promise；

`Promise.reject(reason)`，生成一个以reason为否定结果的promise。

我们实际的使用场景可能很复杂，往往需要多个异步的任务穿插执行，并行或者串行同在。这时候，可以对Promise进行各种扩展，比如实现`Promise.all()`，接受promises队列并等待他们完成再继续，再比如`Promise.any()`，promises队列中有任何一个处于完成态时即触发下一步操作。

### 标准的Promise

可参考html5rocks的这篇文章[JavaScript Promises](http://www.html5rocks.com/en/tutorials/es6/promises/)，目前高级浏览器如chrome、firefox都已经内置了Promise对象，提供更多的操作接口，比如`Promise.all()`，支持传入一个promises数组，当所有promises都完成时执行then，还有就是更加友好强大的异常捕获，应对日常的异步编程，应该足够了。

### 第三方库的Promise

现今流行的各大js库，几乎都不同程度的实现了Promise，如dojo，jQuery、Zepto、when.js、Q等，只是暴露出来的大都是`Deferred`对象，以jQuery（Zepto类似）为例，实现上面的`getImg()`：

``` javascript
function getImg(url) {
    var def = $.Deferred();
    var img = new Image();

    img.onload = function() {
        def.resolve(this);
    };

    img.onerror = function(err) {
        def.reject(err);
    };

    img.src = url;

    return def.promise();
};
```

当然，jQuery中，很多的操作都返回的是Deferred或promise，如`animate`、`ajax`：

``` javascript
// animate
$('.box')
    .animate({'opacity': 0}, 1000)
    .promise()
    .then(function() {
        console.log('done');
    });

// ajax
$.ajax(options).then(success, fail);
$.ajax(options).done(success).fail(fail);

// ajax queue
$.when($.ajax(options1), $.ajax(options2))
    .then(function() {
        console.log('all done.');
    }, function() {
        console.error('There something wrong.');
    });
```

jQuery还实现了`done()`和`fail()`方法，其实都是then方法的shortcut。

处理promises队列，jQuery实现的是`$.when()`方法，用法和`Promise.all()`类似。

其他类库，这里值得一提的是[when.js](https://github.com/cujojs/when)，本身代码不多，完整实现Promise，同时支持browser和Node.js，而且提供更加丰富的API，是个不错的选择。这里限于篇幅，不再展开。

### 尾声

我们看到，不管Promise实现怎么复杂，但是它的用法却很简单，组织的代码很清晰，从此不用再受callback的折磨了。

最后，Promise是如此的优雅！但Promise也只是解决了回调的深层嵌套的问题，真正简化JavaScript异步编程的还是Generator，在Node.js端，建议考虑Generator。

下一篇，研究下Generator。

### 参考文献
- [JavaScript Promises](http://www.html5rocks.com/en/tutorials/es6/promises/)
- [JavaScript Promises（中文）](http://www.html5rocks.com/zh/tutorials/es6/promises/)
- [when.js](https://github.com/cujojs/when)
- [Asynch JS: The Power Of $.Deferred](http://www.html5rocks.com/en/tutorials/async/deferred/)
- [jQuery: $.Deferred()](https://github.com/jquery/jquery/blob/master/src/deferred.js)
