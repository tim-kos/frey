import Command from '../src/Command'
import { expect } from 'chai'

describe('Command', () => {
  describe('_toEnvFormat', () => {
    it('should transform periods', done => {
      const command = new Command('prepare',
        {recipeDir: '{{{init.os.cwd}}}/frey/production',
        toolsDir: '{{{init.os.home}}}/.frey/tools'
      })

      const env = command._toEnvFormat({'os.arch': 'amd64'}, 'prepare')
      expect(env).to.deep.equal({
        FREY__PREPARE__OS_ARCH: 'amd64'
      })
      done()
    })
  })
})
