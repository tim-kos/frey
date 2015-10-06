Base   = require "../src/Base"
expect = require("chai").expect
debug  = require("depurar")("frey")

describe "Base", ->
  @timeout 10000
  describe "run", ->
    it "should run a bootchain", (done) ->
      output = []
      base   = new Base
      base._a = (cargo, cb) ->
        output.push "function _a called with #{cargo}"
        cargo = "output:a"
        cb null, cargo

      base._b = (cargo, cb) ->
        output.push "function _b called with #{cargo}"
        cargo = "output:b"
        cb null, cargo

      base.main = (cargo, cb) ->
        output.push "function main called with #{cargo}"
        cargo = "output:main"
        cb null, cargo

      base.boot = [
        "_a"
        "_b"
      ]

      base.run (err, result) ->
        expect(output).to.deep.equal [
          "function _a called with [object Object]"
          "function _b called with output:a"
          "function main called with output:b"
        ]
        expect(base.bootCargo).to.deep.equal
          _a: "output:a"
          _b: "output:b"

        done()
