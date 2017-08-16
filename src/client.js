import Player from './components/Player'

const pin = '123'
const userId = 'User' + Math.round(Math.random() * 1000) // prompt('username')
let email = ''
let state = null
let progress
let syncedStartTime = false

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
      state.track.push(data.track)
      setState()
      startTime = 0
      if (!syncedStartTime) {
        syncedStartTime = true
      }
      state.timeOffset = Math.round(progress / process.env.INTERVAL) * process.env.INTERVAL
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
    player: new Player(100, ch / 2),
    time: 0,
    timeOffset: 0,
    touch: false,
    track: [],
  }

  canvas.addEventListener('touchstart', (evt) => {
    state.player.jump()
    state.touch = true
  })

  canvas.addEventListener('mousedown', (evt) => {
    if (!state.touch) state.player.jump()
    state.touch = false
  })

  window.requestAnimationFrame(loop)
}

function update (progress) {
  ctx.fillStyle = '#048'
  ctx.fillRect(0, 0, cw, ch)

  let player = state.player
  player.update()
  if (player.y > ch) {
    player.die()
    state.track = []
  }
  
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

  if (state.track.length) {
    ctx.fillStyle = '#red'
    let w = 40
    let d = 280
    let h = 120
    let offset = state.track[state.track.length - 1][1]
    let offsetX = cw - w * 2 - (progress - state.timeOffset) / (process.env.INTERVAL / d)
    ctx.beginPath()
    for (let piece of state.track.slice(-cw / d - 2)) {
      let x = (piece[1] - offset) * d + offsetX
      let y = piece[0] / 100 * (ch - h * 4) + h * 1.5
      if (player.x + player.w > x && player.x < x + w && (player.y < y || player.y + player.h > y + h)) {
        player.die()
        state.track = []
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
  }
}

function stop () {
  window.cancelAnimationFrame(loop)
}

function setState (data) {
  // Update drawings and other stuff...
  state = Object.assign({}, state, data)
}

init()
