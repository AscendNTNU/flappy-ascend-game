export default class Player {
  constructor (x = 0, y = 0) {
    this.x = x
    this.y = y
    this.v = 0
    this.a = .3
    this.score = 0
  }

  jump () {
      this.v = Math.max(this.v - 20, -8)
  }

  update () {
    this.y += this.v
    this.v = Math.min(this.v + this.a, 8)
  }

  render () {
      return 1
  }
}
