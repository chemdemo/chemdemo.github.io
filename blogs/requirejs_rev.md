# 修改grunt-rev插件自动同步requirejs合并生成的主模块名

在使用grunt作为项目管理的前端项目中，rev插件是很常用的工具，它可以根据文件的内容自动更改文件名，这很方便，不用再去担心文件缓存的问题了。

但是当碰到requirejs作为模块加载器的项目时，rev虽然正确处理了html文件里的脚本名引用（就是`data-mian`），data-main的值会被换成`[hash].main.js`。在最终打包好的js文件会生成`define('main', [], function() {})`，即main模块，但模块名称没变，所以会导致最终生成的js文件不执行。

为此，可以简单地对rev模块进行修改，指定main脚本路径，合并之后的main文件经过hash改变名称之后，再替换`define("main")`为hash生成的文件名。

为了保持扩展性，在不改变rev模块原有参数的前提下，增加`amd`参数：

``` javascript
rev: {
    dist: {
        options: {
            algorithm: 'sha1',
            length: 4
        },
        src: [
            // '<%= base.dist %>/js/*.js',
            '<%= base.dist %>/css/*.css',
            '<%= base.dist %>/img/*.{jpg,jpeg,png,gif}'
        ],
        amd: {
            mainName: 'main',
            src: '<%= base.dist %>/js/main.js'
        }
    }
}
```

其中，`mainName`表示requirejs的主模块名，也就是`grunt-requirejs`插件的`name`配置项：

``` javascript
requirejs: {
    options: {
        name: 'main'
    }
}
```

这样一来，即解决了文件更新的问题，同时又自动更新模块名称。

最终修改过的模块地址：[grunt-rev-amdExt](https://github.com/chemdemo/grunt-rev-amdExt)
