# React组件的生命周期

原文: https://medium.com/react-ecosystem/react-components-lifecycle-ce09239010df#.j7h6w8ccc

## 一段探索React自建内部构造的旅程

在先前的文章里我们涵盖了[React基本原理](https://medium.com/react-ecosystem/react-a-gentle-introduction-407fb59d3514#.su1qzoxp7)和[如何构建更加复杂的交互组件](https://medium.com/react-ecosystem/components-the-war-horses-of-react-1085dddc14e5#.qnz8wjnq2)。此篇文章我们将会继续探索React组件的特性，特别是生命周期。

稍微思考一下React组件所做的事，首先想到的是一点是：React描述了如何去渲染（DOM）。我们已经知道React使用`render()`方法来达到这个目的。然而仅有`render()`方法可能不一定都能满足我们的需求。如果在组件rendered之前或之后我们需要做些额外的事情该怎么做呢？我们需要做些什么以避免重复渲染(re-render)呢？

看起来我们需要对组件（运行）的各个阶段进行控制，组件运行所有涉及的各个阶段叫做React的生命周期，并且每一个React组件都有这些阶段。React提供了一些方法并在组件处于相应的阶段时通知我们。这些方法叫做React组件的生命周期方法且会根据特定并可预测的顺序被调用。

基本上所有的React组件的生命周期方法都可以被分割成四个阶段：初始化、挂载阶段（mounting）、更新阶段、卸载阶段（unmounting）。让我们来近距离分别研究下各个阶段。

## 初始化阶段
