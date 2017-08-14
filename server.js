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
wss.on('connection', function (ws, req) {

  // Registering the user to pin in redis
  var params = getParams(req.url)
  console.log(params.userId + ' connected to pin ' + params.pin)

  // Send back all initial setup
  ws.send(JSON.stringify('Sending initial setup'))

  ws.on('message', function (data) {
    data = JSON.parse(data)
    // console.log('Got msg: ' + data.msg)
  })

  // Removing user from game, but may his spirit live forever in redis
  ws.on('close', function () {
    console.log(params.userId + ' quit the game on pin ' + params.pin)
  })
})

function getParams (url) {
  let parsed = url.slice(1).split(/\//)
  return {
    pin: parsed[0],
    userId: parsed[1],
  }
}

setInterval(() => {
  // Some function adding more obstacles.
}, process.env.INTERVAL || 10000)
