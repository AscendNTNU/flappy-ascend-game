import Player from './components/Player'

const pin = '123'
let userId = ''
let email = ''

function register () {
  try {
    if (localStorage.getItem('username')) {
      userId = localStorage.getItem('username')
    } else {
      userId = prompt('Kallenavn:') || 'Anonym' + Math.round(Math.random() * 1000)
      userId = userId.replace(/[^a-zøæå0-9]/ig, '') || 'Anonym' + Math.round(Math.random() * 1000)
      localStorage.setItem('username', userId)
    }
    if (localStorage.getItem('email')) {
      email = localStorage.getItem('email')
    } else {
      email = prompt('Email eller mobil: (Noe vi kan kontakte deg via)') || ''
      localStorage.setItem('email', email)
    }
  } catch (ex) {
    userId = prompt('Kallenavn:') || 'Anonym' + Math.round(Math.random() * 1000)
    userId = userId.replace(/[^a-zøæå0-9]/ig, '') || 'Anonym' + Math.round(Math.random() * 1000)
    email = prompt('Email eller mobil: (Noe vi kan kontakte deg via)') || ''
  }
}

register()
document.querySelector('.change-name').innerHTML = `Kallenavn: ${userId} (Trykk for å endre)`
document.querySelector('.change-name').addEventListener('click', () => {
  userId = prompt('Kallenavn:') || userId
  userId = userId.replace(/[^a-zøæå0-9]/ig, '') || userId
  localStorage.setItem('username', userId)

  email = prompt('Email eller mobil: (Noe vi kan kontakte deg via)') || email
  localStorage.setItem('email', email)

  document.querySelector('.change-name').innerHTML = `Kallenavn: ${userId} (Trykk for å endre)`
})

let state = null
let progress
let syncedStartTime = false
let animationFrame = null
let uploadWait = 100
let upload = 0
let playerImage = new Image()
playerImage.src = '../drone-mini.png'
let groundRobotImage = new Image()
groundRobotImage.src = '../ground-robot-mini.png'

let protocol = /s:$/.test(location.protocol) ? 'wss' : 'ws'
let host = window.document.location.host.replace(/:.*/, '')
let dir = (process.env.DIR || '')
if (dir.length) dir = '/' + dir
let port = ':' + (process.env.PUBLIC_PORT || process.env.PORT)
if (process.env.PUBLIC_PORT === 80 || process.env.PUBLIC_PORT === 443) port = ''
let ws = new WebSocket(`${protocol}://${host}${port}${dir}/${pin}/${userId}`)

let onMessage = (evt) => {
  let data = JSON.parse(evt.data)
  reconnect = false

  switch (data.type) {
    case 'exists':
    if (!data.exists)
      email = prompt('Fyll inn din mail eller ditt mobilnummer så vi kan kontakte deg:')
    ws.send(JSON.stringify({ type: 'email', email }))
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
}
ws.addEventListener('message', onMessage)

let reconnect = false
let interval = null
let onClose = (evt) => {
  reconnect = true
  interval = setInterval(() => {
    if (reconnect) {
      ws.removeEventListener('message', onMessage)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('open', onOpen)
      ws = new WebSocket(`${protocol}://${host}${port}${dir}/${pin}/${userId}`)
      ws.addEventListener('message', onMessage)
      ws.addEventListener('close', onClose)
      ws.addEventListener('open', onOpen)
    } else {
      clearInterval(interval)
    }
  }, 1000)
}
ws.addEventListener('close', onClose)

let onOpen = (evt) => {
  reconnect = false
}
ws.addEventListener('open', onOpen)

let canvas = document.getElementById('canvas')
let cw = canvas.width
let ch = canvas.height

let ctx = canvas.getContext('2d')

let startTime = 0
function loop (currentTime) {
  if (!startTime) startTime = currentTime
  progress = currentTime - startTime

  if (reconnect) {
    connecting(progress)
  } else {
    if (state.menu) menu(progress)
    else game(progress)
  }

  animationFrame = window.requestAnimationFrame(loop)
}

function init () {
  state = {
    player: new Player(100, ch / 2),
    passingBlock: false,
    time: 0,
    timeOffset: process.env.INTERVAL,
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
  ctx.font = '40px Helvetica'
  ctx.fillStyle = '#999'
  ctx.fillText('Trykk for å starte', cw / 2, 100)

  ctx.font = '250px Helvetica'
  ctx.fillStyle = '#036'
  ctx.fillText(state.player.getScore(), cw / 2, ch / 2 + 100)

  state.player.y = ch / 2 + Math.cos(progress / 100) * 10
  drawPlayer(ctx, state.player)
}

function connecting (progress) {
  ctx.fillStyle = '#800'
  ctx.fillRect(0, 0, cw, ch)

  ctx.textAlign = 'center'
  ctx.font = '30px Helvetica'
  ctx.fillStyle = '#fff'
  ctx.fillText('Beklager, men mistet kobling til serveren.', cw / 2, 100)
  ctx.fillText('Prøver å koble til...', cw / 2, 160)

  ctx.font = '250px Helvetica'
  ctx.fillStyle = '#600'
  ctx.fillText(state.player.getScore(), cw / 2, ch / 2 + 100)

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
    ctx.fillStyle = '#999'
    ctx.fill()

    if (!passedBlock && state.passingBlock) {
      player.addScore()
      updateServerScore()
      state.passingBlock = false
    }
  }
}

function drawPlayer (ctx, player) {
  let playerPos = {
    x: (player.x + .5) | 0,
    y: (player.y + .5) | 0
  }

  // ctx.beginPath()
  // ctx.moveTo(playerPos.x, playerPos.y)
  // ctx.lineTo(playerPos.x + player.w, playerPos.y)
  // ctx.lineTo(playerPos.x + player.w, playerPos.y + player.h)
  // ctx.lineTo(playerPos.x, playerPos.y + player.h)
  // ctx.fill()

  ctx.drawImage(playerImage,
    playerPos.x - playerImage.width / 2 + player.w / 2,
    playerPos.y - playerImage.height / 2 + player.h / 2
  )
}

/**
 * Resetting game and sending score to the server to register.
 */
function reset () {
  let score = state.player.getScore()
  state.player.die()
  updateServerDie()
  setState({
    track: [],
    passingBlock: false,
    menu: true,
  })

  if (score > 0) {
    ws.send(JSON.stringify({
      type: 'score',
      id: userId,
      score,
    }))
  }
}

function stop () {
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
}

function updateServerPos () {
  ws.send(JSON.stringify({
    type: 'pos',
    id: userId,
    player: {
      x: state.player.x,
      y: state.player.y,
      v: state.player.v,
    },
  }))
}

function updateServerJump () {
  ws.send(JSON.stringify({
    type: 'jump',
    id: userId,
    player: {
      x: state.player.x,
      y: state.player.y,
      v: state.player.v,
    },
  }))
}

function updateServerScore () {
  ws.send(JSON.stringify({
    type: 'score',
    id: userId,
    score: state.player.getScore(),
  }))
}

function updateServerDie () {
  ws.send(JSON.stringify({
    type: 'die',
    id: userId,
  }))
}

function setState (data) {
  // Update drawings and other stuff...
  state = Object.assign({}, state, data)
}

init()
