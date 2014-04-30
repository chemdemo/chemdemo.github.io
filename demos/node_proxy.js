'use strict';

// A simple proxy built with nodejs
// win7: control pannel->Windows Firewall -> advanced settings -> Inbound rule -> local port to 7788

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var root = '/';
var log = fs.createWriteStream('./res.js');

http.globalAgent.maxSockets = 10;

var proxy = http.createServer(function(req, res) {
    var u = req.url;

    if(u.match(/favicon/)) return;
    console.log('>', u);

    if(undefined === req.headers['X-Forworded-For']) {
        req.headers['X-Forworded-For'] = req.socket.remoteAddress;
    }

    var method = req.method;
    var parsed = url.parse(u);
    console.log(parsed.protocol, method)
    var options = {
        // host: parsed.hostname,
        // port: parsed.port || 80,
        // path: parsed.path,
        host: 'proxy.tencent.com',
        port: 8080,
        path: parsed.href,
        method: method,
        headers: req.headers
    };

    if(method === 'POST') {
        var buf = [];

        req.on('data', function(chunk) {
            buf.push(chunk);
        });

        req.on('end', function() {
            options.data = Buffer.concat(buf);
            makeRequest(options, res);
        });
    } else {
        makeRequest(options, res);
    }
});

var makeRequest = function(options, res, req) {
    var method = options.method;
    var client = http.request({
        host: options.host,
        port: options.port,
        path: options.path,
        method: method,
        headers: options.headers
    });

    client.setSocketKeepAlive(false);

    client.setTimeout(10000, function() {
        client.abort();
        console.log('client request timeout:', u);
        res.end('client request timeout');
    });

    client.on('error', function(err) {
        client.abort();
        console.log('client error', err);
        res.end(err.message);
    });

    client.on('response', function(response) {
        res.writeHead(response.statusCode, response.headers);

        // response.on('data', function(chunk) {
        //     buf.push(chunk);
        //     // res.write(chunk);
        //     // console.log(chunk.toString('utf8'))
        // });

        // response.on('end', function() {
        //     console.log('Got response from ' + u + ' at ' + new Date());
        //     res.end(Buffer.concat(buf));
        // });

        response.pipe(res);

        response.on('error', function(err) {
            console.error(err);
            client.abort();
            res.end(err.message);
        });
    });

    if(method === 'POST') client.write(options.data);

    client.end();
};

proxy.listen(7788, '0.0.0.0', function() {
    console.log('listen ok!');
});
