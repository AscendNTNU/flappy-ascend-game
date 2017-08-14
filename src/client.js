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
      console.log(data.track);
      state.track = data.track.map((e, i) => e.split(':'))
      break
    case 'update':
      console.log(data.track);
      state.track.push(data.track)
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
}

function stop () {
  window.cancelAnimationFrame(loop)
}

init()
