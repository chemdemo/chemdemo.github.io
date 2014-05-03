var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function(req, res) {
    var u = req.url;

    if(u.match(/favicon/)) return;

    if(u === '/') fs.createReadStream('./browser.html').pipe(res);
    if(u.match(/Promise\.js/)) fs.createReadStream('../lib/Promise.js').pipe(res);
    if(u.match(/browser\.js/)) fs.createReadStream('browser.js').pipe(res);
    if(u.match(/\.json/)) {
        res.writeHeader(200, {
            'Content-Type': 'application/json'
        });

        fs.createReadStream(path.join(__dirname, u)).pipe(res);
    }
}).listen(1366);
