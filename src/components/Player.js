export default class Player {
  constructor (x = 0, y = 0) {
    this.x = x
    this.y = y
    this.score = 0
  }

  jump () {
      this.y += 10
  }
}
