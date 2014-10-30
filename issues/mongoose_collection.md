# Mongoose动态创建collection

mongoose它内部封装了连接池并内部实现连接池的管理，比原生驱动来的稳定，还有基于mongodb原生驱动的ORM封装，这个特点使得NoSQL的数据结构更加清晰。种种特点使得mongoose这个模块在github上也得到更多人的欢迎。

基于原生的mongodb驱动，数据操作过程：

``` js
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://127.0.0.1:27017/test';

MongoClient.connect(dbUrl, function(err, db) {
    if(err) throw err;

    db.collection('foo').insert({foo: 'bar'}, function(err. doc) {
        // db.close();
        if(err) throw err;
    });

    db.collection('foo').update({foo: 'bar'}, {$set: {foo: 'test'}}, function(err. doc) {
        // db.close();
        if(err) throw err;
    });
});
```

而Mongoose则稍微麻烦：

``` js
// connect
var db = mongoose.connection;

db.on('error', function(err) {
    throw err;
});

mongoose.connect(dbUrl);

// defined Model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EntrySchema = new Schema({
    time: { type: Number, index: true },
    data: Schema.Types.Mixed,
    str: String
});

mongoose.model('Entry', EntrySchema, 'entries');

// insert
var Entry = mongoose.model('Entry');
var entry = new Entry();

entry.time = Date.now();
entry.data = {foo: 'bar'};
entry.srt = 'test';

entry.save(function(err, doc) {
    if(err) throw err;
});

// query
Entry.find({str: 'test'}, null, function(err, docs) {});

// update
Entry.update({str: 'test'}, {$set: {str: 'test2'}}, function(err, doc) {});
```

对比可以看到，原生驱动更好理解，连接db，选择collection进行插入，更新等。

但是对于Mongoose，似乎找不到选择collection的api，所有的操作都是在一个封装好的Model上进行的。

假如我们有需求，需要动态的更新所要操作的collection而是用相同的schema，那如何做到呢？

尝试如下的代码：

``` js
function getModel(collectionName) {
    var schema = new Schema({
        order: {type: number, index: true},
        name: String,
        score: Number
    });

    return mongoose.model('Entry', schema, collectionName);
};

var Entry = getModel('coll_' + Date.now());

new Entry({
    order: 1,
    name: 'foo',
    score: 100
}).save();
```

运行这段代码，当插入第二条数据的时候会报错：`OverwriteModelError: Cannot overwrite `Entry` model once compiled.`

Mongoose会对传入的model进行compiled，因此无法实现这个需求。

那么怎么办呢，只能动态改变传入的model名了，也就是每次都返回一个新的model：

``` js
return mongoose.model('Entry_' + Date.now(), schema, collectionName);
```

这样能做到动态改变集合名称。

看了下[mongoose源码](https://github.com/LearnBoost/mongoose/blob/master/lib/index.js#L332)，发现还可以通过传入同一个schema实例并且制定cache参数实现：

``` js
var schema;
function getModel(collectionName) {
    if(!schema) schema = new Schema({
        order: {type: number, index: true},
        name: String,
        score: Number
    });

    return mongoose.model('Entry_' + Date.now(), schema, collectionName, {cache: true});
};
```

至此，解决了动态创建collection的需求。
