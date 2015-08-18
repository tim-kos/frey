#!/usr/bin/env node
debug    = require("depurar")()
Terrible = require "../src/Terrible"
terrible = new Terrible
terrible.run()
