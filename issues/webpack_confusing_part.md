# 【翻译】Webpack——令人困惑的地方

原文 [Webpack—The Confusing Parts](https://medium.com/@rajaraodv/webpack-the-confusing-parts-58712f8fcad9#.jaqo97f72)

Webpack是目前基于React和Redux开发的应用的主要打包工具。我想使用Angular 2或其他框架开发的应用也有很多在使用Webpack。

当我第一次看到Webpack的配置文件时，它看起来非常的陌生，我非常的疑惑。经过一段时间的尝试之后我认为这是因为Webpack只是使用了比较特别的语法和引入了新的原理，因此会让使用者感到疑惑。这些也是导致Webpack不被人熟悉的原因。

因为刚开始使用Webpack很让人疑惑，我觉得有必要写几篇介绍Webpack的功能和特性的文章以帮助初学者快速理解。此文是最开始的一篇。



## Webpack的核心原理

Webpack的两个最核心的原理分别是：

1. 一切皆模块
           正如js文件可以是一个“模块（module）”一样，其他的（如css、image或html）文件也可视作模 块。因此，你可以`require('myJSfile.js')`亦可以`require('myCSSfile.css')`。这意味着我们可以将事物（业务）分割成更小的易于管理的片段，从而达到重复利用等的目的。

2. 按需加载
   传统的模块打包工具（module bundlers）最终将所有的模块编译生成一个庞大的`bundle.js`文件。但是在真实的app里边，“bundle.js”文件可能有10M到15M之大可能会导致应用一直处于加载中状态。因此Webpack使用许多特性来分割代码然后生成多个“bundle”文件，而且异步加载部分代码以实现按需加载。

好了，下面来看看那些令人困惑的部分吧。



## 1. 开发模式和生产模式

首先要知道的是Webpack有许许多多的特性，一些是”开发模式“下才有的，一些是”生产模式“下才有的，还有一些是两种模式下都有的。

![A sample dev v/s prod Webpack files](https://cdn-images-1.medium.com/max/800/1*WCAdMi04IFEWdngK8bkFcw.png)

> 通常使用到Webpack如此多特性的项目都会有两个比较大的Webpack配置文件

为了生成bundles文件你可能在`package.json`文件加入如下的scripts项：

``` js
"scripts": {
  // 运行npm run build 来编译生成生产模式下的bundles
  "build": "webpack --config webpack.config.prod.js",
  // 运行npm run dev来生成开发模式下的bundles以及启动本地server
  "dev": "webpack-dev-server"
 }
```



## 2. webpack CLI 和webpack-dev-server

值得注意的是，Webpack作为模块打包工具，提供两种用户交互接口：

1. Webpack CLI tool：默认的交互方式（已随Webpack本身安装到本地）
2. webpack-dev-server：一个Node.js服务器（需要开发者从npm自行安装）




### Webpack CLI（有利于生产模式下打包）

这种方式可以从命令行获取参数也可以从配置文件（默认叫webpack.config.js）获取，将获取到的参数传入Webpack来打包。

>当然你也可以从命令行（CLI）开始学习Webpack，以后你可能主要在生产模式下使用到它。

用法：

``` js
方式1: 
// 全局模式安装webpack
npm install webpack --g
// 在终端输入
$ webpack // <--使用webpack.config.js生成bundle

方式 2 :
// 费全局模式安装webpack然后添加到package.json依赖里边
npm install webpack --save
// 添加build命令到package.json的scripts配置项
"scripts": {
 "build": "webpack --config webpack.config.prod.js -p",
 ...
 }
// 用法：
"npm run build"
```



### webpack-dev-server（有利于在开发模式下编译）

这是一个基于Express.js框架开发的web server，默认监听8080端口。server内部调用Webpack，这样做的好处是提供了额外的功能如热更新“Live Reload”以及热替换“Hot Module Replacement”（即HMR）。

用法：

``` js
方式 1:
// 全局安装
npm install webpack-dev-server --save
// 终端输入
$ webpack-dev-server --inline --hot

用法 2:
// 添加到package.json scripts
"scripts": {
 "start": "webpack-dev-server --inline --hot",
 ...
 }
// 运行： 
$ npm start

// 浏览器预览：
http://localhost:8080
```



### Webpack VS Webpack-dev-server选项

注意像`inline`和`hot`这些选项是Webpack-dev-server特有的，而另外的如`hide-modules`则是CLI模式特有的选项。



### webpack-dev-server CLI选项和配置项

另外值得注意的是你可以通过以下两种方式向webpack-dev-server传入参数：

1. 通过webpack.config.js文件的"devServer"对象
2. 通过CLI选项

``` js
// 通过CLI传参
webpack-dev-server --hot --inline
// 通过webpack.config.js传参
devServer: {
  inline: true,
  hot:true
}
```

> 我发现有时devServer配置项（hot: true 和inline: true）不生效，我更偏向使用如下的方式向CLI传递参数：

``` js
// package.json
{
    "scripts": "webpack-dev-server --hot --inline"
}
```

> 注意：确定你没有同时传入`hot:true`和`-hot`



### webpack-dev-server的“hot” 和 “inline”选项

“inline”选项会为入口页面添加“热加载”功能，“hot”选项则开启“热替换（Hot Module Reloading）”，即尝试重新加载组件改变的部分（而不是重新加载整个页面）。如果两个参数都传入，当资源改变时，webpack-dev-server将会先尝试HRM（即热替换），如果失败则重新加载整个入口页面。

``` js
// 当资源发生改变，以下三种方式都会生成新的bundle，但是又有区别：
 
// 1. 不会刷新浏览器
$ webpack-dev-server
//2. 刷新浏览器
$ webpack-dev-server --inline
//3. 重新加载改变的部分，HRM失败则刷新页面
$ webpack-dev-server  --inline --hot
```



## 3. “entry”：值分别是字符串、数组和对象的情况

Enter配置项告诉Webpack应用的根模块或起始点在哪里，它的值可以是字符串、数组或对象。这看起来可能令人困惑，因为不同类型的值有着不同的目的。

像绝大多数app一样，倘若你的应用只有一个单一的入口，enter项的值你可以使用任意类型，最终输出的结果都是一样的。

![Different entry types but same output](https://cdn-images-1.medium.com/max/800/1*OnXpfv4zjL-5zO2Ha6mXDw.png)



### enter：数组类型

但是，如果你想添加多个彼此不互相依赖的文件，你可以使用数组格式的值。

例如，你可能在html文件里引用了“googleAnalytics.js”文件，可以告诉Webpack将其加到bundle.js的最后。

![enter array](https://cdn-images-1.medium.com/max/800/1*yLVdS3oN4Xo8KInoTIfi0A.png)



### enter：对象

现在，假设你的应用是多页面的（multi-page application）而不是SPA，有多个html文件（index.html和profile.html）。然后你通过一个对象告诉Webpack为每一个html生成一个bundle文件。

以下的配置将会生成两个js文件：indexEntry.js和profileEntry.js分别会在index.html和profile.html中被引用。

![entry object](https://cdn-images-1.medium.com/max/800/1*xB51RRC4ik6BBP2lJ90Iuw.png)

用法：

``` js
//profile.html
<script src=”dist/profileEntry.js”></script>
//index.html
<script src=”dist/indexEntry.js”></script>
```

注意：文件名取自“entry”对象的键名。



### enter：混合类型

你也可以在enter对象里使用数组类型，例如下面的配置将会生成3个文件：vender.js（包含三个文件），index.js和profile.js文件。

![enter combination](https://cdn-images-1.medium.com/max/800/1*yz76QY1fVzBGKJ-6X6Eleg.png)



## 4. output：“path”项和“publicPath”项

output项告诉webpack怎样存储输出结果以及存储到哪里。output的两个配置项“path”和“publicPath”可能会造成困惑。

“path”仅仅告诉Webpack结果存储在哪里，然而“publicPath”项则被许多Webpack的插件用于在生产模式下更新内嵌到css、html文件里的url值。

![publicPath in Development vs Production](https://cdn-images-1.medium.com/max/800/1*63Zta4mbC_3o44QdycrD7Q.png)

例如，在localhost（译者注：即本地开发模式）里的css文件中边你可能用“./test.png”这样的url来加载图片，但是在生产模式下“test.png”文件可能会定位到CDN上并且你的Node.js服务器可能是运行在HeroKu上边的。这就意味着在生产环境你必须手动更新所有文件里的url为CDN的路径。

然而你也可以使用Webpack的“publicPath”选项和一些插件来在生产模式下编译输出文件时自动更新这些url。

![publicPath Production example](https://cdn-images-1.medium.com/max/800/1*aOM5ZF8alWLr4BC0CfZe0w.png)

``` js
// 开发环境：Server和图片都是在localhost（域名）下
.image { 
  background-image: url('./test.png');
 }
// 生产环境：Server部署下HeroKu但是图片在CDN上
.image { 
  background-image: url('https://someCDN/test.png');
 }
```



## 5. 模块加载和链式模块加载

模块加载器是可自由添加的Node模块，用于将不同类型的文件“load”或“import”并转换成浏览器可以识别的类型，如js、Stylesheet等。更高级的模块加载器甚至可以支持使用ES6里边的“require”或“import”引入模块。

例如，你可以使用`babel-loader`来将使用ES6语法写成的文件转换成ES5：

``` js
module: {
 loaders: [{
  test: /\.js$/, // 匹配.js文件，如果通过则使用下面的loader
  exclude: /node_modules/, // 排除node_modules文件夹
  loader: 'babel' // 使用babel（babel-loader的简写）作为loader
 }]
```



### 链式（管道式）的加载器（从右往左执行）

多个loader可以用在同一个文件上并且被链式调用。链式调用时从右到左执行且loader之间用“!”来分割。

例如，假设我们有一个名为“myCssFile.css”的css文件，然后我们想将它的内容使用style标签内联到最终输出的html里边。我们可以使用css-loader和style-loader两个loader来达到目的。

``` js
module: {
 loaders: [{
  test: /\.css$/,
  loader: 'style!css' //(short for style-loader!css-loader)
 }]
```

这里展示它是如何工作的：

![chaining loaders](https://cdn-images-1.medium.com/max/800/1*nes9iLmskmsD8Fp4Ek3u-A.png)

1. Webpack在模块颞部搜索在css的依赖项，即Webpack检查js文件是否有“require('myCssFile.css')”的引用，如果它发现有css的依赖，Webpack将css文件交给“css-loader”去处理
2. css-loader加载所有的css文件以及css自身的依赖（如，@import 其他css）到JSON对象里，Webpack然后将处理结果传给“style-loader”
3. style-loader接受JSON值然后添加一个style标签并将其内嵌到html文件里




## 6. loader自身可以配置

模块加载器（loader）自身可以根据传入不同的参数进行配置。

在下面的例子中，我们可以配置url-loader来将小于1024字节的图片使用DataUrl替换而大于1024字节的图片使用url，我们可以用如下两种方式通过传入“limit“参数来实现这一目的：

![configure loaders](https://cdn-images-1.medium.com/max/800/1*-qVdcA3E8JSdtszxHqfIdA.png)



## 7. .babelrc 文件

babal-loader使用”presets“配置项来标识如何将ES6语法转成ES5以及如何转换React的JSX成js文件。我们可以用如下的方式使用”query“参数传入配置：

``` js
module: {
  loaders: [
    {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['react', 'es2015']
      }
    }
  ]
}
```

然而在很多项目里babel的配置可能比较大，因此你可以把babel-loader的配置项单独保存在一个名为”.babelrc“的文件中，在执行时babel-loader将会自动加载.babelrc文件。

所以在很多例子里，你可能会看到：

``` js
//webpack.config.js 
module: {
  loaders: [
    {
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel'
    }
  ]
}

//.bablerc
{
 presets: ['react', 'es2015']
}
```



## 8. 插件

插件一般都是用于输出bundle的node模块。

例如，[uglifyJSPlugin](https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin)获取bundle.js然后压缩和混淆内容以减小文件体积。

类似的[extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin)内部使用css-loader和style-loader来收集所有的css到一个地方最终将结果提取结果到一个独立的”styles.css“文件，并且在html里边引用style.css文件。

``` js
//webpack.config.js
// 获取所有的.css文件，合并它们的内容然后提取css内容到一个独立的”styles.css“里
var ETP = require("extract-text-webpack-plugin");

module: {
 loaders: [
  {test: /\.css$/, loader:ETP.extract("style-loader","css-loader") }
  ]
},
plugins: [
    new ExtractTextPlugin("styles.css") //Extract to styles.css file
  ]
}
```

注意：如果你只是想把css使用style标签内联到html里，你不必使用extract-text-webpack-plugin，仅仅使用css loader和style loader即可：

``` js
module: {
 loaders: [{
  test: /\.css$/,
  loader: 'style!css' // (short for style-loader!css-loader)
 }]
```



## 9. 加载器（loader）和插件

你可能已经意识到了，Loader处理单独的文件级别并且通常作用于包生成之前或生成的过程中。

而插件则是处理包（bundle）或者chunk级别，且通常是bundle生成的最后阶段。一些插件如[commonschunkplugin](https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin)甚至更直接修改bundle的生成方式。



## 10. 处理文件的扩展名

很多Webpack的配置文件都有一个`resolve`属性，然后就像下面代码所示有一个空字符串的值。空字符串在此是为了resolve一些在import文件时不带文件扩展名的表达式，如`require('./myJSFile')`或者`import myJSFile from './myJSFile'`（译者注：实际就是自动添加后缀，默认是当成js文件来查找路径）

``` js
{
 resolve: {
   extensions: ['', '.js', '.jsx']
 }
}
```

就这么多。


