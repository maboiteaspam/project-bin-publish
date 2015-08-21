var fs = require('fs')
var child_process = require('child_process')
var rquote = require('regexp-quote')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('ensuregitexclude', function(){
    var done = this.async()
    var options = this.options()
    var gitignorefile = '.gitignore'
    var excludes = options.excludes || []

    var updateFile = function(file, items) {
      grunt.log.ok('Checking file ' + file)
      var added = []
      var ignored = !fs.existsSync(file)
        ? ''
        : fs.readFileSync(file) + '';
      items.forEach(function (ex) {
        if (!ignored.match(new RegExp('^'+rquote(ex)+'$'))) {
          ignored += '\n'+ex
          added.push(ex)
        }
      });
      fs.writeFileSync(file, ignored)
      if (added.length) grunt.log.ok('Added new entries:' + added.join(','))
      grunt.log.ok('All fine !')
    }

    if (!options.global) {
      updateFile(gitignorefile, excludes)
      done()
    } else {
      var args = [
        'config',
        '--global',
        'core.excludesfile'
      ];
      var git = spawn('git', args, {stdio: ['inherit','pipe','inherit']});
      git.stdout.on('data', function (d) {
        gitignorefile = (d + '').replace(/\s+$/, '');
      });
      git.on('close', function () {
        updateFile(gitignorefile, excludes)
        done()
      })
    }
  })

}
