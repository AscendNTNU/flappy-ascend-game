import Player from './components/Player'

const pin = '123'
let state = null
let progress
let syncedStartTime = false
let animationFrame = null

let host = window.document.location.host.replace(/:.*/, '')
let id = Math.round(Math.random() * 10000)
let ws = new WebSocket(`ws://${host}:${process.env.PORT}/${pin}/viewer${id}`)
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
    case 'pos':
      console.log('A position')
      break
    case 'jump':
      console.log('A jump!')
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
  state.time = currentTime - startTime

  update(state.time)

  window.requestAnimationFrame(loop)
}

function init () {
  state = {
    players: {},
    track: [],
    time: 0,
  }

  window.requestAnimationFrame(loop)
}

function update (progress) {
  ctx.fillStyle = 'gray'
  ctx.fillRect(0, 0, cw, ch)

  ctx.fillStyle = 'lime'
  ctx.beginPath()
  for (let playerId in state.players) {
    let player = state.players[playerId]
    player.update()

    drawPlayer(ctx, player)
  }
  ctx.fill()
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

function setState (data) {
  // Update drawings and other stuff...
  state = Object.assign({}, state, data)
}

init()
