# 给Node.js编译C++扩展

- problem1

``` bash
node: symbol lookup error: /data/nodejs/modules/base/test/attr_api/build/Release/attr_api_node.node: undefined symbol: Attr_API
```

- problem2

``` bash
6_64_32 against `.rodata' can not be used when making a shared object; recompile with -fPIC
/usr/local/agenttools/agent/attr_api.a: could not read symbols: Bad value
collect2: ld returned 1 exit status
```
