var state = {
  viewers: [],
  viewerWS: [],
  viewerCount: 0,
  users: {},
  userWS: {},
  userCount: 0,
  highScore: {},
  track: []
}

// Env vars from .env file loaded into process.env
var dotenv = require('dotenv')
dotenv.config()

var fs = require('fs')
if (process.env.KEY) {
  var privateKey = fs.readFileSync(process.env.KEY, 'utf8')
  var certificate = fs.readFileSync(process.env.CERT, 'utf8')

  var credentials = {key: privateKey, cert: certificate}
}

// Creating an express app making it easier to route
var express = require('express')
var app = express()
var path = require('path')
app.use('/' + (process.env.DIR || ''), express.static(path.join(__dirname, '/public')));

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

    var track = ['track']
    for (var i = 0; i < 10; i++) {
      track.push(Math.round(Math.random() * 100))
    }

    state.track = track

    rc.rpush(track, function (err, reply) {
      if (err) console.log(err)
      else redisReady = true
    })
  })

  rc.hgetall('highscore', function (err, reply) {
    if (err) console.log(err)
    state.highScore = reply
    console.log(reply)
  })
})

// Creating the actual server listening to the .env PORT or 8080 (default)
var http = require('http')
var server = null
if (process.env.KEY) server = http.createServer(credentials)
else server = http.createServer()
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

  if (/^viewer\d+/.test(params.userId)) {
    console.log('Someone is watching on pin ' + params.pin)
    rc.hgetall('highscore', function (err, reply) {
      if (err) console.log(err)
      state.highScore = reply
      ws.send(JSON.stringify({
        type: 'viewer',
        count: ++state.viewerCount,
        players: state.users,
        highScore: state.highScore
      }))
    })
    state.viewerWS[params.userId] = ws

    ws.isAlive = true
    ws.on('pong', function () {
      this.isAlive = true
    })

    ws.on('close', function () {
      console.log(params.userId + ' quit viewing on pin ' + params.pin)
      delete state.viewerWS[params.userId]
      state.viewerCount--
    })
  } else {
    console.log(params.userId + ' connected to pin ' + params.pin)
    state.users[params.userId] = {
      email: params.email,
      jumped: false,
      score: 0,
      x: 0,
      y: 0,
      v: 0
    }
    state.userWS[params.userId] = ws
    state.userCount++

    rc.hget('highscore', userHash(params.pin, params.userId), function (err, reply) {
      ws.send(JSON.stringify({
        type: 'highscore',
        highScore: reply || 0
      }))
    })

    var data = JSON.stringify({
      type: 'player',
      id: params.userId,
      player: state.users[params.userId],
    })
    for (var viewerId in state.viewerWS) {
      state.viewerWS[viewerId].send(data)
    }

    rc.hgetall(userHash(params.pin, params.userId), function (err, reply) {
      if (err) console.log(err)
      var userExist = !!reply
      if (!userExist) {
        state.users[params.userId].timeCreated = Date.now()
        Object.assign(state.users[params.userId], reply, {
          timeModified: Date.now()
        })
        rc.hmset(userHash(params.pin, params.userId), state.users[params.userId])
      } else {
        ws.send(JSON.stringify({
          type: 'exists',
          exists: true,
          verified: reply.email === params.email
        }))
      }
    })

    ws.on('message', function (rawData) {
      try {
        data = JSON.parse(rawData)
        if (data.hasOwnProperty('type')) {
          switch (data.type) {
            case 'init': console.log(data.message); break
            case 'email':
              setUserProp(rc, params.pin, params.userId, {
                email: data.email
              })
              break
            case 'jump':
              if (data.player && data.player.x && data.player.y && data.player.v) {
                if (state.users[params.userId]) {
                  state.users[params.userId].dead = false
                  state.users[params.userId].x = data.player.x
                  state.users[params.userId].y = data.player.y
                  state.users[params.userId].v = data.player.v
                  state.users[params.userId].jumped = true
                }
                for (var viewerId in state.viewerWS) {
                  state.viewerWS[viewerId].send(rawData)
                }
              }
              break
            case 'pos':
              if (data.player && data.player.x && data.player.y && data.player.v) {
                if (state.users[params.userId]) {
                  state.users[params.userId].dead = false
                  state.users[params.userId].x = data.player.x
                  state.users[params.userId].y = data.player.y
                  state.users[params.userId].v = data.player.v
                }
                for (var viewerId in state.viewerWS) {
                  state.viewerWS[viewerId].send(rawData)
                }
              }
              break
            case 'score':
              var hasJumped = state.users[params.userId].jumped && !state.users[params.userId].dead
              state.users[params.userId].jumped = false
              if (!data.score || !data.hash) break
              if (state.users[params.userId]) {
                state.users[params.userId].dead = false
                state.users[params.userId].score = data.score
              }
              for (var viewerId in state.viewerWS) {
                state.viewerWS[viewerId].send(rawData)
              }
              rc.hget('highscore', userHash(params.pin, params.userId), function (err, reply) {
                var validHash = data.hash === gh(data.score + decodeURI(params.userId))
                var validScore = data.score === parseInt(reply) + 1 || data.score === parseInt(reply) + 2 || reply === null
                if (validScore && validHash && hasJumped) {
                  console.log(params.userId + ' set new highscore to ' + data.score + '!')
                  rc.hmset('highscore', userHash(params.pin, params.userId), data.score)
                  state.highScore[userHash(params.pin, params.userId)] = data.score
                  var newData = JSON.stringify({
                    type: 'highscore',
                    id: params.userId,
                    score: data.score
                  })
                  for (var viewerId in state.viewerWS) {
                    state.viewerWS[viewerId].send(newData)
                  }
                }
              })
              break
            case 'die':
              state.users[params.userId].dead = true
              for (var viewerId in state.viewerWS) {
                state.viewerWS[viewerId].send(rawData)
              }
              break
          }
        }
      } catch (ex) {}
    })

    // Removing user from game, but may his spirit live forever in Redis
    ws.on('close', function () {
      console.log(params.userId + ' quit the game on pin ' + params.pin)
      delete state.users[params.userId]
      delete state.userWS[params.userId]
      state.userCount--
    })
  }

  ws.isAlive = true
  ws.on('pong', function () {
    this.isAlive = true
  })

  // Send back 10 last steps on track on initial setup
  rc.lrange('track', -11, -1, function (err, reply) {
    var count = state.track.length - 11
    ws.send(JSON.stringify({
      type: 'track',
      track: reply.map((e, i) => e + ':' + (i + count))
    }))
  })
})

/**
 * Parsing the url, such that we keep the same format everywhere.
 * 
 * @param {string} url Url from web socket, making user identifyable.
 */
function getParams (url) {
  var parsed = url.slice(1).split(/\//)
  return {
    pin: parsed[0],
    userId: parsed[1],
    email: parsed[2] || '',
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
 * A function to hash values. Just making it harder to accept values from user.
 * 
 * @param {string} val To hash
 */
function gh (val) {
  var hash = 0
  if (val.length == 0) return hash
  for (var i = 0; i < val.length; i++) {
    var char = val.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

/**
 * Creating an easy-to-use function for further changes to the user.
 * 
 * @param {*} redisContext Redis connection object.
 * @param {*} pin The game pin.
 * @param {*} userId The user identification.
 * @param {*} data Some data to add/update object with.
 */
function setUserProp (redisContext, pin, userId, data, callback) {
  redisContext.hgetall(userHash(pin, userId), function (err, reply) {
    if (err) console.log(err)
    var userExist = !!reply
    if (!userExist) state.users[userId].timeCreated = Date.now()
    Object.assign(state.users[userId], reply, { timeModified: Date.now() }, data)
    rc.hmset(userHash(pin, userId), state.users[userId], callback || function () {})
  })
}

setInterval(() => {
  var piece = [Math.round(Math.random() * 100), state.track.length]
  state.track.push(piece)
  rc.rpush('track', piece[0])

  if (state.userCount || state.viewerCount) {
    // Some function adding more obstacles and returning them to active users
    var data = JSON.stringify({
      type: 'update',
      track: piece
    })
  }

  if (state.userCount) {
    for (var userId in state.userWS) {
      state.userWS[userId].send(data)
    }
  }

  if (state.viewerCount) {
    for (var viewerId in state.viewerWS) {
      state.viewerWS[viewerId].send(data)
    }
  }
}, process.env.INTERVAL || 1500)

// New loop for detecting broken connections
setInterval(function () {
  wss.clients.forEach(function (ws) {
    if (!ws.isAlive) return ws.terminate()
    
    ws.isAlive = false
    ws.ping('', false, true)
  })
}, 5000)
