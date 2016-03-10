#!/usr/bin/env node
// Careful using console.log, STDOUT should be preserved for formatted toml
var path = require('path')
var fs = require('fs')
var _ = require('lodash')
var TOML = require('toml')
var filename = process.argv[2]
var tomlFile = path.resolve(filename)
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
    info.depth = info.parts.length
  }

  return info
}

function getIndentLevel (info, infoParent) {
  var indentLevel = false

  if (infoParent && infoParent.parts[0] === 'infra') {
    indentLevel = infoParent.depth - 2
    if (infoParent.parts[1] === 'resource') {
      indentLevel = indentLevel - 1
    } else if (infoParent.parts[1] === 'variable') {
      indentLevel = 1
    }

    if (info.matchHeader) {
      indentLevel = indentLevel - 1
    }

    if (indentLevel < 0) {
      indentLevel = 0
    }
  }

  return indentLevel
}

var buf = fs.readFileSync(tomlFile, 'utf-8')
var data = {}
var error
try {
  data = TOML.parse(`${buf}`)
} catch (e) {
  error = e
}

if (!data || error) {
  var msg = `Could not parse TOML '${tomlFile}' starting with: \n\n'` + _.truncate(buf, {length: 1000}) + `'\n\n`
  msg += error
  msg += '\n\nHint: Did you not surround your strings with double-quotes?'
  throw new Error(msg)
}

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
      if (val === undefined) {
        console.error(data)
        throw new Error('Could not get value of ' + getPath + ' in above data.')
      }
      var json = JSON.parse(val)
      var prettified = JSON.stringify(json, null, '  ')
      var keyval = info.matchKey[1] + " = '''" + prettified + "'''"
      newLine = keyval
    }

    // Replace FREY environment variables, unless it's a header
    if (!info.matchHeader) {
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
