import Player from './components/Player'

let canvas = document.getElementById('canvas')
let cw = canvas.width
let ch = canvas.height

let ctx = canvas.getContext('2d')

let state = null

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
        time: 0
    }

    canvas.addEventListener('click', (evt) => {
        state.player.jump()
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
