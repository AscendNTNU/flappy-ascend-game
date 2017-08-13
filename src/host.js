import Player from './components/Player'

let state = null

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
        players: [],
        time: 0
    }

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

    ctx.fillStyle = 'lime'
    ctx.beginPath()
    for (let player of state.players) {
        player.update()
        
        let playerPos = {
            x: (player.x + .5) | 0,
            y: (player.y + .5) | 0
        }

        ctx.moveTo(playerPos.x - 10, playerPos.y)
        ctx.lineTo(playerPos.x, playerPos.y - 10)
        ctx.lineTo(playerPos.x + 10, playerPos.y)
        ctx.lineTo(playerPos.x, playerPos.y + 10)
    }
    ctx.fill()
}

function stop () {
    window.cancelAnimationFrame(loop)
}

init()
