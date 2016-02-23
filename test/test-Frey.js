import Frey from '../src/Frey'
import { expect } from 'chai'

describe('Frey', () => {
  describe('_normalize', () => {
    it('should transform the basename function', done => {
      const frey = new Frey()

      const options = {
        recipeDir: '/Users/kvz/code/uppy-server',
        home: '/Users/kvz',
        app: './tusd|basename',
        toolsDir: '{{{os.home}}}/.frey/tools',
        sshkeysDir: '{{{os.home}}}/.ssh',
        rootDir: '/opt/frey'
      }

      frey._normalize(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.app).to.equal('tusd')
        done()
      })
    })
  })

  describe('_defaults', () => {
    it('should instantiate Frey with defaults', done => {
      const frey = new Frey()

      const options = {}
      frey._defaults(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options._).to.deep.equal([ 'prepare' ])
        done()
      })
    })
  })

  describe('_composeChain', () => {
    it('should not add compile if the command was compile', done => {
      const frey = new Frey()

      const options = {
        _: ['compile'],
        bailAfter: 'compile'
      }

      frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'init',
          'compile'
        ])
        done()
      })
    })

    it(
      'should return auto bail on docbuild which is not part of a chain',
      done => {
        const frey = new Frey()

        const options = {
          _: ['docbuild']
        }

        frey._composeChain(options, (err, options) => {
          expect(err).to.equal(null)
          expect(options.filteredChain).to.deep.equal([
            'init',
            'compile',
            'prepare',
            'docbuild'
          ])
          done()
        })
      }
    )

    it('should return all links for prepare', done => {
      const frey = new Frey()

      const options = {
        _: ['prepare']
      }

      frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'init', 'compile', 'prepare', 'refresh', 'validate', 'plan', 'backup', 'launch',
          'install', 'deploy', 'restart', 'show'
        ])
        done()
      })
    })

    it('should return one link for bail', done => {
      const frey = new Frey()

      const options = {
        _: ['deploy'],
        bail: true
      }

      frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'init',
          'compile',
          'prepare',
          'deploy'
        ])
        done()
      })
    })

    it('should return some links for bailAfter', done => {
      const frey = new Frey()

      const options = {
        _: ['refresh'],
        bailAfter: 'plan'
      }

      frey._composeChain(options, (err, options) => {
        expect(err).to.equal(null)
        expect(options.filteredChain).to.deep.equal([
          'init',
          'compile',
          'prepare',
          'refresh',
          'validate',
          'plan'
        ])
        done()
      })
    })
  })
})
