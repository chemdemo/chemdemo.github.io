# stepify——轻松管理Node.js异步工作流

Node.js基于非阻塞I/O、事件机制使得它天生具备高并发处理能力，可以说异步模型是Node.js的精髓所在。在Node.js代码里边随处可见异步操作，熟悉Node.js开发的童靴想必都知道或者都用过现今比较流行的一些解决异步编程中深度callback嵌套问题的模块。

这些模块都很棒，但是笔者在使用过程中发现，有一个比较复杂的任务，它依赖几个任务的完成，这些任务之间可能会有执行顺序依赖，也可能可以并发执行，甚至有可能条件变了，这个复杂任务的执行顺序又得改。。。代码写下来，过上一段时间自己看都会很吃力了。异步编程中，深度嵌套callback不推荐，但是不能否认它逻辑比较直观清晰。

前段时间笔者在完成[everyauth-cn](https://github.com/chemdemo/everyauth-cn)模块的过程中，阅读[everyauth](https://github.com/bnoguchi/everyauth)模块源码时发现everyauth处理登陆授权流程的做法很新奇，它使用链式调用并把每一步（异步）需要做的操作封装在一些step()里边，并在调用链的后面实现这些方法。受此启发，于是有了stepify模块。

stepify的目标是简化Node.js里的异步工作流，把复杂的任务拆分成很多步（step化），把分散在代码各处的异步操作都整合到一起，通过精细的粒度划分，使得每一个异步操作的执行过程都透明化，兼顾可读性和降低后期维护成本，同时还优雅地解决了异步深度嵌套的问题。

项目托管到github地址是：[https://github.com/chemdemo/node-stepify](https://github.com/chemdemo/node-stepify)。

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

这里多了一个`read()`方法，但read方法并不是stepify内置的方法。实际上，您可以任意“扩展”stepify链！它的奥妙在于`step()`方法的参数，详细请看[step调用说明](#step)。

可以看到，一个复杂的异步操作，通过stepify定制，每一步都是那么清晰可读！

最后，欢迎选用，如果遇到bug请[告诉我](https://github.com/chemdemo/node-stepify/issues)，也欢迎提交pull request。
