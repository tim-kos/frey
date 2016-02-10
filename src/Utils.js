'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import _ from 'lodash'

class Utils {
  render (str, data, opts = {}) {
    if (opts.failhard === undefined) { opts.failhard = true }

    if (_.isArray(str)) {
      str.forEach((val, key) => {
        str[key] = this.render(val, data, opts)
      })
      return str
    }

    if (_.isObject(str)) {
      // It's possible we're doing recursive resolving here, for instance when
      // render(options, options) is used. So in this case, we keep rendering, until
      // the string is no longer changing
      let change = true
      while (change) {
        change = false
        _.forOwn(str, (val, key) => {
          let tmp = this.render(val, data, {failhard: false})
          if (tmp !== str[key]) {
            str[key] = tmp
            change = true
          }
        })
      }
      _.forOwn(str, (val, key) => {
        if (`${val}`.indexOf('{{{') > -1) {
          debug(data)
          throw new Error(`Unable to render vars in '${val}'. `)
        }
      })
      return str
    }

    if (!_.isString(str)) {
      return str
    }

    // Use custom template delimiters.
    _.templateSettings.interpolate = /{{{([\s\S]+?)}}}/g
    var compiled = _.template(str)
    try {
      str = compiled(data)
    } catch (e) {
      if (opts.failhard === true) {
        debug(data)
        throw new Error(`Unable to render vars in '${str}'. ${e}`)
      }
    }

    return str
  }
}

module.exports = new Utils()
