const Frey = require('../src/Frey')
const expect = require('chai').expect

describe('Frey', () => {
  describe('_normalize', () => {
    it('should transform the cwd variable', done => {
      const frey = new Frey()

      const options =
        {recipeDir: '{{{cwd}}}/frey/production',
        toolsDir: '{{{home}}}/.frey/tools',
        sshkeysDir: '{{{home}}}/.ssh',
        rootDir: '/opt/frey'
        }

      return frey._normalize(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.recipeDir).to.match(/\/frey\/production$/)
        expect(options.rootDir).to.match(/^\/opt\/frey$/)
        return done()
      })
    })

    return it('should transform the basename function', done => {
      const frey = new Frey()

      const options =
        {app: './tusd|basename',
        recipeDir: '{{{cwd}}}/frey/production',
        toolsDir: '{{{home}}}/.frey/tools',
        sshkeysDir: '{{{home}}}/.ssh',
        rootDir: '/opt/frey'
        }

      return frey._normalize(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.app).to.equal('tusd')
        return done()
      })
    })
  })

  describe('_defaults', () => {
    return it('should instantiate Frey with defaults', done => {
      const frey = new Frey()

      const options = {}
      return frey._defaults(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options._).to.deep.equal([ 'prepare' ])
        return done()
      })
    })
  })

  return describe('_composeChain', () => {
    it('should not add prepare if the command was prepare', done => {
      const frey = new Frey()

      const options = {
        _: ['prepare'],
        bailAfter: 'prepare'
      }

      return frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare'
        ])
        return done()
      })
    })

    it(
      'should return auto bail on docbuild which is not part of a chain',
      done => {
        const frey = new Frey()

        const options =
          {_: ['docbuild']}

        ; return frey._composeChain(options, (err, options) => {
          expect(err).to.equal(null)
          expect(options.filteredChain).to.deep.equal([
            'runtime',
            'prepare',
            'docbuild'
          ])
          return done()
        })
      }
    )

    it('should return all links for prepare', done => {
      const frey = new Frey()

      const options =
        {_: ['prepare']}

      ; return frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime', 'prepare', 'refresh', 'validate', 'plan', 'backup', 'launch',
          'install', 'deploy', 'restart', 'show'
        ])
        return done()
      })
    })

    it('should return one link for bail', done => {
      const frey = new Frey()

      const options =
        {_: ['deploy'],
        bail: true
        }

      return frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'runtime',
          'prepare',
          'deploy'
        ])
        return done()
      })
    })

    return it('should return some links for bailAfter', done => {
      const frey = new Frey()

      const options = {
        _: ['refresh'],
        bailAfter: 'plan'
      }

      return frey._composeChain(options, (err, options) => {
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
