import Player from './components/Player'

const pin = '123'
const userId = 'User' + Math.round(Math.random() * 1000) // prompt('username')
let email = ''
let state = null
let progress
let syncedStartTime = false
let animationFrame = null
let uploadWait = 100
let upload = 0

let host = window.document.location.host.replace(/:.*/, '')
let ws = new WebSocket(`ws://${host}:${process.env.PORT}/${pin}/${userId}`)
ws.addEventListener('message', (evt) => {
  let data = JSON.parse(evt.data)

  switch (data.type) {
    case 'exists':
      if (!data.exists)
        email = prompt('Fyll inn din mail eller ditt mobilnummer så vi kan kontakte deg:')
      ws.send(JSON.stringify({ type: 'email', email }))
      break
    case 'track':
      // setState({
      //   track: data.track.map(e => e.split(':').map(f => parseInt(f)))
      // })
      break
    case 'update':
      if (!state.menu) {
        state.track.push(data.track)
        setState()
        startTime = 0
        if (!syncedStartTime) {
          syncedStartTime = true
        }
        state.timeOffset = Math.round(progress / process.env.INTERVAL) * process.env.INTERVAL
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

  if (state.menu) menu(progress)
  else game(progress)

  animationFrame = window.requestAnimationFrame(loop)
}

function init () {
  state = {
    player: new Player(100, ch / 2),
    passingBlock: false,
    time: 0,
    timeOffset: 0,
    touch: false,
    menu: true,
    track: [],
  }

  canvas.addEventListener('touchstart', (evt) => {
    state.player.jump()
    updateServerJump()

    state.touch = true
  })

  canvas.addEventListener('mousedown', (evt) => {
    if (!state.touch) {
      state.player.jump()
      updateServerJump()
    }

    if (state.menu) state.menu = false
    state.touch = false
  })

  animationFrame = window.requestAnimationFrame(loop)
}

function menu (progress) {
  ctx.fillStyle = '#048'
  ctx.fillRect(0, 0, cw, ch)

  ctx.textAlign = 'center'
  ctx.font = '250px Helvetica'
  ctx.fillStyle = '#036'
  ctx.fillText(state.player.getScore(), cw / 2, ch / 2 + 100)

  state.player.y = ch / 2 + Math.cos(progress / 100) * 10
  drawPlayer(ctx, state.player)
}

function game (progress) {
  ctx.fillStyle = '#048'
  ctx.fillRect(0, 0, cw, ch)

  let player = state.player
  player.update()

  if (++upload >= uploadWait) {
    upload = 0
    updateServerPos()
  }

  if (player.y > ch) {
    reset()
  }

  ctx.fillStyle = '#036'
  ctx.fillText(player.getScore(), cw / 2, ch / 2 + 100)

  drawPlayer(ctx, player)

  if (state.track.length) {
    let w = 40
    let d = 280
    let h = 120
    let offset = state.track[state.track.length - 1][1]
    let offsetX = cw - w * 2 - (progress - state.timeOffset) / (process.env.INTERVAL / d)
    let passedBlock = false
    ctx.beginPath()
    for (let piece of state.track.slice(-cw / d - 2)) {
      let x = (piece[1] - offset) * d + offsetX
      let y = piece[0] / 100 * (ch - h * 4) + h * 1.5

      if (player.x + player.w > x && player.x < x + w) {
        if (!state.passingBlock) {
          state.passingBlock = true
        }
        passedBlock = true
        if ((player.y < y || player.y + player.h > y + h)) {
          reset()
        }
      }

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

    if (!passedBlock && state.passingBlock) {
      player.addScore()
      state.passingBlock = false
    }
  }
}

function drawPlayer (ctx, player) {
  let playerPos = {
    x: (player.x + .5) | 0,
    y: (player.y + .5) | 0
  }

  ctx.fillStyle = '#f80'
  ctx.beginPath()
  ctx.moveTo(playerPos.x, playerPos.y)
  ctx.lineTo(playerPos.x + player.w, playerPos.y)
  ctx.lineTo(playerPos.x + player.w, playerPos.y + player.h)
  ctx.lineTo(playerPos.x, playerPos.y + player.h)
  ctx.fill()
}

/**
 * Resetting game and sending score to the server to register.
 */
function reset () {
  let score = state.player.getScore()
  state.player.die()
  setState({
    track: [],
    passingBlock: false,
    menu: true,
  })

  if (score > 0) {
    ws.send(JSON.stringify({ type: 'score', score }))
  }
}

function stop () {
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
}

function updateServerPos () {
  ws.send(JSON.stringify({
    type: 'pos',
    x: state.player.x,
    y: state.player.y,
    v: state.player.v,
  }))
}

function updateServerJump () {
  ws.send(JSON.stringify({
    type: 'jump',
    x: state.player.x,
    y: state.player.y,
    v: state.player.v,
  }))
}

function setState (data) {
  // Update drawings and other stuff...
  state = Object.assign({}, state, data)
}

init()
