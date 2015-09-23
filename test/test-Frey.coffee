Frey   = require "../src/Frey"
expect = require("chai").expect

describe "Frey", ->
  @timeout 10000
  describe "_normalize", ->
    it "should transform the directory variable", (done) ->
      frey = new Frey "recipe": "{directory}/frey/production", "directory": "./foobar"
      frey._normalize (err) ->
        expect(err).to.equal null
        expect(frey.config.recipe).to.equal "./foobar/frey/production"
        done()

    it "should transform the basename function", (done) ->
      frey = new Frey "app": "./tusd|basename"
      frey._normalize (err) ->
        expect(err).to.equal null
        expect(frey.config.app).to.equal "tusd"
        done()

  describe "_defaults", ->
    it "should instantiate Frey with defaults", (done) ->
      frey = new Frey
      frey._defaults (err) ->
        expect(err).to.equal null
        expect(frey.config._).to.deep.equal [ "init" ]
        done()

  describe "_validate", ->
    it "should error out if there's no command", (done) ->
      frey = new Frey directory: "."
      frey._validate (err) ->
        expect(err).to.have.property("message").to.match /'undefined' is not a supported Frey/
        done()

  describe "_toEnvFormat", ->
    it "should transform periods", (done) ->
      frey = new Frey _: ["prepare"]
      env = frey._toEnvFormat {"os.arch": "amd64"}, "prepare"
      expect(env).to.deep.equal
        FREY__PREPARE__OS_ARCH: "amd64"
      done()

  describe "_filterChain", ->
    it "should return all links for prepare", (done) ->
      frey = new Frey _: ["prepare"]
      frey._filterChain (err, filteredChain) ->
        expect(err).to.equal null
        expect(filteredChain).to.deep.equal [
          "prepare", "init", "refresh", "validate", "plan", "backup", "launch",
          "install", "deploy", "restart", "show",
        ]
        done()

    it "should return one link for bail", (done) ->
      frey = new Frey "bail": true, _: ["deploy"]
      frey._filterChain (err, filteredChain) ->
        expect(err).to.equal null
        expect(filteredChain).to.deep.equal [
          "deploy"
        ]
        done()
