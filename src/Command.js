'use strict'
import Base from './Base'

class Command extends Base {
  constructor (name, runtime) {
    super()
    this.name = name
    this.runtime = runtime
  }
}

module.exports = Command
