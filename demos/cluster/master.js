'use strict';

var cluster = require('cluster')
var len = require('os').cpus().length

if(cluster.isMaster) {
  var c = 0
  var agentWorker

  cluster.on('online', function(worker) {
    console.log('launch worker id:%d succ', worker.id)
    if(!worker._isRestarted) {
      if(++c == len + 1) agentWorker.send({from: 'master', action: 'load:conf'})
    } else {
      // 二次fork的进程
      fetchWorker.send({from: 'master', action: 'conf:fetch', fromWrokerId: worker.id})
    }
  })

  cluster.on('exit', function(worker) {
    console.log('worker id:%d died', worker.id)
    var worker = worker._type == 'agent' ? startAgentWorker() : startWebWorker()
    // 标识这个worker是二次fork的
    if(worker._type === 'web') worker._isRestarted = true
  })

  cluster.on('message', function(worker, msg, handle) {
    console.log('master received msg:', JSON.stringify(msg))

    var from = msg.from
    var action = msg.action

    switch(action) {
      case 'load:conf:succ':
        if(from === 'agent' && msg.conf) broadcast({action: action, conf: msg.conf}, msg.fromWrokerId)
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

  var webWorkers = getWorkers('web')

  for(var i=0; i<webWorkers.length; i++) webWorkers[i].send(msg)
}

function getWorkers(type) {
  var arr = []

  for(var id in cluster.workers) {
    var worker = cluster.workers[id]
    if(worker._type === type) arr.push(worker)
  }

  return arr
}
