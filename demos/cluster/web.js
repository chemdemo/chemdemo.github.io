'use strict';

const cluster = require('cluster')
const http = require('http')
const url = require('url')
const qs = require('querystring')

const conf = require('./conf')

// 简单的消息队列
const _resQueue = {}

if(cluster.isWorker) {
  process.on('message', msg => {
    console.log('[web] worker pid:%d received msg:', process.pid, JSON.stringify(msg))
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
        let _msg = {action: 'retry:conf', key: msg.key, msgId: msg.msgId}
        console.log('[web] worker pid:%d send msg', process.pid, _msg)
        process.send(_msg)
        break

      case 'retry:conf:fail':
        console.log('[web] worker pid:%d retry fail', process.pid)
        if(msg.msgId in _resQueue) {
          _resQueue[msg.msgId].end(JSON.stringify(CONF))
          delete _resQueue[msg.msgId]
        }
        break

      default: break
    }
  })
} else {
  conf.load((err, conf) => {
    global.CONF = conf
    startApp()
  })
}

function startApp() {
  if(process.status === 'running') return

  let server = http.createServer((req, res) => {
    let parsed = url.parse(req.url)
    let query = qs.parse((parsed.search || '').slice(1))

    if(parsed.pathname == '/api/conf/update') {
      let key = query.key

      if(cluster.isWorker) {
        let msgId = genMsgId()
        let msg = {action: 'update:conf', key, msgId}
        console.log('[web] worker pid:%d send msg ', process.pid, msg)
        _resQueue[msgId] = res
        process.send(msg)
        // res.end(JSON.stringify(CONF))
      } else {
        conf.update(key, (err, up) => {
          CONF[up.key] = up.value
          res.end(JSON.stringify(CONF))
        })
      }
    } else {
      let r = { pid: process.pid, conf: CONF }
      res.end(`${JSON.stringify(r)}`)
    }
  })

  server.listen(3002, () => {
    process.status = 'running'
    console.log('[web] launch web server success')
  })
}

function genMsgId() {
  return `res_${process.pid}_` + Date.now()
}
