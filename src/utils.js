'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import Mustache from 'mustache'

const utils = {}

utils.render = (str, data, opts = {}) => {
  if (opts.failhard === undefined) { opts.failhard = true }
  str = Mustache.render(str, data)

  if (opts.failhard === true) {
    if (str.indexOf('{{{') > -1) {
      debug(data)
      const msg = `Unable to render vars in '${str}'`
      throw new Error(msg)
    }
  }

  return str
}

module.exports = utils
