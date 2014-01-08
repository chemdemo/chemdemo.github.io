# stepify——轻松管理Node.js异步工作流

老生常谈的问题：异步编程。

Node.js中基本都是异步编程，npm社区已经有许多模块用来解决异步深层嵌套的问题，可是笔者在使用过程中发现大量的异步操作散落在代码各处，过一段时间之后发现比较难维护（当然可能是自己写的问题）。

我们回想下为什么初学者很容易写出深度嵌套callback的代码，因为直观啊，一眼即懂。当然实际写的时候肯定不推荐callback套callback，需要一个工具来把一个任务完整的串起来。

我们知道，在项目管理里面有一个很出名的理论，叫番茄工作法（不知道的自行google），它所做的事情是把未来一段时间要做的事情都按照时间段拆分成一个个很小的任务，然后逐个完成。

stepify设计思路和番茄工作法有些类似，都是先定义好了任务最后再执行，不同的是前者以单个异步操作作粒度划分，后者只是以时间划分。

stepify中有两个概念：**任务（task）**和完成这个任务分哪几**步（step）**，所定义的一个或者多个任务组成一个工作流（workflow），某些任务的执行是依赖上一个任务执行完毕，有的则可以并行去执行。

想想现实中我们怎么去做事的：比如做饭这件不大不小的事儿，因为只有一个煤气灶，所以炒菜只能炒完一个炒下一个菜，但是同时我们有个电饭煲，所以可以在炒菜的同时煮饭。这样子下来，做一顿饭的总时间就是max(煮饭的时间, 烧菜的时间)。而在炒菜的过程中，没有规定一定要先西红柿炒蛋完了之后再蛋炒番茄。这个做饭的过程，可以类比成上文所说的工作流，煮饭和烧菜是两个并行的task，每烧一个菜算是完成一个step。

stepify中的每一个异步任务执行的时机是前一个异步操作执行完而且没遇到异常，如果遇到异常，则把异常交给事先定义好的异常处理函数，在异常处理函数里可以决定是否继续执行下一个任务（比如烧菜时发现没了酱油，你可以决定是否还继续炒这道菜还是换下一道）。

stepify还有一个特别的地方是定义每一个step的时候，step内部具体做什么可以共享（即stepHandle），根据传入不同的参数执行不同的操作，stepHandle的查找过程类似js中变量在原型链中查找的过程，即逐级向上查找，找不到则抛异常。

好像比较抽象了？直接看代码文档吧，代码托管在github：[https://github.com/chemdemo/node-stepify](https://github.com/chemdemo/node-stepify)。

目前已经发布到[npm](https://npmjs.org/package/stepify)，可以使用npm直接安装：

``` javascript
$ npm install stepify
```

## 最简单的用法

简单实现基于oauth2授权获取用户基本资料的例子：

``` javascript
// Authorizing based on oauth2 workflow
var Stepify = require('stepify');
Stepify()
    .step('getCode', function(appId, rUri) {
        var root = this;
        request.get('[authorize_uri]', function(err, res, body) {
            root.done(err, JSON.parse(body).code);
        });
    }, [appId], [redirectUri])
    .step('getToken', function(code) {
        var root = this;
        request.post('[token_uri]', function(err, res, body) {
            root.done(err, JSON.parse(body).access_token);
        });
    })
    .step('getInfo', function(token) {
        request.get('[info_uri]?token=' + token, function(err, res, body) {
            // got user info, pass it to client via http response
        });
    })
    .run();
```

多个step共用一个handle、静态参数、动态参数传递的例子：

``` javascript
var Stepify = require('stepify');
Stepify()
    .step('read', __filename)
    .step(function(buf) {
        // buf is the buffer content of __filename
        var root = this;
        var writed = 'test.js';

        // do more stuff with buf
        // this demo just replace all spaces simply
        buf = buf.toString().replace(/\s+/g, '');
        fs.writeFile(writed, buf, function(err) {
            // writed is the name of target file,
            // it will be passed into next step as the first argument
            root.done(err, writed);
        });
    })
    .step('read')
    // `read` here is a common handle stored in workflow
    .read(function(p, encoding) {
        fs.readFile(p, encoding || null, this.done.bind(this));
    })
    .run();
```

可以看到，一个复杂的异步操作，通过stepify定制，每一步都是那么清晰可读！

工具都是为了解决问题的，怎么顺手怎么来。stepify只是为Node.js异步编程提供多一种选择而已。

欢迎选用，如果遇到bug请[告诉我](https://github.com/chemdemo/node-stepify/issues)，也欢迎提交pull request。
