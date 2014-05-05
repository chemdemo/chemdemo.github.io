'use strict';

// A simple proxy built with nodejs
// win7: control pannel->Windows Firewall -> advanced settings -> Inbound rule -> local port to 7788

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var mime = require('mime');

var root = 'E:/projs/svn/qqweb/igoods/dev/';
// var log = fs.createWriteStream('./res.js');
var rules = require('./rules');

http.globalAgent.maxSockets = 10;

var proxy = http.createServer(function(req, res) {
    var u = req.url;

    if(u.match(/favicon/)) return;

    if(undefined === req.headers['X-Forworded-For']) {
        req.headers['X-Forworded-For'] = req.socket.remoteAddress;
    }

    var method = req.method;
    var parsed = url.parse(u);
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

    // start proxy
    console.log('[%s] > %s', method, u);

    if(method === 'POST') {
        var buf = [];

        req.on('data', function(chunk) {
            buf.push(chunk);
        });

        req.on('end', function() {
            options.data = Buffer.concat(buf);
            makeRequest(options, res, u);
        });
    } else {
        var pathname = parsed.pathname;

        // Intercept
        if(pathname === 'pub/check_bizup') return res.end('intercept');
        if(pathname.match(/\/pc\/misc\/qmobile\/native\/package/)) return res.end('intercept');
        // file replace
        if(pathname.match(/\/m\/igoods\/(?:.*)\.(html|js|css|jpg|png)$/)) {
            console.log('[replaced] < %s', u);

            res.writeHead(200, {'Content-Type': mime.lookup(pathname)});

            u = path.join(root, pathname.replace(/\/m\/igoods\/(.*)/, '$1'));

            fs.createReadStream(u).pipe(res);
            return;
        }

        makeRequest(options, res, u);
    }
});

var makeRequest = function(options, res, url) {
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
        console.log('client request timeout:', url);
        res.end('client request timeout');
    });

    client.on('error', function(err) {
        client.abort();
        console.log('client error', err);
        res.end(err.message);
    });

    client.on('response', function(response) {
        res.writeHead(response.statusCode, response.headers);

        // var buf = [];
        // response.on('data', function(chunk) {
        //     buf.push(chunk);
        //     // res.write(chunk);
        //     // console.log(chunk.toString('utf8'))
        // });

        // response.on('end', function() {
        //     console.log('Got response from ' + u + ' at ' + new Date());
        //     res.end(Buffer.concat(buf));
        // });

        console.log('[%s] < %s', method, url);
        response.pipe(res);

        response.on('error', function(err) {
            console.error('error', err);
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
