# 基于webpack的前端工程解决方案探索（上篇）

本篇主要介绍webpack的基本原理以及基于webpack搭建**纯静态页面型**前端自动化解决方案的思路。

### 关于前端工程

在很长一段时间里，或者说在前端这个职业诞生之初，前端很简单，比如下面简单的几行代码就能够成一个可运行前端应用：

``` xml
<!DOCTYPE html>
<html>
<head>
    <title>webapp</title>
    <link rel="stylesheet" href="app.css">
</head>
<body>
    <h1>app title</h1>
    <script src="app.js"></script>
</body>
</html>
```

但随着webapp的复杂程度不断在增加，前端也在变得很庞大和复杂，按照传统的开发方式会让前端失控：代码难以维护、性能不断下降。

广泛意义上讲，前端也属于软件工程的范畴。

对于软件“工程”，个人以为至少应当有如下特点：

- 有IDE的支持，负责组织代码、debug、编译、打包等工作

- 有固定或者约定的目录结构，规定软件所依赖的不同类别的资源的存放路径

- 在完成软件开发时，对代码的组织甚至写法，有一定的规范或约定，通常由IDE控制

但前端没有Eclipse、Visual Studio等为特定语言量身打造的IDE。因为前端不需要编译，即改即生效，在开发和调试时足够方便，只需要打开个浏览器即可完成，所以前端一般不会扯到“工程”这个概念。

感谢Node.js，使得JavaScript这门前端的主力语言突破了浏览器环境的限制可以独立运行在OS之上，这让JavaScript拥有了文件IO、网络IO的能力。

一时间出现了以Grunt、Gulp为代表的前端构建工具，它把前端开发的各个环节（如代码合并压缩、图片合并压缩、资源路径替换等）包装成一个个独立的task，根据不同的运行环境需要组合装载不同的task。

这个时候“前端工程”这个概念逐渐被强调和重视，在认识到了工具所带来的便利之后，各个前端团队都在尝试对所负责的项目进行工程化改造。

但是构建工具本身有一定的使用门槛，配置过于复杂并且不能够完全解决我们的需求，所以前端工程化很难做，根本原因是前端的复杂性和特殊性。

诚如 张云龙[@fouber](https://github.com/fouber) 所言：

> 前端是一种特殊的GUI软件，它有两个特殊性：一是前端由三种编程语言组成，二是前端代码在用户端运行时增量安装。

html、css和js的配合才能保证webapp的运行，增量安装是按需加载的需要。开发完成后输出三种以上不同格式的静态资源，静态资源之间有可能存在互相依赖关系，最终构成一个复杂的资源依赖树（甚至网）。

所以，前端工程化，最起码需要解决以下问题：

- 提供开发所需的一整套运行环境，这和IDE作用类似

- 资源加载和依赖处理

- 资源的实时更新

- 在上两条的基础上，支持按需加载

- 打通研发链路的各个环节，debug、mock、proxy、test、build、deploy等

注：个人以为，与前端工程化对应的另一个重要的领域是前端组件化和模块化，前者属于工具，解决研发效率问题，后者属于前端生态，解决代码复用的问题，本篇对于后者不做深入。

我们以开发一个多页面webapp为例，给出上面所提出的问题的解决方案。

### 前端开发环境搭建

#### 主要目录结构

``` js
- webapp/               # webapp根目录
  - src/                # 开发目录
    + css/              # sass生成的css资源目录
    + img/              # webapp图片资源目录
    - js/               # webapp js&jsx资源目录
      - components/     # 标准组件存放目录
          - foo/        # 组件foo
            + css/      # 组件foo的样式
            + js/       # 组件foo的逻辑
            + tmpl/     # 组件foo的模板
            index.js    # 组件foo的入口
          + bar/        # 组件bar
      + lib/            # 第三方纯js库
      ...               # 根据项目需要任意添加的代码目录
    + tmpl/             # webapp前端模板资源目录
    a.html              # webapp入口文件a
    b.html              # webapp入口文件b
  - assets/             # 编译输出目录，即发布目录
    + js/               # 编译输出的js目录
    + img/              # 编译输出的图片目录
    + css/              # 编译输出的css目录
    a.html              # 编译输出的入口a
    b.html              # 编译处理后的入口b
  + mock/               # 假数据目录
  app.js                # 本地server入口
  routes.js             # 本地路由配置
  webpack.config.js     # webpack配置文件
  gulpfile.js           # gulp任务配置
  package.json          # 项目配置
  README.md             # 项目说明
```

这是个经典的前端项目目录结构，项目目结构在一定程度上约定了开发规范。业务开发的同学只需关注`src`目录即可，开发时尽可能最小化模块粒度，这是异步加载的需要。`assets`是整个工程的产出，无需关注里边的内容是什么，至于怎么打包和解决资源依赖的，往下看。

#### 本地开发服务器

我们使用开源web框架搭建一个webserver，便于本地开发和调试，以及灵活地处理前端路由，以`koa`为例，主要代码如下：

``` js
// app.js
var http = require('http');
var koa = require('koa');
var serve = require('koa-static');

var app = koa();
var debug = process.env.NODE_ENV !== 'production';
// 开发环境和生产环境对应不同的目录
var viewDir = debug ? 'src' : 'assets';

// 处理静态资源和入口文件
app.use(serve(path.resolve(__dirname, viewDir), {
    maxage: 0
}));

app = http.createServer(app.callback());

app.listen(3005, '0.0.0.0', function() {
    console.log('app listen success.');
});
```

运行`node app`启动本地server，浏览器输入`http://localhost:8080/a.html`即可看到页面内容，最基本的环境就算搭建完成。

如果只是处理静态资源请求，可以有很多的替代方案，如Fiddler替换文件、本地起Nginx服务器等等。搭建一个Web服务器，它能够非常灵活地配置路由和处理动态请求，可以任意定制开发环境的个性化需求用于提升开发效率，总之local webserver拥有无限的可能。

#### 动态请求支持

我们的local server是`localhost`域，在ajax请求时为了突破前端同源策略的限制，本地server需支持代理其他域下的api的功能，即proxy。同时还要支持对未完成的api进行mock的功能。

``` js
// app.js
var router = require('koa-router')();
var routes = require('./routes');
routes(router, app);
app.use(router.routes());
 ```

``` js
// routes.js
var proxy = require('koa-proxy');
var list = require('./mock/list');
module.exports = function(router, app) {
    // mock api
    // 可以根据需要任意定制接口的返回
    router.get('/api/list', function*() {
        var query = this.query || {};
        var offset = query.offset || 0;
        var limit = query.limit || 10;
        var diff = limit - list.length;

        if(diff <= 0) {
            this.body = {code: 0, data: list.slice(0, limit)};
        } else {
            var arr = list.slice(0, list.length);
            var i = 0;

            while(diff--) arr.push(arr[i++]);

            this.body = {code: 0, data: arr};
        }
    });

    // proxy api
    router.get('/api/foo/bar', proxy({url: 'http://foo.bar.com'}));
}
```

### webpack对资源的处理

#### 资源加载

根据webpack的设计理念，所有资源都是“模块”，webpack内部实现了一套资源加载机制，这与Requirejs、Sea.js、Browserify等实现有所不同，除了借助插件体系加载不同类型的资源文件之外，webpack还对输出结果提供了非常精细的控制能力，开发者只需要根据需要调整参数即可：


``` js
// webpack.config.json
// webpack loaders的配置示例
...
loaders: [
    {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
            'image?{bypassOnDebug: true, progressive:true, \
                optimizationLevel: 3, pngquant:{quality: "65-80"}}',
            'url?limit=10000&name=img/[hash:8].[name].[ext]',
        ]
    },
    {
        test: /\.(woff|eot|ttf)$/i,
        loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
    },
    {test: /\.(tpl|ejs)$/, loader: 'ejs'},
    {test: /\.js$/, loader: 'jsx'},
    {test: /\.css$/, loader: 'style!css'},
    {test: /\.scss$/, loader: 'style!css!scss'},
]
...
```

简单解释下上面的代码，`test`项表示匹配的资源类型，`loader`或`loaders`项表示用来加载这种类型的资源的loader，loader的使用可以参考[using loaders](http://webpack.github.io/docs/using-loaders.html)，更多的loader可以参考[list of loaders](http://webpack.github.io/docs/list-of-loaders.html)。

对于开发者来说，使用loader很简单，最好先配置好特定类型的资源对应的loaders，在业务代码直接使用webpack提供的`require（source path）`接口即可：

``` js
// a.js
// 加载css资源
require('../css/a.css');

// 加载其他js资源
var foo = require('./widgets/foo');
var bar = require('./widgets/bar');

// 加载图片资源
var loadingImg = require('../img/loading.png');

var img = document.createElement('img');

img.src = loadingImg;
```

注意，`require()`还支持在资源path前面指定loader，即`require(![loaders list]![source path])`形式：

``` js
require("!style!css!less!bootstrap/less/bootstrap.less");
// “bootstrap.less”这个资源会先被"less-loader"处理，
// 其结果又会被"css-loader"处理，接着是"style-loader"
// 可类比pipe操作
```

`require()`时指定的loader会覆盖配置文件里对应的loader配置项。

#### 资源依赖处理

通过loader机制，可以不需要做额外的转换即可加载浏览器不直接支持的资源类型，如`.scss`、`.less`、`.json`、`.ejs`等。

但是对于css、js和图片，采用webpack加载和直接采用标签引用加载，有何不同呢？

运行webpack的打包命令，可以得到`a.js`的输出的结果：

``` js
webpackJsonp([0], {
    /***/0:
    /***/function(module, exports, __webpack_require__) {

        __webpack_require__(6);

        var foo = __webpack_require__(25);
        var bar = __webpack_require__(26);

        var loadingImg = __webpack_require__(24);
        var img = document.createElement('img');

        img.src = loadingImg;
    },

    /***/6:
    /***/function(module, exports, __webpack_require__) {
        ...
    },

    /***/7:
    /***/function(module, exports, __webpack_require__) {
        ...
    },

    /***/24:
    /***/function(module, exports) {
        ...
    },

    /***/25:
    /***/function(module, exports) {
        ...
    },

    /***/26:
    /***/function(module, exports) {
        ...
    }
});

```

从输出结果可以看到，webpack内部实现了一个全局的`webpackJsonp()`用于加载处理后的资源，并且webpack把资源进行重新编号，每一个资源成为一个模块，对应一个id，后边是模块的内部实现，而这些操作都是webpack内部处理的，使用者无需关心内部细节甚至输出结果。

上面的输出代码，因篇幅限制删除了其他模块的内部实现细节，完整的输出请看[a.out.js](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/demos/webpack_fe/a.out.js)，来看看图片的输出：

``` js
/***/24:
/***/function(module, exports) {

    module.exports = "data:image/png;base64,...";

    /***/
}
```

注意到图片资源的loader配置：

``` js
{
    test: /\.(jpe?g|png|gif|svg)$/i,
    loaders: [
        'image?...}',
        'url?limit=10000&name=img/[hash:8].[name].[ext]',
    ]
}
```

意思是，图片资源在加载时先压缩，然后当内容size小于~10KB时，会自动转成base64的方式内嵌进去，这样可以减少一个HTTP的请求。当图片大于10KB时，则会在`img/`下生成压缩后的图片，命名是`[hash:8].[name].[ext]`的形式。`hash:8`的意思是取图片内容hushsum值的前8位，这样做能够保证引用的是图片资源的最新修改版本，保证浏览器端能够即时更新。

对于css文件，默认情况下webpack会把css content内嵌到js里边，运行时会使用`style`标签内联。如果希望将css使用`link`标签引入，可以使用`ExtractTextPlugin`插件进行提取。

#### 资源的编译输出

webpack的三个概念：模块（module）、入口文件（entry）、分块（chunk）。

其中，module指各种资源文件，如js、css、图片、svg、scss、less等等，一切资源皆被当做模块。

webpack编译输出的文件包括以下2种：

- entry：入口，可以是一个或者多个资源合并而成，由html通过script标签引入

- chunk：被entry所依赖的额外的代码块，同样可以包含一个或者多个文件

下面是一段entry和output项的配置示例：

``` js
entry: {
    a: './src/js/a.js'
},
output: {
    path: path.resolve(debug ? '__build' : './assets/'),
    filename: debug ? '[name].js' : 'js/[chunkhash:8].[name].min.js',
    chunkFilename: debug ? '[chunkhash:8].chunk.js' : 'js/[chunkhash:8].chunk.min.js',
    publicPath: debug ? '/__build/' : ''
}
```

其中`entry`项是入口文件路径映射表，`output`项是对输出文件路径和名称的配置，占位符如`[id]`、`[chunkhash]`、`[name]`等分别代表编译后的模块id、chunk的hashnum值、chunk名等，可以任意组合决定最终输出的资源格式。hashnum的做法，基本上弱化了版本号的概念，版本迭代的时候chunk是否更新只取决于chnuk的内容是否发生变化。

细心的同学可能会有疑问，entry表示入口文件，需要手动指定，那么chunk到底是什么，chunk是怎么生成的？

在开发webapp时，总会有一些功能是使用过程中才会用到的，出于性能优化的需要，对于这部分资源我们希望做成异步加载，所以这部分的代码一般不用打包到入口文件里边。

对于这一点，webpack提供了非常好的支持，即[code splitting](http://webpack.github.io/docs/code-splitting.html)，即使用`require.ensure()`作为代码分割的标识。

例如某个需求场景，根据url参数，加载不同的两个UI组件，示例代码如下：

``` js
var component = getUrlQuery('component');

if('dialog' === component) {
    require.ensure([], function(require) {
        var dialog = require('./components/dialog');
        // todo ...
    });
}

if('toast' === component) {
    require.ensure([], function(require) {
        var toast = require('./components/toast');
        // todo ...
    });
}
```

url分别输入不同的参数后得到瀑布图：

![code_splitting1](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/webpack_fe/code_splitting1.jpg)

![code_splitting2](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/webpack_fe/code_splitting2.jpg)

webpack将`require.ensure()`包裹的部分单独打包了，即图中看到的`[hash].chunk.js`，既解决了异步加载的问题，又保证了加载到的是最新的chunk的内容。

假设app还有一个入口页面`b.html`，那麽就需要相应的再增加一个入口文件`b.js`，直接在`entry`项配置即可。多个入口文件之间可能公用一个模块，可以使用`CommonsChunkPlugin`插件对指定的chunks进行公共模块的提取，下面代码示例演示提取所有入口文件公用的模块，将其独立打包：

``` js
var chunks = Object.keys(entries);

plugins: [
    new CommonsChunkPlugin({
        name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
        chunks: chunks,
        minChunks: chunks.length // 提取所有entry共同依赖的模块
    })
],
```

#### 资源的动态更新

引用模块，webpack提供了`require()`API（也可以通过添加bable插件来支持ES6的`import`语法）。但是在开发阶段不可能改一次编译一次，webpack提供了强大的热更新支持，即[HMR(hot module replace)](http://webpack.github.io/docs/hot-module-replacement-with-webpack.html)。

HMR简单说就是webpack启动一个本地webserver（webpack-dev-server），负责处理由webpack生成的静态资源请求。注意webpack-dev-server是把所有资源存储在内存的，所以你会发现在本地没有生成对应的chunk访问却正常。

下面这张来自webpack官网的图片，可以很清晰地说明`module`、`entry`、`chunk`三者的关系以及webpack如何实现热更新的：

![HMR](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/webpack_fe/hmr.jpg)

enter0表示入口文件，chunk1~4分别是提取公共模块所生成的资源块，当模块4和9发生改变时，因为模块4被打包在chunk1中，模块9打包在chunk3中，所以HMR runtime会将变更部分同步到chunk1和chunk3中对应的模块，从而达到hot replace。

webpack-dev-server的启动很简单，配置完成之后可以通过cli启动，然后在页面引入入口文件时添加webpack-dev-server的host即可将HMR集成到已有服务器：

``` xml
...
<body>
    ...
    <script src="http://localhost:8080/__build/vendors.js"></script>
    <script src="http://localhost:8080/__build/a.js"></script>
</body>
...
```

因为我们的local server就是基于Node.js的webserver，这里可以更进一步，将HMR以中间件的形式集成到local webserver，不需要cli方式启动（少开一个cmd tab）：

``` js
// app.js
var webpackDevMiddleware = require('koa-webpack-dev-middleware');
var webpack = require('webpack');
var webpackConf = require('./webpack.config');

app.use(webpackDevMiddleware(webpack(webpackConf), {
    contentBase: webpackConf.output.path,
    publicPath: webpackConf.output.publicPath,
    hot: true,
    stats: webpackConf.devServer.stats
}));
```

启动HMR之后，每次保存都会重新编译生成新的chnuk，通过控制台的log，可以很直观地看到这一过程：

![HMR build](https://raw.githubusercontent.com/chemdemo/chemdemo.github.io/master/img/webpack_fe/hmr_build.png)

#### 组件化

webpack解决了资源依赖的问题，这使得封装组件变得很容易，例如：

``` js
// js/components/component-x.js
require('./component-x.css');

// @see https://github.com/okonet/ejs-loader
var template = require('./component-x.ejs');
var str = template({foo: 'bar'});

function someMethod() {}

exports.someMethod = someMethod;
```

使用：

``` js
// js/a.js
import {someMethod} from "./components/component-x";
someMethod();
```

正如开头我们说的，将三种语言、多种资源合并成js来管理，大大降低了维护成本。


webpack有一个配置项`resolve`，用于解决`require()`API的资源路径查找，可以把node_modules添加到search root列表里边，这样即达到前后端共享npm模块：

``` js
// webpack.config.js
resolve: {
    root: [process.cwd() + '/src', process.cwd() + '/node_modules'],
    alias: {},
    extensions: ['', '.js', '.css', '.scss', '.ejs', '.png', '.jpg']
},
```

``` bash
$ npm install jquery react --save
```

``` js
// page-x.js
import $ from 'jquery';
import React from 'react';
```

对于依赖的不能被正确resoved的资源，请查阅webpack的[externals](http://webpack.github.io/docs/configuration.html#externals)配置。

#### 项目开发

由于入口文件是手动使用script引入的，在webpack编译之后入口文件的名称和路径一般会改变，即开发环境和生产环境引用的路径不同：

``` js
// 开发环境
// a.html
<script src="/__build/vendors.js"></script>
<script src="/__build/a.js"></script>
```

``` js
// 生产环境
// a.html
<script src="http://cdn.site.com/js/460de4b8.vendors.min.js"></script>
<script src="http://cdn.site.com/js/e7d20340.a.min.js"></script>
```

webpack同样提供了`HtmlWebpackPlugin`插件来解决这个问题，HtmlWebpackPlugin支持从模板生成html文件，生成的html里边可以正确解决js打包之后的路径、文件名问题，配置示例：

``` js
// webpack.config.js
plugins: [
    new HtmlWebpackPlugin({
        template: './src/a.html',
        filename: 'a',
        inject: 'body',
        chunks: ['vendors', 'a']
    })
]
```

这里资源根路径的配置在`output`项：

``` js
// webpack.config.js
output: {
    ...
    publicPath: debug ? '/__build/' : 'http://cdn.site.com/'
}
```

其他入口html文件采用类似处理方式。


### 综述

local server解决了本地开发环境的问题，webpack解决了开发和生产环境资源依赖管理的问题。在实际的开发中，可能会有许多额外的任务需要完成，比如对于使用compass生成sprites的项目，因目前webpack还不直接支持sprites，所以还需要compass watcher，再比如工程的remote deploy等，所以需要使用一些构建工具（如Gulp）的配合，真正打通研发的各个链路。

前端的资源依赖管理，使用Grunt、Gulp等构建工具结合插件也能做，但是配置的门槛不低，而且在接触到webpack之前笔者一直没有找到一种比较满意的做法。

webpack以一种非常优雅的方式解决了前端资源依赖管理的问题，内部做了很多事情，但是对于使用者而言要达到相同的目的只需要做少量的配置，再结合构建工具，很容易搭建一套前端工程解决方案。

附上笔者根据本篇的理论所完成的一个纯静态页面型前端自动化解决方案模板：
[webpack-bootstrap](https://github.com/chemdemo/webpack-bootstrap)

（完）。
