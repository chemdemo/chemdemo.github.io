# React组件的生命周期

原文: https://medium.com/react-ecosystem/react-components-lifecycle-ce09239010df#.j7h6w8ccc

## 一段探索React自建内部构造的旅程

在先前的文章里我们涵盖了[React基本原理](https://medium.com/react-ecosystem/react-a-gentle-introduction-407fb59d3514#.su1qzoxp7)和[如何构建更加复杂的交互组件](https://medium.com/react-ecosystem/components-the-war-horses-of-react-1085dddc14e5#.qnz8wjnq2)。此篇文章我们将会继续探索React组件的特性，特别是生命周期。

稍微思考一下React组件所做的事，首先想到的是一点是：React描述了如何去渲染（DOM）。我们已经知道React使用`render()`方法来达到这个目的。然而仅有`render()`方法可能不一定都能满足我们的需求。如果在组件rendered之前或之后我们需要做些额外的事情该怎么做呢？我们需要做些什么以避免重复渲染(re-render)呢？

看起来我们需要对组件（运行）的各个阶段进行控制，组件运行所有涉及的各个阶段叫做**组件的生命周期**，并且每一个React组件都会经历这些阶段。React提供了一些方法并在组件处于相应的阶段时通知我们。这些方法叫做React**组件的生命周期方法**且会根据特定并可预测的顺序被调用。

基本上所有的React组件的生命周期方法都可以被分割成四个阶段：**初始化**、**挂载阶段（mounting）**、**更新阶段**、**卸载阶段（unmounting）**。让我们来近距离分别研究下各个阶段。

## 初始化阶段

初始化阶段就是我们分别通过`getDefaultProps()`和`getInitialState()`方法定义`this.props`默认值和`this.state`初始值的阶段。

`getDefaultProps()`方法被**调用一次并缓存**起来——在多个类实例之间共享。在组件的任何实例被创建之前，我们（的代码逻辑）不能依赖这里的`this.props`。这个方法返回一个对象并且属性如果没有通过父组件传入的话相应的属性会挂载到`this.props`对象上。

`getInitialState()`方法也只会被调用一次，（调用时机）刚好是**mounting阶段开始之前**。返回值将会被当成`this.state`的初始值，且必须是一个对象。

现在我们来证明上面的猜想，实现一个显示的值可以被增加和减少的组件，基本上就是一个拥有“+”和“-”按钮的计数器。

``` js
var Counter = React.createClass({
    getDefaultProps: function() {
        console.log('getDefaultProps');
        return {
            title: 'Basic counter!!!'
        }
    },

    getInitialState: function() {
        console.log('getInitialState');
        return {
            count: 0
        }
    },

    render: function() {
        console.log('render');
        return (
            <div>
                <h1>{this.props.title}</h1>
                <div>{this.state.count}</div>
                <input type='button' value='+' onClick={this.handleIncrement} />
                <input type='button' value='-' onClick={this.handleDecrement} />
            </div>
        );
    },

    handleIncrement: function() {
        var newCount = this.state.count + 1;
        this.setState({count: newCount});
    },

    handleDecrement: function() {
        var newCount = this.state.count - 1;
        this.setState({count: newCount});
    },

    propTypes: {
        title: React.PropTypes.string
    }
});

ReactDOM.render(
    React.createElement(Counter),
    document.getElementById('app-container')
);
```

我们通过`getDefaultProps()`方法配置一个“title”属性，如果没有传入则提供一个默认值。然后通过`getInitialState()`为组件设置一个初始state值“{count: 0}”。如果运行这段代码你将会看到控制台输出如下结果：

![](https://cdn-images-1.medium.com/max/800/1*BSNq5BfApSeYYeVbyrwBpg.png)

现在我们想要让Counter组件可以设置`this.state.count`初始值和增加/减少的步长值，但依然提供一个默认值：

``` js
var Component = React.createClass({
    getDefaultProps: function() {
        console.log('getDefaultProps');
        return {
            title: "Basic counter!!!",
            step: 1
        }
    },

    getInitialState: function() {
        console.log('getInitialState');
        return {
            count: (this.props.initialCount || 0)
        };
    },

    render: function() {
        console.log('render');
        var step = this.props.step;

        return (
            <div>
                <h1>{this.props.title}</h1>
                <div>{this.state.count}</div>
                <input type='button' value='+' onClick={this.updateCounter.bind(this, step)} />
                <input type='button' value='-' onClick={this.updateCounter.bind(this, -step)} />
            </div>
        );
    },

    updateCounter: function(value) {
        var newCount = this.state.count + value;
        this.setState({count: newCount});
    },

    propTypes: {
        title: React.PropTypes.string,
        initialCount: React.PropTypes.number,
        step: React.PropTypes.number
    }
});

ReactDOM.render(
    React.createElement(Component, {initialCount: 5, step: 2}),
    document.getElementById('app-container')
);
```

> 这里通过[Function.prototype.bind](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Function/bind)使用[偏函数应用(Partial Application)](https://en.wikipedia.org/wiki/Partial_application)来达到复用代码的目的。

现在我们拥有了一个可定制化的组件。


## 增长（Mounting）阶段

Mounting阶段发生在组件即将被插入到DOM之前。这个阶段有两个方法可以用：`componentWillMount()`和`componentDidMount()`。

`componentWillMount()`方法是这个阶段最先调用的，它只在**刚好初始渲染（initial rendering）发生之前**被调用**一次**，也就是React在DOM插入组件之前。需要注意的是在此处**调用`this.setState()`方法将不会触发重复渲染（re-render）**。如果添加下面的代码到计数器组件我们将会看到此方法在`getInitialState()`之后且`render()`之前被调用。

``` js
getInitialState: function() {...},
componentWillMount: function() {
    console.log('componentWillMount');
},
```

`componentDidMount()`是这个阶段第二个被调用的方法，刚好发生在**React插入组件到DOM之后**，且也只被调用**一次**。现在可以更新DOM元素了，这意味着这个方法是初始化其他需要访问DOM或操作数据的第三方库的最佳时机。

假设我们想要通过API拉取数据来初始化组件。我们应该直接在计数器组件的`componentDidMount()`方法拉取数据，但是这让组件看起来有太多逻辑了，更可取的方案是使用[容器组件](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0#.pqy4fd1c5)来做：

``` js
var Container = React.createClass({
    getInitialState: function() {
        return {
            data: null,
            fetching: false,
            error: null
        };
    },

    render: function() {
        if (this.props.fetching) {
            return <div>Loading...</div>;
        }

        if (this.props.error) {
            return (
                <div className='error'>
                    {this.state.error.message}
                </div>
            );
        }

        return <Counter {...data} />
    },

    componentDidMount: function() {
        this.setState({fetching: true});

        Axios.get(this.props.url).then(function(res) {
            this.setState({data: res.data, fetching: false});
        }).catch(function(res) {
            this.setState({error: res.data, fetching: false});
        });
    }
});
```

> [Axios](https://github.com/mzabriskie/axios)是一个基于priomise的跨浏览器和Node.js的HTTP客户端。


##　更新阶段

**当组件的属性或者状态更新时**也需要一些方法来供我们执行代码，这些方法也是组件更新阶段的一部分且按照以下的顺序被调用：

1. 当从父组件接收到新的属性时：

    ![props updated](https://cdn-images-1.medium.com/max/800/1*5fwo0VC1KtiWH64CENQ8dQ.png)

2. 当通过`this.setState()`改变状态时：

    ![state updated](https://cdn-images-1.medium.com/max/800/1*u0CoE_GHlUB4Ce-yZtgv0Q.png)

此阶段React组件已经被插入DOM了，因此这些方法将不会在首次render时被调用。

最先被调用的方法是`componentWillReceiveProps()`，当组件接收到新属性时被调用。我们可以利用此方法为React组件提供一个在render之前修改state的机会。**在此方法内调用`this.setState()`将不会导致重复render**，然后可以通过`this.props`访问旧的属性。例如计数器组件，如果我们想要在任何时候父组件传入“initialCount”时更新状态，可以这样做：

``` js
...
componentWillReceiveProps: function(newProps) {
    this.setState({count: newProps.initialCount});
},
...
```

`shouldComponentUpdate()`方法允许我们自行决定下一个state更新时是否触发重复render。此方法返回一个布尔值，且默认是true。但是我们也可以返回false，这样下面的（生命周期）方法将不会被调用：

- componentWillUpdate()

- render()

- componentDidUpdate()

当有性能瓶颈时也可以使用`shouldComponentUpdate()`方法（来优化）。尤其是数百个组件一起时重新render的代价将会十分昂贵。为了证明这个猜想我们来看一个例子：

``` js
var TextComponent = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
        if (this.props.text === nextProps.text) return false;
        return true;
    },

    render: function() {
        return <textarea value={this.props.text} />;
    }
});
```

此例中无论何时父组件传入一个“text”属性到`TextComponent`并且text属性等于当前的“text”属性时，组件将会不会重复render。

当接收到新的属性或者state时在render之前会立刻调用`componentWillUpdate()`方法。可以利用此时机来为更新做一些准备工作，虽然这个阶段不能调用`this.setState()`方法：

``` js
...
componentWillUpdate: function(nextProps, nextState) {
    console.log('componentWillUpdate', nextProps, nextState);
},
...
```

`componentDidUpdate()`方法在React更新DOM之后立刻被调用。可以在此方法里操作被更新过的DOM或者执行一些后置动作（action）。此方法有两个参数：

1. prevProps：旧的属性

2. prevState：旧的state

这个方法的一个常见使用场景是当我们使用需要操作更新后的DOM才能工作的第三方库——如jQuery插件的时候。在`componentDidMount()`方法内初始化第三方库，但是在属性或state更新触发DOM更新之后也需要同步更新第三方库来保持接口一致，这些必须在`componentDidUpdate()`方法内来完成。为了验证这一点，让我们看看如何开发一个[Select2库](https://select2.github.io/)包裹（wrapper）React组件：

``` js
var Select2 = React.createClass({
    componentDidMount: function() {
        $(this._ref).select2({data: this.props.items});
    },

    render: function() {
        return (
            <select
                ref={
                    function(input) {
                        this._ref = input;
                    }.bind(this)
                }>
            </select>
        );
    },

    componentDidUpdate: function() {
        $(this._ref).select2('destroy');
        $(this._ref).select2({data: this.props.items});
    }
});
```


## 卸载阶段（unmounting）

此阶段React只提供了一个方法：

- componentWillUnmount()

它将在组件从DOM卸载之前被调用。可以在内部执行任何可能需要的清理工作，如无效的计数器或者清理一些在`componentDidMount()`/`componentDidUpdate()`内创建的DOM。比如在Select2组件里边我们可以这样子：

``` js
...
componetWillUnmount: function(){
   $(this._ref).select2('destroy');
},
...
```

## 概述

React为我们提供了一种在创建组件时申明一些将会在组件生命周期的特定时机被自动调用的方法的可能。现在我们很清晰的理解了每一个组件生命周期方法所扮演的角色以及他们被调用的顺序。这使我们有机会在组件创建和销毁时执行一些操作。也允许我们在当属性和状态变化时做出相应的反应从而更容易的整合第三方库和追踪性能问题。

希望您觉得此文对您有用，如果是这样，请推荐之！！！
