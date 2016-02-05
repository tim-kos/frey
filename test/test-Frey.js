var Frey = require('../src/Frey')
var expect = require('chai').expect

describe('Frey', function () {
  this.timeout(10000)
  describe('_normalize', function () {
    it('should transform the cwd variable', function (done) {
      var frey = new Frey()

      var options =
        {recipeDir  : '{{{cwd}}}/frey/production',
        toolsDir   : '{{{home}}}/.frey/tools',
        sshkeysDir : '{{{home}}}/.ssh',
        rootDir    : '/opt/frey'
        }

      return frey._normalize(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.recipeDir).to.match(/\/frey\/production$/)
        expect(options.rootDir).to.match(/^\/opt\/frey$/)
        return done()
      })
    })

    return it('should transform the basename function', function (done) {
      var frey = new Frey()

      var options =
        {app        : './tusd|basename',
        recipeDir  : '{{{cwd}}}/frey/production',
        toolsDir   : '{{{home}}}/.frey/tools',
        sshkeysDir : '{{{home}}}/.ssh',
        rootDir    : '/opt/frey'
        }

      return frey._normalize(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.app).to.equal('tusd')
        return done()
      })
    })
  })

  describe('_defaults', function () {
    return it('should instantiate Frey with defaults', function (done) {
      var frey = new Frey()

      var options = {}
      return frey._defaults(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options._).to.deep.equal([ 'prepare' ])
        return done()
      })
    })
  })

  return describe('_composeChain', function () {
    it('should not add prepare if the command was prepare', function (done) {
      var frey = new Frey()

      var options =
        {_        : ['prepare'],
        bailAfter: 'prepare'
        }

      return frey._composeChain(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare'
        ])
        return done()
      })
    })

    it('should return auto bail on docbuild which is not part of a chain', function (done) {
      var frey = new Frey()

      var options =
        {_: ['docbuild']}

      ; return frey._composeChain(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare',
          'docbuild'
        ])
        return done()
      })
    })

    it('should return all links for prepare', function (done) {
      var frey = new Frey()

      var options =
        {_: ['prepare']}

      ; return frey._composeChain(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime', 'prepare', 'refresh', 'validate', 'plan', 'backup', 'launch',
          'install', 'deploy', 'restart', 'show',
        ])
        return done()
      })
    })

    it('should return one link for bail', function (done) {
      var frey = new Frey()

      var options =
        {_   : ['deploy'],
        bail: true
        }

      return frey._composeChain(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare',
          'deploy'
        ])
        return done()
      })
    })

    return it('should return some links for bailAfter', function (done) {
      var frey = new Frey()

      var options =
        {_        : ['refresh'],
        bailAfter: 'plan'
        }

      return frey._composeChain(options, function (err, options) {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare',
          'refresh',
          'validate',
          'plan'
        ])
        return done()
      })
    })
  })
})
