import Player from './components/Player'

let canvas = document.getElementById('canvas')
let cw = canvas.width
let ch = canvas.height

let ctx = canvas.getContext('2d')

let startTime = 0
function loop (time) {
    if (!startTime) startTime = time
    let progress = time - startTime

    update(progress)

    window.requestAnimationFrame(loop)
}

function init () {
    window.requestAnimationFrame(loop)
}

function update (progress) {
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, cw, ch)

}

init()
