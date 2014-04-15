# grunt JST插件的一点点改进

Node.js的兴起、Grunt的出现，对前端来说是一场工业革命，因为grunt之类的项目管理工具，它让前端开发向着**工程化**迈进了一大步。grunt很强大，但也很复杂，往后的文章会逐渐分享下grunt的一些配置经验，本篇是对grunt官方插件——JST的一点点改进。

对于设计良好的Web App来说，数据（Model）和模板（View）分离几乎是标配，但当逻辑比较复杂的时候，模板管理是个让人头疼的事情。

以往的做法是把模板放到一个`script`标签里，设置一个id，在用到的时候取这个script节点的`innerHTML`。这有个问题就是不同page之间模板不能复用，还有就是整洁的html页面里乱入了一些里边是一坨非js的script节点这对于有代码洁癖的童靴来说是很受不的。

还有一种很流行的做法是使用requirejs动态加载html模板，但是并非所有的项目都用到了requirejs。

对于使用grunt作为项目管理的项目来说，可以尝试使用grunt官方提供的[grunt-contrib-jst](https://github.com/gruntjs/grunt-contrib-jst)插件，将html模板编译成js文件，编译出来的js文件其实就包含了几个