let state = {
  users: {},
  userWS: {},
  userCount: 0,
  track: []
}

// Creating an express app making it easier to route
var express = require('express')
var app = express()
var path = require('path')
app.use(express.static(path.join(__dirname, '/public')));

// Env vars from .env file loaded into process.env
var dotenv = require('dotenv')
dotenv.config()

// Connect to the redis server which should be up and running
var redis = require('redis')
var rc = redis.createClient(
  process.env.REDIS_PORT || 6379,
  process.env.REDIS_HOST || '127.0.0.1'
)
redisReady = false

rc.on('connect', function () {
  console.log('Redis connected')

  // Delete previous track as new one is created
  rc.del('track', function (err, reply) {
    if (err) console.log(err)

    let track = ['track']
    for (var i = 0; i < 10; i++) {
      track.push(Math.round(Math.random() * 100))
    }

    state.track = track

    rc.rpush(track, function (err, reply) {
      if (err) console.log(err)
      else redisReady = true
    })
  })
})

// Creating the actual server listening to the .env PORT or 8080 (default)
var http = require('http')
var server = http.createServer()
server.on('request', app)
server.listen(process.env.PORT || 8080, function () {
  console.log('Express server listening on http://localhost:' + this.address().port)
})

// Creating the web socket server and handling all the requests from client
var WebSocket = require('ws')
var wss = new WebSocket.Server({ server: server })
wss.on('connection', function (ws, req) {

  // Registering the user to pin in redis and adding user to global state
  var params = getParams(req.url)
  console.log(params.userId + ' connected to pin ' + params.pin)
  state.users[params.userId] = {
    score: 0,
    email: ''
  }
  state.userWS[params.userId] = ws
  state.userCount++
  rc.hgetall(userHash(params.pin, params.userId), function (err, reply) {
    if (err) console.log(err)
    let userExist = !!reply
    if (!userExist) state.users[params.userId].timeCreated = Date.now()
    Object.assign(state.users[params.userId], reply, {
      timeModified: Date.now()
    })
    rc.hmset(userHash(params.pin, params.userId), state.users[params.userId], function (err, reply) {
      ws.send(JSON.stringify({
        type: 'exist',
        exists: userExist,
        email: reply.email || ''
      }))
    })
  })

  // Send back all initial setup
  rc.lrange('track', -11, -1, function (err, reply) {
    let count = state.track.length
    ws.send(JSON.stringify({
      type: 'track',
      track: reply.map((e, i) => e + ':' + (i + count))
    }))
  })

  ws.on('message', function (data) {
    data = JSON.parse(data)
    if (data.hasOwnProperty('type')) {
      switch (data.type) {
        case 'init': console.log(data.message); break
        case 'email':
          setUserProp(rc, params.pin, params.userId, {
            email: data.email
          })
          break
      }
    }
  })

  // Removing user from game, but may his spirit live forever in Redis
  ws.on('close', function () {
    console.log(params.userId + ' quit the game on pin ' + params.pin)
    delete state.users[params.userId]
    delete state.userWS[params.userId]
    state.userCount--
  })
})

/**
 * Parsing the url, such that we keep the same format everywhere.
 * 
 * @param {string} url Url from web socket, making user identifyable.
 */
function getParams (url) {
  let parsed = url.slice(1).split(/\//)
  return {
    pin: parsed[0],
    userId: parsed[1],
  }
}

/**
 * Hash format for saving users as Redis does not support recursive saving.
 * 
 * @param {string} pin The game pin.
 * @param {string} user The user identification.
 */
function userHash (pin, userId) {
  return 'pin:' + pin + ':user:' + userId
}

/**
 * Creating an easy-to-use function for further changes to the user.
 * 
 * @param {*} redisContext 
 * @param {*} pin 
 * @param {*} userId 
 * @param {*} data 
 */
function setUserProp (redisContext, pin, userId, data, callback = () => {}) {
  redisContext.hgetall(userHash(pin, userId), function (err, reply) {
    if (err) console.log(err)
    let userExist = !!reply
    if (!userExist) state.users[userId].timeCreated = Date.now()
    Object.assign(state.users[userId], reply, { timeModified: Date.now() }, data)
    rc.hmset(userHash(pin, userId), state.users[userId], callback)
  })
}

setInterval(() => {
  let piece = [Math.round(Math.random() * 100), state.track.length]
  state.track.push(piece)
  rc.rpush('track', piece[0])

  if (state.userCount) {
    // Some function adding more obstacles and returning them to active users
    var data = JSON.stringify({
      type: 'update',
      track: piece
    })
    for (var userId in state.userWS) {
      state.userWS[userId].send(data)
    }
  }
}, process.env.INTERVAL || 1500)
