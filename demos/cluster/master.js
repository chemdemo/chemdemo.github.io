'use strict';

const cluster = require('cluster')
const cp = require('child_process')
const path = require('path')
const len = require('os').cpus().length

let agentWorker

if(cluster.isMaster) {
  let c = 0

  cluster.on('online', worker => {
    console.log('[master] launch webWorker id:%d succ', worker.id)
    if(!worker._isRestarted) {
      if(++c == len) agentWorker.send({action: 'load:conf'})
    } else {
      // 二次fork的进程
      agentWorker.send({action: 'load:conf', fromId: worker.id})
    }
  })

  cluster.on('exit', worker => {
    console.log('[master] webWorker id:%d died', worker.id)
    let nWorker = startWebWorker()
    // 标识这个worker是二次fork的
    nWorker._isRestarted = true
  })

  cluster.on('message', webWorkerMsgHandler)

  agentWorker = startAgentWorker()

  for(let i=0; i<len; i++) startWebWorker()
}

function startWebWorker() {
  cluster.setupMaster({ exec: path.resolve('./web.js') })

  let worker = cluster.fork()

  return worker
}

function startAgentWorker() {
  let worker = cp.fork(path.resolve('./agent.js'))

  worker.on('message', agentMessageHandler)
  worker.on('exit', () => {
    console.log('[master] agentWorker died')
    agentWorker = startAgentWorker()
  })

  console.log(`[master] launch agentWorker succ`)

  return worker
}

function webWorkerMsgHandler(worker, msg) {
  console.log(`[master] received from web, msg ${JSON.stringify(msg)}`)

  let { action } = msg

  switch(action) {
    case 'update:conf':
    case 'retry:conf':
      msg.fromId = worker.id
      agentWorker.send(msg)
      break

    default: break
  }
}

function agentMessageHandler(msg) {
  console.log(`[master] received from agent, msg ${JSON.stringify(msg)}`)

  let { action } = msg

  switch(action) {
    case 'load:conf:succ':
      if(msg.conf) broadcast({action: action, conf: msg.conf}, msg.fromId)
      break

    case 'load:conf:fail':
      // 拉取不到配置信息，直接杀死进程，让进程管理器去重启
      console.error('[master]', msg.error)
      process.exit()
      break

    case 'retry:conf:succ':
    case 'update:conf:succ':
      if(msg.conf) broadcast(msg)
      break

    case 'retry:conf:fail':
    case 'update:conf:fail':
      if(msg.fromId != undefined) broadcast(msg, msg.fromId)
      break

    default: break
  }
}

function broadcast(msg, workerId) {
  if(workerId) {
    cluster.workers[workerId].send(msg)
    return
  }

  let webWorkers = getWorkers()

  for(let i=0; i<webWorkers.length; i++) webWorkers[i].send(msg)
}

function getWorkers() {
  let arr = []

  for(let id in cluster.workers) {
    let worker = cluster.workers[id]
    arr.push(worker)
  }

  return arr
}
