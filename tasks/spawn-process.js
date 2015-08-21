
var fs = require('fs');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var cParser = require('cline-parser');

module.exports = function(grunt) {

  grunt.registerMultiTask('spawn-process', 'Merge JSON file values', function() {
    var cb = this.async();
    var options = this.options({
      spawn: null,
      failOnError: true,
      saveTo: null
    });
    var cmd = this.data.command;

    if (cmd === undefined) {
      throw new Error('`command` required');
    }

    cmd = grunt.template.process(typeof cmd === 'function' ? cmd.apply(grunt, arguments) : cmd);

    cmd = cParser(cmd);
    grunt.verbose.writeflags(cmd)

    var spawnOpts = options.spawn
    if (!spawnOpts) {
      if (!options.spawn) spawnOpts = {stdio: 'inherit'}
      else spawnOpts = {stdio: 'pipe'}
    }
    var error;
    spawn(cmd.prg, cmd.args, spawnOpts)
      .on('error', function (err) {
        error = err
      })
      .on('close', function () {
        if (options.saveTo) {
          grunt.config.set(options.saveTo, d);
        }
        if (error && options.failOnError) {
          grunt.warn(error);
        }
        cb();
      });
    grunt.verbose.writeln('Command:', chalk.yellow(cmd));
  });

};
