var should = require('should');

var domain = require('domain');
var http = require('http');
var fs = require('fs');

// see: http://www.slideshare.net/domenicdenicola/domains-20010482
// mocha has bug when working with node v0.8

/*describe('active domain not created case', function() {
    it('should has no active domain if `domain.create()` not called', function() {
        should.not.exist(process.domain);
    });

    it('should has active domain after `domain.create()` called', function() {
        var d = domain.create();

        d.on('error', function(err) {
            console.log(err.domain);
            // d.exit();
        });

        // makes d the current domain
        d.enter();

        process.domain.should.be.an.Object;
        process.domain.should.equal(domain.active);

        // makes d inactive
        d.exit();

        should.not.exist(process.domain);
    });
});*/

describe('#bind()', function() {
    it('should throw error', function(done) {
        var d = domain.create();

        d.on('error', function(err) {
            err.message.should.equal('ENOENT, open \'non_existent.js\'');
            console.log(err.domain);
            console.log('message:', err.message);
            done();
        });

        process.nextTick(function() {
            fs.readFile('non_existent.js', 'utf8', d.bind(function(err, str) {
                if(err) throw err;
                console.log('file text:', str.toString());
            }));
        });
    });
});

describe('#intercept()', function() {
    it('should throw err', function(done) {
        var d = domain.create();

        d.on('error', function(err) {
            err.message.should.equal('ENOENT, open \'non_existent2.js\'');
            console.log('message:', err.message);
            done();
        });

        process.nextTick(function() {
            fs.readFile('non_existent2.js', d.intercept(function(str) {
                console.log('file2 text:', str.toString());
            }));
        });
    });
});
