var hcl = require('hcl')
var fs = require('fs')
var buf = fs.readFileSync('sg.tf', 'utf-8')
var parsed = hcl.parse(buf)

console.dir(parsed.resource[0].aws_security_group[0]['sg-1-default'])
