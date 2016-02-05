var Command = require('../src/Command')
var expect = require('chai').expect

describe('Command', function () {
  this.timeout(10000)
  return describe('_toEnvFormat', function () {
    return it('should transform periods', function (done) {
      var command = new Command( 'prepare',
        {recipeDir: '{{{cwd}}}/frey/production',
        toolsDir: '{{{home}}}/.frey/tools'
      })


      var env = command._toEnvFormat({'os.arch': 'amd64'}, 'prepare')
      expect(env).to.deep.equal({
        FREY__PREPARE__OS_ARCH: 'amd64'
      })
      return done()
    })
  })
})
