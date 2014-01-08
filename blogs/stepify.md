# stepify——轻松管理Node.js异步工作流

Node.js基于非阻塞I/O、事件机制使得它天生具备高并发处理能力，可以说异步模型是Node.js的精髓所在。在Node.js代码里边随处可见异步操作，熟悉Node.js开发的童靴想必都知道或者都用过现今比较流行的一些解决异步编程中深度callback嵌套问题的模块。

这些模块都很棒，但是笔者在使用过程中发现，有一个比较复杂的任务，它依赖几个任务的完成，这些任务之间可能会有执行顺序依赖，也可能可以并发执行，甚至有可能条件变了，这个复杂任务的执行顺序又得改。。。代码写下来，过上一段时间自己看都会很吃力了。异步编程中，深度嵌套callback不推荐，但是不能否认它逻辑比较直观清晰。

前段时间笔者在完成[everyauth-cn](https://github.com/chemdemo/everyauth-cn)模块的过程中，阅读[everyauth](https://github.com/bnoguchi/everyauth)模块源码时发现everyauth处理登陆授权流程的做法很新奇，它使用链式调用并把每一步（异步）需要做的操作封装在一些step()里边，并在调用链的后面实现这些方法。受此启发，于是有了stepify模块。

stepify的目标是简化Node.js里的异步工作流，把复杂的任务拆分成很多步（step化），把分散在代码各处的异步操作都整合到一起，通过精细的粒度划分，使得每一个异步操作的执行过程都透明化，兼顾可读性和降低后期维护成本，同时还优雅地解决了异步深度嵌套的问题。

目前已经发布到npm，可以使用npm直接安装：

``` javascript
$ npm install stepify
```

项目托管到github地址是：[https://github.com/chemdemo/node-stepify](https://github.com/chemdemo/node-stepify)。
