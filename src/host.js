import Player from './components/Player'

const pin = '123'
let state = null
let progress
let deltaTime = 1
let syncedStartTime = false
let animationFrame = null
let globalPos = 0
let playerImage = new Image()
playerImage.src = 'drone-mini.png'
let groundRobotImage = new Image()
groundRobotImage.src = 'ground-robot-mini.png'
let ascendImage = new Image()
ascendImage.src = 'logo-ascend-art-under.png'

let protocol = /s:$/.test(location.protocol) ? 'wss' : 'ws'
let host = window.document.location.host.replace(/:.*/, '')
let id = Math.round(Math.random() * 10000)
let dir = (process.env.DIR || '')
if (dir.length) dir = '/' + dir
let port = ':' + (process.env.PUBLIC_PORT || process.env.PORT)
if (process.env.PUBLIC_PORT === 80 || process.env.PUBLIC_PORT === 443) port = ''
let ws = new WebSocket(`${protocol}://${host}${port}${dir}/${pin}/viewer${id}`)
ws.addEventListener('message', (evt) => {
  let data = JSON.parse(evt.data)

  switch (data.type) {
    case 'track':
    // setState({
    //   track: data.track.map(e => e.split(':').map(f => parseInt(f)))
    // })
    globalPos = state.track[0][1]
    break

    case 'update':
    data.track[1] = 0
    state.track.push(data.track)
    setState()
    startTime = 0
    if (!syncedStartTime) {
      syncedStartTime = true
    }
    // state.timeOffset = Math.round(progress / process.env.INTERVAL) * process.env.INTERVAL
    break

    case 'viewer':
    for (let playerId in data.players) {
      let player = data.players[playerId]
      if (!player.dead && player.x !== 0) {
        state.players[data.id] = new Player(player.x, player.y, player.v)
      }
    }
    state.highScore = data.highScore
    updateList()
    break

    case 'player':
    state.players[data.id] = new Player(data.player.x, data.player.y, data.player.v)
    break

    case 'pos':
    if (state.players.hasOwnProperty(data.id)) {
      state.players[data.id].x = data.player.x
      state.players[data.id].y = data.player.y
      state.players[data.id].v = data.player.v
    } else {
      state.players[data.id] = new Player(data.player.x, data.player.y, data.player.v)
    }
    break

    case 'score':
    if (state.players.hasOwnProperty(data.id)) {
      state.players[data.id].score = data.score
    }
    break

    case 'highscore':
    if (state.players.hasOwnProperty(data.id)) {
      state.players[data.id].highscore = data.score
    }
    state.highScore[userHash(data.id)] = data.score
    updateList()
    break

    case 'die':
    delete state.players[data.id]
    break

    case 'jump':
    if (state.players.hasOwnProperty(data.id)) {
      state.players[data.id].x = data.player.x
      state.players[data.id].y = data.player.y
      state.players[data.id].v = data.player.v
    } else {
      state.players[data.id] = new Player(data.player.x, data.player.y, data.player.v)
    }
    break
  }
})

let canvas = document.getElementById('canvas')
let cw = canvas.width
let ch = canvas.height

let ctx = canvas.getContext('2d')

let highScoreList = document.querySelector('.list')

let startTime = 0
function loop (currentTime) {
  if (!startTime) startTime = currentTime
  deltaTime = (currentTime - startTime) - progress
  progress = currentTime - startTime

  update(progress)

  window.requestAnimationFrame(loop)
}

function init () {
  state = {
    players: {},
    time: 0,
    timeOffset: process.env.INTERVAL,
    track: [],
    highScore: {},
  }

  ctx.font = '32px Helvetica'
  ctx.textAlign = 'center'

  window.requestAnimationFrame(loop)
}

function update (progress) {
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, cw, ch)
  ctx.drawImage(ascendImage, cw / 2 - 55, ch / 2 - 80)

  if (state.track.length) {
    ctx.fillStyle = '#777'
    let w = 40
    let h = 150
    let del = false
    ctx.beginPath()
    for (let piece of state.track) {
      piece[1] -= 60 / deltaTime
      let x = piece[1] + cw
      if (x < -w - 20) del = true
      let y = piece[0] / 100 * (ch - h * 3) + h * 1

      ctx.drawImage(
        groundRobotImage, x - groundRobotImage.width / 2 + w / 2,
        ch - groundRobotImage.height
      )

      ctx.moveTo(x, 0)
      ctx.lineTo(x + w, 0)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x, y)

      ctx.moveTo(x, y + h)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x + w, ch - 33)
      ctx.lineTo(x, ch - 33)
    }
    ctx.fill()
    if (del) state.track.shift()
  }
  
  ctx.beginPath()
  for (let playerId in state.players) {
    let player = state.players[playerId]
    player.update()
    
    if (player.x > 0) {
      ctx.fillStyle = '#f80'
      drawPlayer(ctx, player)
    }

    if (player.y > ch) {
      reset(player)
      delete state.players[playerId]
    }
  }
  ctx.fill()
}

function drawPlayer (ctx, player) {
  let playerPos = {
    x: (player.x + .5) | 0,
    y: (player.y + .5) | 0
  }

  if (player.score >= 10 && player.score < 20) ctx.fillStyle = '#aaa'
  else if (player.score >= 20) ctx.fillStyle = '#ff0'

  // ctx.beginPath()
  // ctx.moveTo(playerPos.x, playerPos.y)
  // ctx.lineTo(playerPos.x + player.w, playerPos.y)
  // ctx.lineTo(playerPos.x + player.w, playerPos.y + player.h)
  // ctx.lineTo(playerPos.x, playerPos.y + player.h)
  // ctx.fill()

  if (player.score === 0) ctx.globalAlpha = .3
  let w = 360 * player.w / playerImage.width
  let h = 360 * 56 / 100 * player.h / playerImage.height
  ctx.drawImage(playerImage,
    playerPos.x - w / 2 + player.w / 2,
    playerPos.y - h / 1.8 + player.h / 2,
    w, h
  )
  if (player.score === 0) ctx.globalAlpha = 1

  if (player.score !== 0) {
    ctx.fillText(player.score, playerPos.x + player.w / 2, playerPos.y - 15)
  }
}

function updateList () {
  let list = []
  let str = ''

  for (let userId in state.highScore) {
    let pieces = userId.split(':')
    if (pieces[1] === pin) {
      let userName = pieces[3]
      list.push({
        userName,
        score: parseInt(state.highScore[userId]) || 0
      })
    }
  }

  list.sort((a, b) => b.score - a.score)

  let i = 0
  let prevScore = 0
  for (let user of list) {
    if (user.score !== prevScore) i++
    str += `<div data-index="${i}">${i}. ${decodeURI(user.userName)}: ${user.score}</div>`
    prevScore = user.score
  }

  highScoreList.innerHTML = str
}

function userHash (userId) {
  return 'pin:' + pin + ':user:' + userId
}

function reset (player) {
  let score = player.getScore()
  player.die()
}

function setState (data) {
  // Update drawings and other stuff...
  state = Object.assign({}, state, data)
}

init()
