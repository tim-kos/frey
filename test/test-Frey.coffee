Frey   = require "../src/Frey"
expect = require("chai").expect

describe "Frey", ->
  @timeout 10000
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
