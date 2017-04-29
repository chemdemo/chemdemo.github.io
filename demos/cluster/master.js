'use strict';

var cluster = require('cluster')
var len = require('os').cpus().length

if(cluster.isMaster) {
  var c = 0
  var agentWorker

  cluster.on('online', function(worker) {
    console.log('launch worker id:%d succ', worker.id)
    if(++c == len + 1) agentWorker.send({from: 'master', action: 'load:conf'})
  })

  cluster.on('exit', function(worker) {
    console.log('worker id:%d died', worker.id)
    worker._type == 'agent' ? startAgentWorker() : startWebWorker()
  })

  cluster.on('message', function(worker, msg, handle) {
    console.log('master received msg:', JSON.stringify(msg))

    var from = msg.from
    var action = msg.action

    switch(action) {
      case 'load:conf:succ':
        if(from === 'agent' && msg.conf) broadcast(msg)
        break

      case 'load:conf:fail':
        process.exit()
        break

      case 'update:conf':
      case 'retry:conf':
        if(from === 'web') {
          msg.fromId = worker.id
          agentWorker.send(msg)
        }
        break

      case 'retry:conf:succ':
      case 'update:conf:succ':
        if(from === 'agent' && msg.conf) broadcast(msg)
        break

      case 'retry:conf:fail':
      case 'update:conf:fail':
        if(from === 'agent' && msg.fromId != undefined) broadcast(msg, msg.fromId)
        break

      default: break
    }
  })

  agentWorker = startAgentWorker()

  for(var i=0; i<len; i++) startWebWorker()
}

function startWebWorker() {
  cluster.setupMaster({ exec: 'web.js' })

  var worker = cluster.fork()

  worker._type = 'web'

  return worker
}

function startAgentWorker() {
  cluster.setupMaster({ exec: 'agent.js' })

  var worker = cluster.fork()

  worker._type = 'agent'

  return worker
}

function broadcast(msg, workerId) {
  if(workerId) {
    cluster.workers[workerId].send(msg)
    return
  }

  var webWorkers = getAllWebWorkers('web')

  for(var i=0; i<webWorkers.length; i++) webWorkers[i].send(msg)
}

function getAllWebWorkers(type) {
  var arr = []

  for(var id in cluster.workers) {
    var worker = cluster.workers[id]
    if(worker._type === type) arr.push(worker)
  }

  return arr
}
