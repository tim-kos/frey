Frey   = require "../src/Frey"
expect = require("chai").expect

describe "Frey", ->
  @timeout 10000
  describe "runChain", ->
    it "should return all links for prepare", (done) ->
      frey = new Frey _: ["prepare"]
      frey.runChain (err, runChain) ->
        expect(err).to.equal null
        expect(runChain).to.deep.equal [
          "prepare"
          "init"
          "refresh"
          "validate"
          "plan"
          "backup"
          "launch"
          "install"
          "deploy"
          "restart"
          "show"
        ]
        done()

    it "should return one link for bail", (done) ->
      frey = new Frey "bail":true, _: ["deploy"]
      frey.runChain (err, runChain) ->
        expect(err).to.equal null
        expect(runChain).to.deep.equal [
          "deploy"
        ]
        done()
