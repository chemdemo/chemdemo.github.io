'use strict';

var cluster = require('cluster')
var http = require('http')
var url = require('url')
var qs = require('querystring')

var conf = require('./conf')

// 简单的消息队列
var _resQueue = {}

if(cluster.isWorker) {
  process.on('message', function(msg) {
    console.log('web worker pid:%d received msg:', process.pid, JSON.stringify(msg))
    switch(msg.action) {
      case 'load:conf:succ':
        global.CONF = msg.conf
        startApp()
        break

      case 'update:conf:succ':
      case 'retry:conf:succ':
        CONF[msg.key] = msg.conf[msg.key]
        if(msg.msgId in _resQueue) {
          _resQueue[msg.msgId].end(JSON.stringify(CONF))
          delete _resQueue[msg.msgId]
        }
        break

      case 'update:conf:fail':
        var msg = {action: 'retry:conf', from: 'web', key: msg.key, msgId: msg.msgId}
        console.log('worker pid:%d send msg ', process.pid, msg)
        process.send(msg)
        break

      case 'retry:conf:fail':
        console.log('worker pid:%d retry fail', process.pid)
        if(msg.msgId in _resQueue) {
          _resQueue[msg.msgId].end(JSON.stringify(CONF))
          delete _resQueue[msg.msgId]
        }
        break

      default: break
    }
  })
} else {
  conf.load(function(err, conf) {
    global.CONF = conf
    startApp()
  })
}

function startApp() {
  var server = http.createServer(function(req, res) {
    var parsed = url.parse(req.url)
    var query = qs.parse((parsed.search || '').slice(1))

    if(parsed.pathname == '/api/conf/update') {
      var key = query.key

      if(cluster.isWorker) {
        var msgId = genMsgId()
        var msg = {action: 'update:conf', from: 'web', key: key, msgId: msgId}
        console.log('worker pid:%d send msg ', process.pid, msg)
        _resQueue[msgId] = res
        process.send(msg)
        // res.end(JSON.stringify(CONF))
      } else {
        conf.update(key, function(err, up) {
          CONF[up.key] = up.value
          res.end(JSON.stringify(CONF))
        })
      }
    } else {
      res.end(JSON.stringify(CONF))
    }
  })

  server.listen(3002, function() {
    console.log('launch web server success')
  })
}

function genMsgId() {
  return 'res_' + Date.now()
}
