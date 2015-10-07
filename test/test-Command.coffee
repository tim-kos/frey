Command = require "../src/Command"
expect  = require("chai").expect

describe "Command", ->
  @timeout 10000
  describe "_toEnvFormat", ->
    it "should transform periods", (done) ->
      command = new Command "prepare",
        recipe : "{{{cwd}}}/frey/production"
        cwd    : "."
        tools  : "{{{home}}}/.frey/tools"


      env = command._toEnvFormat {"os.arch": "amd64"}, "prepare"
      expect(env).to.deep.equal
        FREY__PREPARE__OS_ARCH: "amd64"
      done()
