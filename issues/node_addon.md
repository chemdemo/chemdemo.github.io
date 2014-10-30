# 给Node.js编译C++扩展

前些日子在开发一个Node.js项目的时候，请求量什么的需要上报公司统一的monitor。已有的接口是C++写成的，也有编译好的二进制文件可以直接用shell命令调用，如果简单使用的话可能只需调用nodejs`child_process`模块执行命令行即可，但是感觉这种方法比较蹩脚，每一个前端请求都需要创建一个子进程，开销太大。于是决定使用C++库编译node扩展。

编译node扩展，本来[官方文档](http://nodejs.org/api/addons.html)说的已经很清晰了，按照文档一步步来即可，这里大概记录下编译过程和所碰到的问题。

1.新建attrlib.cc C++原文件，添加V8头文件、引入lib头文件：
``` cpp
#include <node.h>
#include <v8.h>
#include "Attr_API.h"
using namespace v8;
```

2.封装接口，完成对C++ lib api所需参数的类型、个数什么的做检查，对暴露的js接口进行容错，这里因之前完全没接触过C++，对它的各种数据类型的检查和转换花了不少的时间。

针对`Attr_API.h`头文件里的api接口（这里做为例子，其他接口省去了）：
``` cpp
int adv_attr_set(int attr_id , size_t len , char* pvalue);
```

具体的封装：
``` cpp
Handle<Value> AdvAttrSet(const Arguments& args) {
    HandleScope scope;

    if(args.Length() < 3) {
        ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
        return scope.Close(Undefined());
    }

    v8::String::Utf8Value pVal(args[2]->ToString());

    Local<Integer> iRet = Integer::New(adv_attr_set(
        args[0]->Int32Value(),
        args[1]->IntegerValue(),
        (char*) *pVal
    ));

    return scope.Close(iRet);
}
```

3.暴露js接口：
``` cpp
void init(Handle<Object> exports) {
    exports->Set(String::NewSymbol("advAttrSet"),
        FunctionTemplate::New(AdvAttrSet)->GetFunction());
}

NODE_MODULE(AttrLib, init);
```

接下来编写`binding.gyp`，它就是一个json格式的配置文件（node低版本使用wscript文件进行编译，高版本都采用binding.gyp），接着使用[node-gyp](https://github.com/TooTallNate/node-gyp)模块进行自动编译。

``` json
{
    "targets": [
        {
            "target_name": "AttrLib",
            "sources": [ "attrlib.cc" ],
            "libraries": [ "/data/nodejs/modules/base/tools/attrapi/attrapi.a" ]
        }
    ]
}
```

这里简单说下，如果C++ lib使用了静态（.a文件）或者动态链接库（.so文件），只需要在libraries这一项里指出该库的路劲即可，笔者一开始因为没引入静态链接库，编译出来的`.node`文件在调用的时候会报错：node: symbol lookup error: /data/nodejs/modules/base/test/attr_api/build/Release/attr_api.node: undefined symbol: Attr_API。

接下来又开始编译，再一次报错：6_64_32 against `.rodata' can not be used when making a shared object; recompile with -fPIC /data/nodejs/modules/base/tools/attrapi/attrapi.a: could not read symbols: Bad value collect2: ld returned 1 exit status

问了google才知道是个很常见的C++编译错误，即需要指定`-fPIC`参数。但是看了binding.gyp似乎没这个配置，于是请教后台同学，恰好有人碰到过这个错误，发现是静态链接库不完整导致。

接下来开始编译，cd到`binding.gyp`所在路径，运行：`node-gyp configure build`，会生成一个build文件夹，进去之后会发现很多的文件，其中就有大家熟悉的Makefile，猜想node-gyp应该是通过配置生成Makefile，然后再运行make。

最后就是编写测试用例，逐个去跑了。

总体来说，编译node C++扩展扩展很简单，但是碰到抛异常的话，对于jser来说还是很蛋疼。
