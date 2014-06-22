# Express框架解析

## Route类

传入path（字符串），创建一个Route类：

每个route实例会生成一个handles栈（route.stack），route.stack有可能只是一个方法，这时候说明只定义的单个路由，也有可能只是一个数组，形如`[{handle: fn, method: 'GET|POST|...'}]`

下面是Route实例的主要方法：

### route.all(fn)

接受一个函数或函数数组，每个函数接受的参数形如`function(req, res, next)`，其实就是express中间件。all方法只是简单的入栈，后面会按照入栈的顺序执行这些函数。

``` javascript
if (!self.stack) {
    self.stack = fn;
}
else if (typeof self.stack === 'function') {
    self.stack = [{ handle: self.stack }, { handle: fn }];
}
else {
    self.stack.push({ handle: fn });
}
```

作者想得很周到，如果只是单一的route则不需要处理数组。

### route.get(fn)、route.post(fn)、route.delete(fn)、route.options(fn)等等

route支持所有http method，参见：[node-methods](https://github.com/visionmedia/node-methods)

和`all()`方法类似，这些方法唯一不同的是push到handle栈中的对象会带上method：

``` javascript
self.stack.push({ method: method, handle: fn });
```

### route.dispatch(req, res, done)

这个方法实现对handle栈的调用，会按照handle（中间件）入栈的顺序执行，直到栈底或者遇到错误。

这里的处理逻辑是，创建一个迭代器`next_layer`，递归的处理stack。具体做法是，用req.method和栈中被处理的对象的method进行对比：

- 如果这个对象没有method属性，也就是说是通过all()方法push到stack中的方法（中间件）

- 如果这个对象有method属性但和req.method不匹配，则自动跳到下一个中间件

- 如果method匹配，看上一步处理的结果，如果是error，则看当前处理的中间件是否处理错误，具体做法是检查形参：

``` javascript
var arity = layer.handle.length;
if (err) {
    if (arity < 4) {
        return next_layer(err);
    }

    try {
        layer.handle(err, req, res, next_layer);
    } catch (err) {
        next_layer(err);
    }
    return;
}
```

- 反之，如果上一个中间件处理没出错，当前处理的中间件如果形参超过3个，则会被忽略，否则则执行当前处理的那个中间件：

``` javascript
if (arity > 3) {
    return next_layer();
}
```

这个方法代码不多，但是很巧妙，TJ不愧是大神：

首先，这里用到了一个重要的编程算法（递归）：迭代器

然后，我们看到，对于stack的执行，只遍历了一遍，很高效。

然后是Express中间件的写法约定：通过形参来区分，三个参数是普通的中间件，四个参数的则表示这是一个错误处理中间件。中间件的雏形在此形成。

## Layer类











