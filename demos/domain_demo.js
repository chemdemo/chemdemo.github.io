var should = require('should');

var domain = require('domain');
var http = require('http');
var fs = require('fs');

// see: http://www.slideshare.net/domenicdenicola/domains-20010482

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

// describe('#bind()', function() {
    var d = domain.create();

    d.on('error', function(err) {
        console.log(d.domain, err.message);
    });

    var bind = d.bind(function() {
        process.nextTick(function() {
            fs.readFile('non_existent.js', function(err, str) {
                if(err) throw err;
                console.log(str.toString());
            });
        });
    });

    var intercept = d.intercept(function() {
        process.nextTick(function() {
            fs.readFile('non_existent.js', function(err, str) {
                if(err) throw err;
                console.log(str.toString());
            });
        });
    });

    bind();

    // intercept();
// });
