'use strict'
import Base from './Base'
import Shell from './Shell'

class Command extends Base {
  constructor (name, runtime) {
    super()
    this.name = name
    this.runtime = runtime
    this.shell = new Shell(runtime)
  }
}

module.exports = Command
