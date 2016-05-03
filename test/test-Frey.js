import Frey from '../src/Frey'
import { expect } from 'chai'

describe('Frey', () => {
  describe('_composeChain', () => {
    it('should not add config if the command was config', (done) => {
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

    it('should always plan infra', (done) => {
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
          'deps',
          'prepare',
          'plan',
          'infra'
        ])
        done()
      })
    })

    it('should add format to convert, and not do a prepare', (done) => {
      const frey = new Frey()

      const options = {
        _: ['convert']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'deps',
          'convert',
          'format'
        ])
        done()
      })
    })

    it('should not add format to convert if bail is specified', (done) => {
      const frey = new Frey()

      const options = {
        _: ['convert'],
        bail: true
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'deps',
          'convert'
        ])
        done()
      })
    })

    it('should do format without convert', (done) => {
      const frey = new Frey()

      const options = {
        _: ['format']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'deps',
          'prepare',
          'format'
        ])
        done()
      })
    })

    it('should return auto bail on docbuild which is not part of a chain', (done) => {
      const frey = new Frey()

      const options = {
        _: ['docbuild']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init',
          'config',
          'deps',
          'prepare',
          'docbuild'
        ])
        done()
      })
    })

    it('should return all links for prepare', (done) => {
      const frey = new Frey()

      const options = {
        _: ['prepare']
      }

      frey._composeChain(options, (err, filteredChain) => {
        expect(err).to.equal(null)
        expect(filteredChain).to.deep.equal([
          'init', 'config', 'deps',
          'prepare', 'refresh', 'validate', 'plan', 'backup', 'infra',
          'install', 'setup', 'deploy', 'restart', 'show'
        ])
        done()
      })
    })

    it('should return one link for bail', (done) => {
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
          'deps',
          'prepare',
          'deploy'
        ])
        done()
      })
    })

    it('should return some links for bailAfter', (done) => {
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
          'deps',
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
