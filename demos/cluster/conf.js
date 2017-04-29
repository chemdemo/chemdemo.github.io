'use strict';

function load(callback) {
  setTimeout(function() {
    callback(null, {
      x: 'x_' + Date.now(),
      y: 'y_' + Date.now()
    })
  }, 2000)
}

function update(key, callback) {
  setTimeout(function() {
    var up = {}

    up[key] = key + '_' + Date.now()

    callback(null, up)
  }, 1000)
}

exports.load = load
exports.update = update
