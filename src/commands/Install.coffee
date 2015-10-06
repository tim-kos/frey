Command = require "../Command"
chalk   = require "chalk"
debug   = require("depurar")("frey")

class Install extends Command
  boot: [
    "_gatherAnsibleArgs"
  ]

  _gatherAnsibleArgs: (options, cb) ->
    ansibleArgs = []
    if !chalk.enabled
      ansibleArgs.push "--no-color"

    ansibleArgs.push "--tags=#{options.tags}"

    cb null, ansibleArgs

  main: (ansibleArgs, cb) ->
    ansibleExe = (dep.exe for dep in @runtime.deps when dep.name == "ansible")[0]
    cmd   = [
      ansibleExe
      "plan"
    ]
    cmd = cmd.concat ansibleArgs
    cmd = cmd.join " "

    @_exeScript ["-c", cmd], {}, (err, stdout) =>
      if err
        return cb err

      @_out "--> Saved plan as '#{@runtime.paths.planFile}'\n"

      if stdout.match /No changes/
        return cb null

      m = stdout.match /Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/
      if !m
        return cb new Error "Unable to parse add/change/destroy"

      [ _, add, change, destroy ] = m

      @runtime.launchPlan =
        add    :add
        change :change
        destroy:destroy

      cb null

  # tags=""
  # if [ -n "${FREY__OPTIONS__TAGS}" ]; then
  #   tags="--tags="${FREY__OPTIONS__TAGS}""
  # fi
  # ANSIBLE_OPTIONS="${__ansibleCfg}" \
  # ANSIBLE_HOST_KEY_CHECKING=False \
  # TF_STATE="${__stateFile}" \
  #   "${__ansiblePlaybookExe}" \
  #     ${tags} \
  #     --user="${FREY__RUNTIME__SSH__USER}" \
  #     --private-key="${FREY__RUNTIME__SSH__KEYPRV_FILE}" \
  #     --inventory-file="${__ansibleInventoryExe}" \
  #     --sudo \
  #   "${__playbookFile}"
  #

module.exports = Install
