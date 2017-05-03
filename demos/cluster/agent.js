'use strict';

var conf = require('./conf')

process.on('message', function(msg) {
  console.log('agent worker pid:%d received msg:', process.pid, JSON.stringify(msg))
  switch(msg.action) {
      case 'load:conf':
        conf.load(function(err, conf) {
          if(err) process.send({action: 'load:conf:fail', from: 'agent', conf: conf})
          else process.send({action: 'load:conf:succ', from: 'agent', conf: conf, fromWrokerId: msg.fromWrokerId})
        })
        break

      case 'update:conf':
      case 'retry:conf':
        var action = msg.action
        var key = msg.key
        var msgId = msg.msgId

        conf.update(key, function(err, conf) {
          if(err) process.send({action: action + ':fail', from: 'agent', key: key, error: err, msgId: msgId})
          else process.send({action: action + ':succ', from: 'agent', key: key, conf: conf, msgId: msgId})
        })
        break

      default: break
    }
})
