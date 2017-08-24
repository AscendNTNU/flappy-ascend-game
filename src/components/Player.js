export default class Player {
  constructor (x = 0, y = 0, v = 0, score = 0) {
    this.initX = x
    this.initY = y
    this.x = x
    this.y = y
    this.v = v
    this.a = .3
    this.initW = 40
    this.initH = 20
    this.w = this.initW + (this.x - this.initX) / 10 * .8
    this.h = this.initH + (this.x - this.initX) / 20 * .8
    this.score = score
  }

  jump () {
      this.v = Math.max(this.v - 20, -8)
  }

  addScore (n = 1) {
    this.score += 1
  }

  getScore () {
    return this.score
  }

  update () {
    this.x = Math.min(this.x + .1, 400)
    this.y += this.v
    this.v = Math.min(this.v + this.a, 8)
    this.w = this.initW + (this.x - this.initX) / 10 * .8
    this.h = this.initH + (this.x - this.initX) / 20 * .8
  }

  die () {
    this.x = this.initX
    this.y = this.initY
    this.v = 0
    this.score = 0
    this.w = this.initW + (this.x - this.initX) / 10 * .8
    this.h = this.initH + (this.x - this.initX) / 20 * .8
  }

  render () {
      return 1
  }
}
