import Command from '../src/Command'
import { expect } from 'chai'

describe('Command', () => {
  describe('_buildChildEnv', () => {
    it('should convert tf vars', done => {
      const command = new Command('prepare', {
        projectDir: '{{{init.os.cwd}}}/frey/production'
      })

      command.runtime = {
        init: {
          env: {
            FREY_SOMETHING: 'foobar'
          }
        }
      }

      const env = command._buildChildEnv({'EXTRA': 'Yes Please'})
      expect(env).to.deep.equal({
        'EXTRA': 'Yes Please',
        'FREY_SOMETHING': 'foobar',
        'TF_VAR_FREY_SOMETHING': 'foobar'
      })
      done()
    })
  })
})
