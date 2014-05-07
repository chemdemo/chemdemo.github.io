// 'use strict';

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

var config = {
    headers: false
};
var COUNT = 0;

http.globalAgent.maxSockets = 10;

var proxy = http.createServer(function(req, res) {
    var u = req.url;
    var headers = req.headers;

    req.count = COUNT++;

    if(u.match(/favicon/)) return;

    if(undefined === headers['X-Forworded-For']) {
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
        headers: headers
    };

    // start proxy
    // console.log('[%s] %s %s', method, '\033[33m-->\033[39m', u);
    console.log(format_line_start(Date.now(), headers.host, '->') +
        ' #' + req.count + ' HTTP ' + req.httpVersion + ' request: ' +
        ANSI(ANSI(method, 'bold') + ' ' + u, 'yellow'));
    format_headers(headers);

    req.binary = binary_body_check(headers);

    if(method === 'POST') {
        var buf = [];

        req.on('data', function(chunk) {
            buf.push(chunk);
        });

        req.on('end', function() {
            options.data = Buffer.concat(buf);
            makeRequest(options, res, req);
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

        makeRequest(options, res, req);
    }
});

var makeRequest = function(options, res, req) {
    var u = req.url;
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
        var code = response.statusCode;
        var headers = response.headers;
        var buf = [];

        res.writeHead(code, headers);

        console.log(format_line_start(Date.now(), options.host, '<-') +
            ' #' + req.count + ' HTTP ' + response.httpVersion + ' response: ' +
            ANSI(code + ' ' + http.STATUS_CODES[code], 'yellow'));
        format_headers(headers);

        // response.on('data', function(chunk) {
        //     buf.push(chunk);
        //     // res.write(chunk);
        //     // console.log(chunk.toString('utf8'))
        // });

        response.pipe(res);

        response.on('end', function() {
            console.log(format_line_start(Date.now(), options.host, '<-') +
                ' #' + req.count + ' HTTP ' + response.httpVersion + ' response body: ' +
                format_size(buf.length));

            !req.binary && console.log(ANSI(buf.toString('utf8'), 'green'));
        });

        // console.log('[%s] %s %s', method, '\033[32m<--\033[39m', u);
        // response.pipe(res);

        response.on('error', function(err) {
            console.error('error', err);
            client.abort();
            res.end(err.message);
        });
    });

    if(method === 'POST') client.write(options.data);

    client.end();
};

// string format
// https://github.com/mranney/http_trace/blob/master/http_trace#L23
var ANSI = (function () {
    // http://en.wikipedia.org/wiki/ANSI_escape_code
    var formats = {
        bold: [1, 22], // bright
        light: [2, 22], // faint
        italic: [3, 23],
        underline: [4, 24], // underline single
        blink_slow: [5, 25],
        blink_fast: [6, 25],
        inverse: [7, 27],
        conceal: [8, 28],
        strikethrough: [9, 29], // crossed-out
        // 10 - 20 are font control
        underline_double: [21, 24],
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        grey: [90, 39]
    };
    var CSI = String.fromCharCode(27) + '[';

    return function (str, format) {
        if (config['no-color']) {
            return str;
        }
        return CSI + formats[format][0] + 'm' + str + CSI + formats[format][1] + 'm';
    };
}());

function lpad(num, len) {
    var str = num.toString();

    while (str.length < len) {
        str = '0' + str;
    }
    return str;
};

function binary_body_check(headers) {
    var ct = headers['Content-Type'];
    if (ct && (/^(image|video)/.test(ct))) {
        return true;
    } else {
        return false;
    }
};

function format_timestamp(timems) {
    var date_obj = new Date(timems);

    return ANSI(lpad(date_obj.getHours(), 2) + ':' + lpad(date_obj.getMinutes(), 2) + ':' + lpad(date_obj.getSeconds(), 2) + '.' +
        lpad(date_obj.getMilliseconds(), 3), 'blue');
};

function format_hostname(hostname) {
    if (/[a-zA-Z]/.test(hostname)) {
        var parts = hostname.split(':');
        return ANSI(parts[0] + ':' + (parts[1] || 80), 'magenta');
    } else {
        return ANSI(hostname, 'magenta');
    }
};

function format_line_start(ts, src, dir) {
    return [format_timestamp(ts), format_hostname(src), ANSI(dir, 'cyan')].join(' ');
};

function format_headers(headers) {
    var matched = [], keys = Object.keys(headers);

    if (config.headers) {
        matched = keys;
    } else if (Array.isArray(config['show-header'])) {
        matched = keys.filter(function (key) {
            return config['show-header'].some(function (filter) {
                return filter.test(key);
            });
        });
    }

    if (matched.length === 0) {
        return;
    }

    console.log(matched.map(function (val) {
        if (val === 'Cookie') {
            var cookie_pairs = headers[val].split('; ').sort();
            return ('    ' + ANSI(val, 'white') + ': ' + ANSI(cookie_pairs.map(function (pair) {
                var parts = pair.split('=');
                return parts[0] + ': ' + parts[1];
            }).join('\n            '), 'grey'));
        } else {
            return ('    ' + ANSI(val, 'white') + ': ' + ANSI(headers[val], 'grey'));
        }
    }).join('\n'));
};

function format_size(size) {
    if (size < 1024 * 2) {
        return size + 'B';
    } else if (size < 1024 * 1024 * 2) {
        return (size / 1024).toFixed(2) + 'KB';
    } else {
        return (size / 1024 / 1024).toFixed(2) + 'MB';
    }
};

function format_obj(obj) {
    var keys = Object.keys(obj).sort();

    return keys.map(function (key) {
        if (typeof obj[key] === 'object') {
            return '    ' + ANSI(key, 'white') + util.inspect(obj[key]);
        } else {
            return '    ' + ANSI(key, 'white') + ': ' + ANSI(obj[key], 'grey');
        }
    }).join('\n');
};

proxy.listen(7788, '0.0.0.0', function() {
    console.log('listen ok!');
});
