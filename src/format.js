#!/usr/bin/env node
var path = require('path')
var fs = require('fs')
var _ = require('lodash')
var toml = require('toml')
var filename = process.argv[2]
var filepath = path.resolve(filename)
var indentString = require('indent-string')
var stripIndent = require('strip-indent')

function scanLine (line, data) {
  var info = {}

  info.matchMultiLineString = line.match(/('''|""")/)
  info.matchKey = line.match(/^\s*([a-z_]+)\s*=\s*/)
  info.matchSingleLineJSON = line.match(/^\s*[a-z_]+\s*=\s*"({.+})"\s*$/)
  info.matchHeader = line.match(/^\s*\[([a-z0-9\.\-\_]+)\]\s*$/i)
  if (info.matchHeader) {
    info.insideHeaderKey = info.matchHeader[1]
    info.parts = info.insideHeaderKey.split('.')
    info.nestingLevel = info.parts.length
  }

  return info
}

function getIndentLevel (info, infoParent) {
  var indentLevel = false

  if (infoParent && infoParent.parts[0] === 'infra') {
    if (info.matchHeader) {
      indentLevel = infoParent.nestingLevel - 4
    } else {
      indentLevel = infoParent.nestingLevel - 3
    }
    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  return indentLevel
}

var buf = fs.readFileSync(filepath, 'utf-8')
var data = toml.parse(buf)
var lines = buf.split('\n')
var newLines = []
var newLine = ''
var infoParent = false
lines.forEach(function (line, i) {
  // Scan Current Line, Parent, and Next
  var infoNext = false
  var info = scanLine(line, data)
  if (lines[i + 1]) {
    infoNext = scanLine(lines[i + 1], data)
  }
  if (info.matchHeader) {
    infoParent = info
  }

  // Don't add empty headers
  if (infoParent && info.matchHeader && infoNext && infoNext.matchHeader) {
    return
  }

  newLine = line
  if (infoParent && infoParent.parts[0] === 'infra') {
    // Currently only process infra blocks

    // Prettify single-line JSON strings with TOML ''' strings
    if (info.matchSingleLineJSON) {
      var getPath = infoParent.insideHeaderKey + '.' + info.matchKey[1]
      var val = _.get(data, getPath)
      var json = JSON.parse(val)
      var prettified = JSON.stringify(json, null, '  ')
      var keyval = info.matchKey[1] + " = '''" + prettified + "'''"
      newLine = keyval
    }

    // Replace FREY environment variables, unless it's a header
    if (info.matchHeader) {
      _.forOwn(process.env, function (val, key) {
        if (key.substr(0, 5) !== 'FREY_') {
          return
        }

        while (newLine.indexOf(val) > -1) {
          newLine = newLine.replace(val, '${var.' + key + '}')
        }
      })
    }
  }

  // Re-indent, unless getIndentLevel returned false
  var indentLevel = getIndentLevel(info, infoParent)
  if (indentLevel !== false) {
    newLine = indentString(stripIndent(newLine), '  ', indentLevel)
  }

  newLines.push(newLine)
})

var newBuf = newLines.join('\n')
console.log(newBuf)
