'use strict';

var http = require('http');

var server = http.createServer();

http.globalAgent.maxSockets = 10;

// Emitted when a TCP established.
// server.on('connection', function(socket) {
//     console.log('A TCP connection created.');
// });

server.listen(8888, /*'0.0.0.0', */function() {
    console.log('listen ok.');

    // Emitted when a TCP established.
    server.on('connection', function(socket) {
        console.log('------------- A TCP connection created -------------------', Date.now());
        console.log(Object.keys(http.globalAgent.sockets))
    });

    // Emitted each time there is a request.
    server.on('request', function(req, res) {
        if(req.url.match('favicon.ico')) return;

        console.log('request received.', req.url);

        // console.log(req.constructor) // IncomingMessage -super-> Readable -super-> Stream
        // console.log(res.constructor) // ServerResponse -super-> OutgoingMessage -super-> Stream

        // console.log(req.socket === res.socket) // true
        // res.socket.setNoDelay(false); // defaults to true.
        // res.socket.setKeepAlive(true); // defaults to false.
        // every tab will create a tcp connection in IE
        // but all tabs will create only one tcp connection!

        req.socket.on('end', function() {
            console.log('socket ended...');
        });

        req.socket.on('close', function() {
            console.log('socket closed...');
        });

        req.socket.on('connect', function() {
            console.log('socket connect...');
        });

        // res.socket.end('end');

        res.on('finish', function() {
            console.log('res finished');
        });

        res.on('close', function() {
            console.log('res closed');
        });

        res.end('done');

        // console.log(res.socket); // null
    });
});
