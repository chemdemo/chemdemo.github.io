# grunt 模板插件的使用以及一点改进

Grunt很强大，但也很复杂，往后的文章会逐渐分享下grunt的一些配置经验。本篇是对grunt官方插件——JST的一点点改进。

对于设计良好的Web App来说，数据（Model）和模板（View）分离几乎是标配，但当逻辑比较复杂的时候，模板管理是个让人头疼的事情。

以往的做法是把模板放到一个`script`标签里，设置一个id，在用到的时候取这个script节点的`innerHTML`。这有个问题就是不同page之间模板不能复用，还有就是整洁的html页面里乱入了一些里边是一坨非js的script节点这对于有代码洁癖的童靴来说是很受不的。

还有一种很流行的做法是使用requirejs动态加载html模板，但是并非所有的项目都用到了requirejs。

对于使用grunt作为项目管理的项目来说，可以尝试使用grunt官方提供的[grunt-contrib-jst](https://github.com/gruntjs/grunt-contrib-jst)插件，将html模板编译成js文件，编译出来的js文件其实就是调用underscore的模板对html文件进行预编译，生成几个函数。配置项这里不赘述，参考官方示例即可。至于模板，一般都是同一个页面所需的模板编译成一个js，根据文件名进行区分。

假设有如下html模板`tmpl-list.html`：

``` xml
<ul>
    <% list.forEach(function(item) { %>
        <li><%= item.name %><strong><%= item.price %></strong></li>
    <% }); %>
</ul>
```

编译生成如下js文件`listTmpl.js`（名称可配置）：

``` javascript
this["JST"]["tmplList"] = function(obj) {
    var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
    // template string here...
};
```

ok，到了这里就算完成模板编译。

细心的童靴可能会发现预编译出来的这个js，它引用了`_.escape`，换句话说就是它还是依赖underscore或者lodash，或者要把用到的几个方法单独拷贝出来插到其他脚本里。

这里提供了一种方法，就是把模板所用到的额外的函数或者变量，统统塞到编译成的js文件里头，使得生成的js能够独立运行。在这里，我们给jst插件添加个参数`prepend`（借鉴jQuery的api），在jst的task文件加这么几行：

``` javascript
if(options.prepend) {
    var prepend = options.prepend;

    if(typeof prepend === 'function') prepend = prepend();

    if(options.prettify) prepend = prepend.replace(/(^\s+|\s+$)/gm, '');

    output.unshift(prepend);
}
```

prepend即支持string也支持传入函数，用法如下：

``` javascript
jst: {
    compile: {
        options: {
            prepend: function() {
                var vars = function() {
                    var _ = {};

                    _.escape = function(string) {
                        var escapeMap = {
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#x27;'
                        };
                        var escapeRegexe = new RegExp('[' + Object.keys(escapeMap).join('') + ']', 'g');

                        if (string == null) return '';
                        return ('' + string).replace(escapeRegexe, function(match) {
                            return escapeMap[match];
                        });
                    };
                };
                var entire = vars.toString();

                // entire = entire.replace(/(^\s+|\s+$)/gm, '');

                return entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
            },
        }
    }
}
```

ok，其实就这么点内容，很简单的一个问题竟然用了这么大篇幅，罪过罪过。。

改进之后的项目地址：[https://github.com/chemdemo/grunt-contrib-jst](https://github.com/chemdemo/grunt-contrib-jst)
