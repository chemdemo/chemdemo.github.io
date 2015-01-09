# 【译】为什么你应该使用Node.js来执行cpu密集型任务

> 原文出处：[Why you should use Node.js for CPU-bound tasks](http://neilk.net/blog/2013/04/30/why-you-should-use-nodejs-for-CPU-bound-tasks/)

在这个话题的[第一部分](http://neilk.net/blog/2013/04/16/letterpwn-a-nodejs-based-letterpress-solver/)，我揭示了基于Node.js实现的[Letterpress](http://www.atebits.com/letterpress/)的算法原理，给它命名[LetterPwn](http://letterpwn.neilk.net/)([source](https://github.com/neilk/letterpwn))。

但我并不是想拿文字游戏来欺骗大家（译者注：即标题党）——我想要探索的是尝试使用Node.js写一个大型的计算服务。

很多程序员，甚至是Node.js的狂热粉丝都可能会觉得做这样的事是很荒谬的。

他们可能会说，（这种做法）和平台“格格不入”，因为对于没有经验的程序员来说（Node.js）只是一种简单且运行良好的服务器。

这方面我比很多人有经验，但是我对Node.js很感兴趣，因为抛开它很多的缺陷不说，我仍然喜欢JavaScript——它对函数式编程支持得足够好，而且现行的版本（运行速度）飞快。在客户端，人们用它来执行cpu密集型任务，如图像布局。如果不能够在服务器上做类似的事情，那（Node.js）将是一个愚蠢的平台。

完成了这个项目后我得出的初步结论是Node.js可以作为实现大型计算服务的一种选择。我并不是说当你想实现视频转码时要首选Node.js，而是指当你在构建面向web的服务时可能需要cpu密集型任务的这些场景，可以把它作为一种工具引入（服务）。它提供了一些其他语言所不具备的可扩展优势。
