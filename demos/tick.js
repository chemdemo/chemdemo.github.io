var http = require('http');

function wait(mils) {
    var now = new Date;
    while(new Date - now <= mils);
}

// CPU密集型计算
function traversal() {
    console.log('traversal start.');
    wait(1000);// 用wait模拟一个密集计算任务
    // for(var i=0; i< 100000000; i++) {}
    console.log('traversal end.');
}

// CPU密集型计算
function calculate() {
    traversal();

    // var timer = 'timer' + Date.now();
    // console.time(timer);
    // wait(2000);// 用wait模拟一个密集计算任务
    // for(var i=0; i< 1000000000; i++) {}
    // console.timeEnd(timer);
    process.nextTick(calculate);

    // setTimeout(function() {process.nextTick(calculate);}, 1000);
}

http.createServer(function(req, res) {
    console.log('new request...');
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('request: ' + Date.now());
}).listen(8888);

calculate();
