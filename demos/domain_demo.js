var should = require('should');

var domain = require('domain');
var http = require('http');
var fs = require('fs');
var events = require('events');

// see: http://www.slideshare.net/domenicdenicola/domains-20010482
// mocha has bug when working with node v0.8

// ===
// // domain was not exists by default
// should.not.exist(process.domain);

// var d = domain.create();

// d.on('error', function(err) {
//     console.log(err);
// });

// d.enter(); // makes d the current domain

// process.domain.should.be.an.Object;
// process.domain.should.equal(domain.active);

// d.exit(); // makes d inactive

// should.not.exist(process.domain);

// ===
// what domain effects
// timer(setTimeout, setInterval, setImmediate, process.nextTick)、EventEmitter
// process.on('uncaughtException', function(err) {
//     err.message.should.match(/non_existent_1/);
//     console.error('Error caught in uncaughtException event:', err);
// });

// var d = domain.create();

// d.on('error', function(err) {
//     err.message.should.match(/non_existent_2/);
//     console.error('Error caught by domain:', err);
// });

// // timer case
// process.nextTick(function() {
//     should.not.exist(process.domain);
//     fs.readFile('non_existent_1.js', function(err, str) {
//         if(err) throw err;
//         console.log(str);
//     });
//     d.enter();
//     process.domain.should.be.an.Object;
//     fs.readFile('non_existent_2.js', function(err, str) {
//         if(err) throw err;
//         console.log(str);
//     });
//     d.exit();
// });

// EventEmitter case
// process.on('uncaughtException', function(err) {
//     console.error('Error caught in uncaughtException event:', err);
// });

// var d = domain.create();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err);
// });

// var e1 = new events.EventEmitter();
// should.not.exist(e1.domain);

// d.enter();
// process.domain.should.equal(domain.active);
// var e2 = new events.EventEmitter();
// e2.domain.should.be.an.object;
// e2.domain.should.equal(domain.active);
// d.exit();
// e2.on('error', function(err) {
//     console.error('Error caught by e2:', err);
// });
// e2.on('file', function() {
//     // when an `error` event is emitted and not handled, gives it to the domain
//     fs.readFile('non_existent.js', function(err, str) {
//         if(err) e2.emit('error', err);
//         else e2.emit('file', str.toString());
//     });
// });
// e2.emit('file');

// ===
// try/catch can not catch exceptions from asynchronous function
// process will exit when uncaughtException error caught!!!
// process.on('uncaughtException', function(err) {
//     console.error('Error caught in uncaughtException event:', err);
// });

// try {
//     process.nextTick(function() {
//         fs.readFile('non_existent.js', function(err, str) {
//             if(err) throw err;
//             else console.log(str);
//         });
//     });
// } catch(e) {
//     console.error('Error caught by catch block:', e);
// }

// ===
// use domain to catch exceptions from asynchronous function
// var d = domain.create();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err);
// });

// process.on('uncaughtException', function(err) {
//     console.error('Error caught in uncaughtException event:', err); // err has a `domain` object
// });

// d.run(function() {
//     process.nextTick(function() {
//         fs.readFile('non_existent.js', function(err, str) {
//             if(err) throw err;
//             else console.log(str);
//         });
//     });
// });

// ===
// use `bind()` case
// var d = domain.create();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err); // err.domainThrown = false
// });

// http.createServer(function(req, res) {
//     fs.readFile('non_existent.js', d.bind(function(err, str) {
//         if(err) throw err;
//         else res.end(str.toString());
//     }));
// }).listen(8888);

// ===
// use `intercept()` case
// var d = domain.create();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err); // err.domainThrown = false
// });

// http.createServer(function(req, res) {
//     fs.readFile('non_existent.js', d.intercept(function(str) {
//         res.end(str.toString());
//     }));
// }).listen(8888);

// ===
// return the error message to response
// http.createServer(function(req, res) {
//     var d = domain.create();

//     d.on('error', function(err) {
//         console.error('Error caught by domain:', err);
//         res.end(err.message);
//     });

//     d.run(function() {
//         fs.readFile('non_existent.js', function(err, str) {
//             if(err) throw err;
//             else res.end(str.toString());
//         });
//     });
// }).listen(8888);

// ===
// can not catch exceptions objects created before domain created
// var d = domain.create();
// var e = new events.EventEmitter();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err);
// });

// // d.add(e);

// d.run(function() {
//     e.once('data', function(err) {
//         throw err;
//     });
// });

// // will check active domain
// // https://github.com/joyent/node/blob/v0.10.4/lib/events.js#L85
// e.emit('data', new Error('Handle data error!'));

// ===
// always emit after bound
// var d = domain.create();
// var e = new events.EventEmitter();

// d.on('error', function(err) {
//     console.error('Error caught by domain:', err);
// });

// e.on('data', function(err) {
//     if(err) throw err;
// });

// d.run(function() {
//     e.emit('data', new Error('Handle data error!'));
// });
