import Shell from '../src/Shell'
import { expect } from 'chai'

describe('Shell', () => {
  describe('_buildChildEnv', () => {
    it('should convert tf vars', done => {
      const runtime = {
        init: {
          env: {
            FREY_SOMETHING: 'foobar'
          }
        }
      }
      const shell = new Shell(runtime)

      const env = shell._buildChildEnv({'EXTRA': 'Yes Please'})
      expect(env).to.deep.equal({
        'EXTRA': 'Yes Please',
        'FREY_SOMETHING': 'foobar',
        'TF_VAR_FREY_SOMETHING': 'foobar'
      })
      done()
    })
  })
})
