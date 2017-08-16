export default class Player {
  constructor (x = 0, y = 0, v = 0) {
    this.initX = x
    this.initY = y
    this.x = x
    this.y = y
    this.v = v
    this.a = .3
    this.w = 20
    this.h = 20
    this.score = 0
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
    this.y += this.v
    this.v = Math.min(this.v + this.a, 8)
  }

  die () {
    this.x = this.initX
    this.y = this.initY
    this.v = 0
    this.score = 0
  }

  render () {
      return 1
  }
}
