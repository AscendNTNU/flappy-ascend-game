var express = require('express')
var app = express()
var path = require('path')
app.use(express.static(path.join(__dirname, '/public')));

var dotenv = require('dotenv')
dotenv.config()

var redis = require('redis')
var client = redis.createClient(
    process.env.REDIS_PORT || 6379,
    process.env.REDIS_HOST || '127.0.0.1'
)

client.on('connect', function () {
    console.log('Redis connected')
})

var http = require('http')
var server = http.createServer()
server.on('request', app);
server.listen(process.env.PORT || 8080, function () {
  console.log('Express server listening on http://localhost:' + this.address().port)
})

var WebSocket = require('ws')
var wss = new WebSocket.Server({ server: server })
wss.on('connection', function (ws) {
  var id = setInterval(function () {
    ws.send(JSON.stringify(process.memoryUsage()), function () { /* ignore errors */ })
  }, 1000)

  console.log('Started client interval')

  ws.on('close', function () {
    console.log('Stopping client interval')
    clearInterval(id)
  })
})

setInterval(() => {
    // Some function adding more obstacles.
}, process.env.INTERVAL || 10000)
