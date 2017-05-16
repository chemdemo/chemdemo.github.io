'use strict';

const conf = require('./conf')

process.on('message', msg => {
  console.log('[agent] worker pid:%d received msg:', process.pid, JSON.stringify(msg))
  switch(msg.action) {
      case 'load:conf':
        conf.load((error, conf) => {
          if(error) process.send({action: 'load:conf:fail', conf, error})
          else process.send({action: 'load:conf:succ', conf, fromId: msg.fromId})
        })
        break

      case 'update:conf':
      case 'retry:conf':
        const { action, key, msgId } = msg

        conf.update(key, function(error, conf) {
          if(error) process.send({action: action + ':fail', key, error, msgId})
          else process.send({action: action + ':succ', key, conf, msgId})
        })
        break

      default: break
    }
})
