import Base from '../src/Base'
import { expect } from 'chai'
// import depurar from 'depurar'; const debug = depurar('frey')

describe('Base', () => {
  return describe('run', () => {
    return it('should run a bootchain', done => {
      const output = []
      const base = new Base()
      base._a = function (cargo, cb) {
        output.push(`function _a called with ${cargo}`)
        cargo = 'output:a'
        return cb(null, cargo)
      }

      base._b = function (cargo, cb) {
        output.push(`function _b called with ${cargo}`)
        cargo = 'output:b'
        return cb(null, cargo)
      }

      base.main = function (cargo, cb) {
        output.push(`function main called with ${cargo}`)
        cargo = 'output:main'
        return cb(null, cargo)
      }

      base.boot = [
        '_a',
        '_b'
      ]

      return base.run((err, result) => {
        expect(err).to.equal(null)
        expect(output).to.deep.equal([
          'function _a called with [object Object]',
          'function _b called with output:a',
          'function main called with output:b'
        ])
        expect(base.bootCargo).to.deep.equal({
          _a: 'output:a',
          _b: 'output:b'
        })

        return done()
      })
    })
  })
})
