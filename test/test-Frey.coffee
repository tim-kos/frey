Frey   = require "../src/Frey"
expect = require("chai").expect

describe "Frey", ->
  @timeout 10000
  describe "_normalize", ->
    it "should transform the cwd variable", (done) ->
      frey = new Frey

      options =
        recipe    : "{cwd}/frey/production"
        cwd : "."
        tools     : "{home}/.frey/tools"

      frey._normalize options, (err, options) ->
        expect(err).to.equal null
        expect(options.recipe).to.match /\/frey\/production$/
        done()

    it "should transform the basename function", (done) ->
      frey = new Frey

      options =
        app       : "./tusd|basename"
        recipe    : "{cwd}/frey/production"
        cwd : "."
        tools     : "{home}/.frey/tools"

      frey._normalize options, (err, options) ->
        expect(err).to.equal null
        expect(options.app).to.equal "tusd"
        done()

  describe "_defaults", ->
    it "should instantiate Frey with defaults", (done) ->
      frey = new Frey

      options = {}
      frey._defaults options, (err, options) ->
        expect(err).to.equal null
        expect(options._).to.deep.equal [ "prepare" ]
        done()

  describe "_validate", ->
    it "should error out if there's no command", (done) ->
      frey = new Frey

      options =
        cwd: "."

      frey._validate options, (err, options) ->
        expect(err).to.have.property("message").to.match /'undefined' is not a supported Frey/
        done()

  describe "_composeChain", ->
    it "should not add prepare if the command was prepare", (done) ->
      frey = new Frey

      options =
        _        : ["prepare"]
        bailAfter: "prepare"

      frey._composeChain options, (err, options) ->
        expect(err).to.equal null
        expect(options.filteredChain).to.deep.equal [
          "runtime"
          "prepare"
        ]
        done()

    it "should return auto bail on docbuild which is not part of a chain", (done) ->
      frey = new Frey

      options =
        _: ["docbuild"]

      frey._composeChain options, (err, options) ->
        expect(err).to.equal null
        expect(options.filteredChain).to.deep.equal [
          "runtime"
          "prepare"
          "docbuild"
        ]
        done()

    it "should return all links for prepare", (done) ->
      frey = new Frey

      options =
        _: ["prepare"]

      frey._composeChain options, (err, options) ->
        expect(err).to.equal null
        expect(options.filteredChain).to.deep.equal [
          "runtime", "prepare", "refresh", "validate", "plan", "backup", "launch",
          "install", "deploy", "restart", "show",
        ]
        done()

    it "should return one link for bail", (done) ->
      frey = new Frey

      options =
        _   : ["deploy"]
        bail: true,

      frey._composeChain options, (err, options) ->
        expect(err).to.equal null
        expect(options.filteredChain).to.deep.equal [
          "runtime"
          "prepare"
          "deploy"
        ]
        done()

    it "should return some links for bailAfter", (done) ->
      frey = new Frey

      options =
        _        : ["refresh"]
        bailAfter: "plan",

      frey._composeChain options, (err, options) ->
        expect(err).to.equal null
        expect(options.filteredChain).to.deep.equal [
          "runtime"
          "prepare"
          "refresh"
          "validate"
          "plan"
        ]
        done()
