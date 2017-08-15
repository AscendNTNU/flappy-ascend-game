import Player from './components/Player'

const pin = '123'
const userId = prompt('username')
let email = ''
let state = null

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
      setState({
        track: data.track.map(e => e.split(':').map(f => parseInt(f)))
      })
      break
      case 'update':
      state.track.push(data.track)
      setState()
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
  let progress = currentTime - startTime

  update(progress)

  window.requestAnimationFrame(loop)
}

function init () {
  state = {
    player: new Player(100, ch / 2),
    time: 0,
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
  
  let playerPos = {
    x: (player.x + .5) | 0,
    y: (player.y + .5) | 0
  }

  ctx.fillStyle = '#f80'
  ctx.beginPath()
  ctx.moveTo(playerPos.x - 10, playerPos.y)
  ctx.lineTo(playerPos.x, playerPos.y - 10)
  ctx.lineTo(playerPos.x + 10, playerPos.y)
  ctx.lineTo(playerPos.x, playerPos.y + 10)
  ctx.fill()

  if (state.track.length) {
    ctx.fillStyle = '#red'
    let w = 10
    let d = 20
    let h = 90
    let offset = state.track[state.track.length - 1][1]
    ctx.beginPath()
    for (let piece of state.track.slice(-cw / d)) {
      let x = (piece[1] - offset) * d + cw
      // if (x < 100) break
      let y = piece[0]
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
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
