#!/usr/bin/env node
debug    = require("depurar")()
Tensible = require "../src/Tensible"
tensible = new Tensible
tensible.run()
