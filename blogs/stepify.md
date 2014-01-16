# stepify——轻松管理Node.js异步工作流

Node.js中基本都是异步编程，我们回想下为什么初学者很容易写出深度嵌套callback的代码？因为直观啊，一眼即懂。当然实际写的时候肯定不推荐callback套callback，需要一个工具来把一个任务完整的串起来。

我们知道，在项目管理里面有一个很出名的理论，叫番茄工作法（不知道的自行google），它所做的事情是把未来一段时间要做的事情都按照时间段拆分成一个个很小的任务，然后逐个完成。

stepify设计思路和番茄工作法有些类似，都是先定义好了任务最后再执行，不同的是前者以单个异步操作作粒度划分，后者只是以时间划分。

想想现实中我们怎么去做事的：比如做饭这件不大不小的事儿，因为只有一个煤气灶，所以炒菜只能炒完一个炒下一个菜，但是同时我们有个电饭煲，所以可以在炒菜的同时煮饭。这样子下来，做一顿饭的总时间就是max(煮饭的时间, 烧菜的时间)。而在炒菜的过程中，没有规定一定要先西红柿炒蛋完了之后再蛋炒番茄。这个做饭的过程，可以类比成上文所说的工作流，煮饭和烧菜是两个并行的task，每烧一个菜算是完成一个step。

stepify中的每一个异步任务执行的时机是前一个异步操作执行完而且没遇到异常，如果遇到异常，则把异常交给事先定义好的异常处理函数，在异常处理函数里可以决定是否继续执行下一个任务（比如烧菜时发现没了酱油，你可以决定是否还继续炒这道菜还是换下一道）。

抽象了？直接看代码文档吧，代码托管在github：[https://github.com/chemdemo/node-stepify](https://github.com/chemdemo/node-stepify)。

目前已经发布到[npm](https://npmjs.org/package/stepify)，可以使用npm直接安装：

``` javascript
$ npm install stepify
```

# 使用

假设有一个工作（work）需要完成，它分解为task1、task2、task3。。。几个任务，每个任务分为好几个步骤（step），使用stepify实现的伪代码如下：

``` javascript
var workflow = Stepify()
    .task('t1')
        .step('t1s1', fn)
        // t1s1的执行结果可以通过fn内部的`this.done`方法传给t1s2，下同
        .step('t1s2', fn)
        .step('s', fn)
    .task('t2')
        .step('t2s1', fn)
        .step('t2s2', fn)
        .step('s', fn)
        // 定义任务t2的异常处理函数
        .error(fn)
    .task('t3')
        .step('t3s1', fn)
        .step('t3s2', fn)
    // pend是指结束一个task的定义，接下来定义下一个task或者一些公共方法
    // task里边其实会先调用下pend以自动结束上一个task的定义
    .pend()
     // 处理work中每一个task的每一个（异步）step异常
    .error(fn)
    // 处理最终结果，result()是可选的（不需要关注输出的情况）
    .result(fn)
    .run()
```

这里可以看到，工作原理很简单，就是**先定义好后执行**。

解释下，pend的作用是分割task的定义，表示这个task要具体怎么做已经定义好了。里边还有两个`error()`的调用，跟在t2后面error调用的表明t2的异常由传入这个error的函数来处理，t1和t3没有显示定义error，所以它们的异常将交给后面一个error定义的函数来处理，这个是不是很像js的时间冒泡？

默认情况下，work的执行是按照task定义的顺序来串行执行的，所以还可以这样简化：

``` javascript
var workflow = Stepify()
    .step('t1s1', fn)
    .step('t1s2', fn)
    .step('s', fn)
    .pend()
    .step('t2s1', fn)
    .step('t2s2', fn)
    .step('s', fn)
    .error(fn)
    .pend()
    .step('t3s1', fn)
    .step('t3s2', fn)
    .pend()
    .error(fn)
    .result(fn)
    .run()
```

细心的童靴可能已经发现，t1和t2后面的都有一个step——`step('s', fn)`，这里其实还可以把它抽出来：

``` javascript
var workflow = Stepify()
    .step('t1s1', fn)
    .step('t1s2', fn)
    .step('s')
    .pend()
    .step('t2s1', fn)
    .step('t2s2', fn)
    .step('s')
    .error(fn)
    .pend()
    .step('t3s1', fn)
    .step('t3s2', fn)
    .pend()
    .s(fn)
    .error(fn)
    .result(fn)
    .run()
```

是不是很神奇？s并不是stepify内置的方法而是动态扩展出来的！

那接下来又有个问题，t1和t2都有执行两个`step('s')`，那额外的参数怎么传递呢？奥妙之处在于step函数，它后面还可以跟其他参数，表示在我们定义所有task之前就已经知道的变量（我叫它⎡静态参数⎦），还有任务执行过程中，如果上一个step的输出怎么传递给下一个step呢？答案是通过[next](https://github.com/chemdemo/node-stepify#next)或者[done](https://github.com/chemdemo/node-stepify#done)动态传入（我叫它⎡动态参数⎦），`s(fn)`只是定义一个函数体，通过静态参数和动态参数结合，可以得到不同的结果。

这还没完，我们都听过一句话，叫做“条条大路通罗马（All roads lead to Rome）”，解决问题的方式往往有多种。上面这个例子，假如外部条件变了，task1和task2它们的执行互不影响，task3的执行需要依赖task1和task2的结果，即task1和task2可以并行，这样子怎么实现呢？

很简单，奥妙在run方法：

``` javascript
run(['t1', 't2'], 't3');
```

把t1和t2放到数组中，它们便是并行执行！同理，可以变出很多种组合来。

至于很多人问的和async的区别和优势，这不是一两句话解释的清楚的，设计理念不同，二者并不冲突，async在并发控制上面很优秀，而stepify则重在流程控制，里面也有简单的[parallel](https://github.com/chemdemo/node-stepify#parallel)支持。

可以看到，一个复杂的工作流，通过stepify定制，每一步都是那么清晰可读！

欢迎选用，如果遇到bug请提交到[这里](https://github.com/chemdemo/node-stepify/issues)，也欢迎pull request。
