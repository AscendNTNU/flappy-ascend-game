import Player from './components/Player'

let state = {
    players: [],
    time: 0
}

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
    let players = []
    players.push(new Player(50, 50))
    players.push(new Player(50, 0))
    players.push(new Player(20, 30))

    state.players = players

    canvas.addEventListener('click', (evt) => {
        state.players[0].jump()
    })

    window.requestAnimationFrame(loop)
}

function update (progress) {
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, cw, ch)

    ctx.fillStyle = 'red'
    for (let player of state.players) {
        player.update()
        ctx.beginPath()
        ctx.moveTo(player.x - 10, player.y)
        ctx.lineTo(player.x, player.y - 10)
        ctx.lineTo(player.x + 10, player.y)
        ctx.lineTo(player.x, player.y + 10)
        ctx.fill()
    }
}

function stop () {
    window.cancelAnimationFrame(loop)
}

init()
