import Frey from '../src/Frey'
import { expect } from 'chai'

describe('Frey', () => {
  describe('_composeChain', () => {
    it('should not add config if the command was config', done => {
      const frey = new Frey()

      const options = {
        _: ['config'],
        bailAfter: 'config'
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config'
        ])
        done()
      })
    })

    it('should always plan infra', done => {
      const frey = new Frey()

      const options = {
        _: ['infra'],
        bail: true
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'prepare',
          'plan',
          'infra'
        ])
        done()
      })
    })

    it('should return auto bail on docbuild which is not part of a chain', done => {
      const frey = new Frey()

      const options = {
        _: ['docbuild']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'prepare',
          'docbuild'
        ])
        done()
      })
    })

    it('should return all links for prepare', done => {
      const frey = new Frey()

      const options = {
        _: ['prepare']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init', 'config', 'prepare', 'refresh', 'validate', 'plan', 'backup', 'infra',
          'install', 'setup', 'deploy', 'restart', 'show'
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

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
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

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
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
