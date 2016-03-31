'use strict'
import Command from '../Command'
import fs from 'fs'
import async from 'async'
import _ from 'lodash'
import TOML from 'toml'
import indentString from 'indent-string'
import stripIndent from 'strip-indent'
import globby from 'globby'
import depurar from 'depurar'; const debug = depurar('frey')

class Format extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_confirm'
    ]
  }

  _confirm (cargo, cb) {
    this.shell.confirm('About to rewrite all TOML files in your project dir. Make sure your files are under source control as this is a best-effort procedure. May I proceed?', cb)
  }

  _scanLine (line, data) {
    const info = {}

    info.matchMultiLineString = line.match(/('''|""")/)
    info.matchKey = line.match(/^\s*([a-z_]+)\s*=\s*/)
    info.matchSingleLineJSON = line.match(/^\s*[a-z_]+\s*=\s*"({.+})"\s*$/)
    info.matchHeader = line.match(/^\s*\[\[?([a-z0-9\.\-\_]+)\]\]?\s*$/i)
    if (info.matchHeader) {
      info.insideHeaderKey = info.matchHeader[1]
      info.parts = info.insideHeaderKey.split('.')
      info.depth = info.parts.length
    }

    return info
  }

  _getIndentLevel (info, infoParent) {
    let indentLevel = false

    if (infoParent) {
      indentLevel = infoParent.depth - 2
      if (infoParent.parts[1] === 'resource') {
        indentLevel = indentLevel - 1
      } else if (infoParent.parts[1] === 'playbooks') {
        indentLevel = indentLevel + 1
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

  _reformatFile (tomlFile, cb) {
    const buf = fs.readFileSync(tomlFile, 'utf-8')
    let data = {}
    let error
    try {
      data = TOML.parse(`${buf}`)
    } catch (e) {
      error = e
    }

    if (!data || error) {
      let msg = `Could not parse TOML '${tomlFile}' starting with: \n\n'` + _.truncate(buf, {length: 1000}) + `'\n\n`
      msg += error
      msg += '\n\nHint: Did you not surround your strings with double-quotes?'
      throw new Error(msg)
    }

    const lines = buf.split('\n')
    const newLines = []
    let newLine = ''
    let infoParent = false
    lines.forEach((line, i) => {
      // Scan Current Line, Parent, and Next
      let infoNext = false
      const info = this._scanLine(line, data)
      if (lines[i + 1]) {
        infoNext = this._scanLine(lines[i + 1], data)
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
          const getPath = `${infoParent.insideHeaderKey}.${info.matchKey[1]}`
          const val = _.get(data, getPath)
          if (val === undefined) {
            console.error(data)
            throw new Error(`Could not get value of ${getPath} in above data.`)
          }
          const json = JSON.parse(val)
          const prettified = JSON.stringify(json, null, '  ')
          const keyval = `${info.matchKey[1]} = '''${prettified}'''`
          newLine = keyval
        }

        // Replace FREY environment variables, unless it's a header
        if (!info.matchHeader) {
          _.forOwn(process.env, (val, key) => {
            if (key.substr(0, 5) !== 'FREY_') {
              return
            }

            while (newLine.indexOf(val) > -1) {
              newLine = newLine.replace(val, '${var.${key}}')
            }
          })
        }
      }

      // Re-indent, unless getIndentLevel returned false
      const indentLevel = this._getIndentLevel(info, infoParent)
      if (indentLevel !== false) {
        newLine = indentString(stripIndent(newLine), '  ', indentLevel)
      }

      newLines.push(newLine)
    })

    const newBuf = newLines.join('\n')

    console.log(newBuf)
    debug('Saved ' + tomlFile)
    fs.writeFile(tomlFile, newBuf, 'utf-8', cb)
  }

  main (cargo, cb) {
    const pattern = `${this.runtime.init.cliargs.projectDir}/*.toml`
    debug(`Reading from '${pattern}'`)
    return globby(pattern)
      .then((tomlFiles) => {
        async.map(tomlFiles, this._reformatFile.bind(this), (err, results) => {
          if (err) {
            return cb(err)
          }
          return cb(null)
        })
      })
      .catch(cb)
  }
}

module.exports = Format
