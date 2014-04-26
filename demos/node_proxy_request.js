// a simple proxy request client

'use strict';

console.log(process.pid);

var http = require('http');

var body = '';
var req = http.request({
    // Internal proxy
    host: 'proxy.tencent.com',
    port: 8080,
    path: process.argv[2] || 'http://www.baidu.com'
}, function(res) {
    res.setEncoding('utf8');

    // res.on('data', function(chunk) {
    //     body += chunk.toString('utf8');
    // });

    // res.on('end', function() {
    //     console.log(body);
    //     // process.exit();
    // });

    res.pipe(process.stdout);
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

req.end();
