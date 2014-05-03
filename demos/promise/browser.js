// for browser
function getImg(url) {
    var p = new Promise();
    var img = new Image();

    img.onload = function() {
        p.resolve(this);
    }

    img.onerror = function(err) {
        p.reject(err);
    }

    img.src = url;

    return p;
};

function upload(params) {
    var p = new Promise();
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    fd.append('data', params.data);

    xhr.onload = function(res) {
        p.resolve(res);
    }

    xhr.onabort = function() {
        p.reject(new Error('abort'));
    };

    xhr.onerror = function(err) {
        p.reject(err);
    };

    xhr.open('POST', params.url);
    xhr.send(fd);

    return p;
};

function getData(json) {
    return Promise(function(resolve) {
        $.getJSON(json, function(data) {
            resolve(data);
        });
    });
};

function sleep(ms) {
    return function(v) {
        var p = Promise();

        setTimeout(function() {
            p.resolve(v);
        }, ms);

        return p;
    };
};
