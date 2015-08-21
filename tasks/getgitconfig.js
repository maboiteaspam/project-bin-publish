var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('getgitconfig', function(){
    var done = this.async()
    var options = this.options()
    var gitentry = options.entry
    var gruntvar = options.save_to
    var global = !!options.global

    var args = ['config'];
    if (global) args.push('--global')
    args.push(gitentry)

    var currentConfig = ''
    var git = spawn('git', args, {stdio: ['inherit','pipe','inherit']});
    git.stdout.on('data', function (d) {
      currentConfig = (d + '').replace(/\s+$/, '');
    });
    git.on('close', function () {
      if (!currentConfig) {
        grunt.log.warn('git does not have '+(global?'global ':' ')+'configuration for entry: "'+gitentry+'"')
      } else {
        grunt.config.set(gruntvar, currentConfig)
        grunt.log.ok('Save '+(global?'global ':' ')+'git config value "'+gruntvar+'" to "'+currentConfig+'" !')
      }
      done()
    })

  })

}
