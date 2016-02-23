#!/usr/bin/env node
'use strict'
import Frey from './Frey'
// import depurar from 'depurar'; const debug = depurar('frey')
import yargs from 'yargs'
const updateNotifier = require('update-notifier')
import pkg from '../package.json'
import LiftOff from 'liftoff'
import commands from './commands'
import _ from 'lodash'

updateNotifier({pkg: pkg}).notify({defer: false})

yargs
  .usage('Usage: frey <command> [options]')
  .example('frey backup -d ./envs/production', 'backup platform described in ./envs/production')
  .options({
    recipeDir: {
      nargs: 1,
      type: 'string',
      describe: 'Directory that contains the Freyfile.toml. Frey will traverse upwards if empty. '
    },
    app: {
      default: '{{{recipeDir}}}|basename',
      nargs: 1,
      type: 'string',
      describe: "Name of application for which we're creating infrastructure"
    },
    config: {
      nargs: 1,
      type: 'string',
      describe: 'Configuration keys to overwrite such as: global.ssh.keysdir={{{os.home}}}/.ssh'
    },
    'force-yes': {
      default: false,
      boolean: true,
      describe: 'Answer yes to all questions (dangerous!)'
    },
    'terraform-parallelism': {
      default: 10,
      nargs: 1,
      type: 'number',
      describe: 'Limit the number of concurrent operations. Useful for consistent test output'
    },
    tags: {
      nargs: 1,
      type: 'string',
      describe: 'A list of tags to execute in isolation'
    },
    sleep: {
      default: 5,
      nargs: 1,
      type: 'number',
      describe: 'Wait x seconds between showing infra plan, and executing it'
    },
    bail: {
      boolean: true,
      describe: 'Do not follow the chain of commands, run a one-off command'
    },
    'bail-after': {
      nargs: 1,
      type: 'string',
      describe: 'After running this command, abort the chain'
    },
    'no-color': {
      boolean: true,
      describe: 'Color support is detected, this forces colors off'
    },
    verbose: {
      alias: 'v',
      count: true,
      describe: 'Show debug info'
    },
    unsafe: {
      boolean: true,
      describe: 'Allow execution, even though your Git working directory is unclean'
    }
  })
  .command('completion', 'Install CLI auto completion')
  .epilog('Copyright 2016 Transloadit')
  .help('help')
  .wrap(yargs.terminalWidth())
  .version(() => {
    return pkg.version
  })

// First add chained commands, in order
for (let cmd of commands) {
  let description = `${cmd.description}`
  if (cmd.chained === true) {
    description = '▽ ' + description
  }
  yargs.command(cmd.name, description)
}

// 'Execute' yargss
const argv = yargs.argv

if (argv._[0] === undefined) {
  argv._[0] = commands[0].name
}

// We override built-in completion command
if (argv._[0] === 'completion') {
  // we want to make sure we have the global /usr/local/bin/frey instead of
  // ../../../frey/bin/frey in the ~/.bash_profile
  yargs.showCompletionScript(process.env._)
  process.exit(0)
}

if (!_.find(commands, { 'name': argv._[0] })) {
  yargs.showHelp()
  console.error('')
  console.error(`--> Command '${argv._[0]}' is not recognized`)
  process.exit(1)
}

// For Frey, LiftOff:
//  - Scans for the closest Freyfile.toml
//  - Switches to local npm install if available
const liftOff = new LiftOff({
  name: 'frey',
  configName: 'Freyfile',
  processTitle: 'frey',
  extensions: {'.toml': null}
})

liftOff.launch({
  cwd: argv.recipeDir
}, env => {
  if (env.configBase === undefined) {
    const msg = 'Could not find a Freyfile.toml in current directory or upwards, or in recipe directory.'
    throw new Error(msg)
  }

  // Let LiftOff override the recipe dir
  argv.recipeDir = env.configBase
  const frey = new Frey(argv)

  // Bombs away
  return frey.run(err => {
    if (err) {
      // yargs.showHelp()
      console.error('')
      console.error(`--> Exiting with error: ${err.message}`)
      if (err.details) {
        console.error('--> Details:')
        console.error('')
        console.error(err.details)
        console.error('')
      }
      process.exit(1)
      return
    }

    console.log('Done')
    return process.exit(0)
  })
})
