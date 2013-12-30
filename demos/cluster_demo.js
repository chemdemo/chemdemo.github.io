var http = require('http');
var cluster = require('cluster');
var os = require('os');

if(cluster.isMaster) {
    var cpus = os.cpus().length;

    for(var i=0; i<cpus; i++) {
        var worker = cluster.fork();
        worker.send('[Master]: worker ' + worker.id + ' was started.');
    }

    cluster.schedulingPolicy = cluster.SCHED_NONE;

    cluster.on('listening', function() {
        console.log('[Master]: worker %d was listened.', worker.id);
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker %d was died, PID: .', worker.id, worker.process.pid);
    });

    var workers = cluster.workers;
    Object.keys(workers).forEach(function(wid) {
        workers[wid].on('message', function(msg) {
            console.log('[Worker] Received message from master: ', msg);
        });
    });
} else if(cluster.isWorker) {
    console.log('[Worker]: worker %d started, PID: %d.', cluster.worker.id, process.pid);

    process.on('message', function(msg) {
        console.log('[Master] Received msg from worker: ', msg);
    });

    http.createServer(function(req, res) {
        console.log('Request to node worker server.\nWorkid: %d, PID: %d.', cluster.worker.id, process.pid);
        res.writeHead(200);
        res.end('Worker %d response, PID: %d.', cluster.worker.id, process.pid);
    }).listen(5555);
}
