import Player from './components/Player'

const pin = '123'
let state = null
let progress
let syncedStartTime = false
let animationFrame = null

let protocol = /s:$/.test(location.protocol) ? 'wss' : 'ws'
let host = window.document.location.host.replace(/:.*/, '')
let id = Math.round(Math.random() * 10000)
let dir = (process.env.DIR || '')
if (dir.length) dir = '/' + dir
let port = ':' + (process.env.PUBLIC_PORT || process.env.PORT)
if (process.env.PUBLIC_PORT == 80 || process.env.PUBLIC_PORT == 443) port = ''
let ws = new WebSocket(`${protocol}://${host}${port}${dir}/${pin}/viewer${id}`)
ws.addEventListener('message', (evt) => {
  let data = JSON.parse(evt.data)

  switch (data.type) {
    case 'track':
    setState({
      track: data.track.map(e => e.split(':').map(f => parseInt(f)))
    })
    break

    case 'update':
    state.track.push(data.track)
    setState()
    startTime = 0
    if (!syncedStartTime) {
      syncedStartTime = true
    }
    state.timeOffset = Math.round(progress / process.env.INTERVAL) * process.env.INTERVAL
    break

    case 'viewer':
    for (let playerId in data.players) {
      let player = data.players[playerId]
      if (!player.dead && player.x !== 0) {
        state.players[data.id] = new Player(player.x, player.y, player.v)
      }
    }
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

let startTime = 0
function loop (currentTime) {
  if (!startTime) startTime = currentTime
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
  }

  ctx.font = '32px Helvetica'
  ctx.textAlign = 'center'

  window.requestAnimationFrame(loop)
}

function update (progress) {
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, cw, ch)

  if (state.track.length) {
    ctx.fillStyle = '#777'
    let w = 40
    let d = 280
    let h = 120
    let offset = state.track[state.track.length - 1][1]
    let offsetX = cw - w * 2 - (progress - state.timeOffset) / (process.env.INTERVAL / d)
    // let passedBlock = false
    ctx.beginPath()
    for (let piece of state.track.slice(-cw / d - 2)) {
      let x = (piece[1] - offset) * d + offsetX
      let y = piece[0] / 100 * (ch - h * 4) + h * 1.5

      // if (player.x + player.w > x && player.x < x + w) {
      //   if (!state.passingBlock) {
      //     state.passingBlock = true
      //   }
      //   passedBlock = true
      //   if ((player.y < y || player.y + player.h > y + h)) {
      //     reset()
      //   }
      // }

      ctx.moveTo(x, 0)
      ctx.lineTo(x + w, 0)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x, y)

      ctx.moveTo(x, y + h)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x + w, ch)
      ctx.lineTo(x, ch)
    }
    ctx.fill()
  }
  
  ctx.fillStyle = '#f80'
  ctx.beginPath()
  for (let playerId in state.players) {
    let player = state.players[playerId]
    player.update()

    drawPlayer(ctx, player)

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

  if (player.score === 0) ctx.fillStyle = '#940'
  else if (player.score >= 10) ctx.fillStyle = '#aaa'
  else if (player.score >= 20) ctx.fillStyle = '#ff0'

  ctx.beginPath()
  ctx.moveTo(playerPos.x, playerPos.y)
  ctx.lineTo(playerPos.x + player.w, playerPos.y)
  ctx.lineTo(playerPos.x + player.w, playerPos.y + player.h)
  ctx.lineTo(playerPos.x, playerPos.y + player.h)
  ctx.fill()

  if (player.score !== 0) {
    ctx.fillText(player.score, playerPos.x + player.w / 2, playerPos.y - 15)
  }
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
