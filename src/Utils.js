'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import _ from 'lodash'
import flatten from 'flat'
import crypto from 'crypto'
import fs from 'fs'

class Utils {
  _cryptFile (fn, readFile, writeFile, cb) {
    const readStream = fs.createReadStream(readFile)
    const writeStream = fs.createWriteStream(writeFile)
    readStream.pipe(fn).pipe(writeStream)

    readStream.on('error', (err) => {
      return cb(err)
    })
    writeStream.on('error', (err) => {
      return cb(err)
    })

    writeStream.on('finish', () => {
      return cb(null)
    })
  }

  encryptFile (readFile, writeFile, password, cb) {
    this._cryptFile(crypto.createCipher('cast5-cbc', password), readFile, writeFile, cb)
  }

  decryptFile (readFile, writeFile, password, cb) {
    this._cryptFile(crypto.createDecipher('cast5-cbc', password), readFile, writeFile, cb)
  }

  render (subject, data, opts = {}) {
    if (_.isFunction(subject)) {
      return subject
    }
    if (opts.failhard === undefined) { opts.failhard = true }
    if (opts.delimiter === undefined) { opts.delimiter = '.' }

    const unflat = _.cloneDeep(data)
    if (_.isArray(subject) || _.isObject(subject)) {
      unflat.self = subject
    }
    const flattened = flatten(unflat, { delimiter: opts.delimiter })

    let newSubject
    if (_.isArray(subject)) {
      newSubject = []
      subject.forEach((val, key) => {
        newSubject[key] = this.render(val, unflat, _.extend({}, opts, { failhard: false }))
      })
    } else if (_.isObject(subject)) {
      newSubject = {}
      _.forOwn(subject, (val, key) => {
        newSubject[key] = this.render(val, unflat, _.extend({}, opts, { failhard: false }))
      })
    } else if (_.isString(subject)) {
      newSubject = subject.replace(/\{\{\{([^\}]+)\}\}\}/g, (match, token) => {
        if (match && flattened[token]) {
          return flattened[token]
        }

        return '{{{' + token + '}}}'
      })
    } else {
      newSubject = _.cloneDeep(subject)
    }

    if (!_.isEqual(subject, newSubject)) {
      // It's possible we're doing recursive resolving here, for instance when
      // render(options, options) is used. So in this case, we keep rendering, until
      // the string is no longer changing
      newSubject = this.render(newSubject, unflat, _.extend({}, opts, { failhard: false }))
    }

    if (opts.failhard === true) {
      const js = JSON.stringify(newSubject)
      if (`${js}`.indexOf('{{{') > -1) {
        debug(flattened)
        throw new Error(`Unable to render vars in '${js}'. `)
      }
    }

    return newSubject
  }
}

module.exports = new Utils()
