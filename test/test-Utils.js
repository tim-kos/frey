import utils from '../src/Utils'
import { expect } from 'chai'
// import depurar from 'depurar'; const debug = depurar('frey')
// debug utils

describe('utils', () => {
  describe('render', () => {
    it('should handle strings', done => {
      const result = utils.render('Hi my name is {{{name}}}.', {name: 'kevin'})
      expect(result).to.equal('Hi my name is kevin.')
      done()
    })
    it('should crash hard by default', done => {
      expect(utils.render.bind(utils, 'Hi {{{crash}}}', {name: 'kevin'}))
        .to.throw('Unable to render vars in \'Hi {{{crash}}}\'. ReferenceError: crash is not defined')
      done()
    })
    it('should allow to prevent crashes', done => {
      const result = utils.render('Hi {{{crash}}}', {name: 'kevin'}, {failhard: false})
      expect(result).to.equal('Hi {{{crash}}}')
      done()
    })
    it('should handle arrays', done => {
      const result = utils.render(['{{{name}}}', '{{{age}}}'], {name: 'kevin', age: 32})
      expect(result).to.deep.equal(['kevin', '32'])
      done()
    })
    it('should handle objects recursively', done => {
      const options = {
        filename: 'terraform-{{{version}}}',
        arch: 'amd64',
        version: '0.1.1-{{{arch}}}'
      }
      const result = utils.render(options, options)
      expect(result).to.deep.equal({
        version: '0.1.1-amd64',
        arch: 'amd64',
        filename: 'terraform-0.1.1-amd64'
      })
      done()
    })
  })
})
