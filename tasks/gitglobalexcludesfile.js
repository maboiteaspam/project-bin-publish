var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('gitglobalexcludesfile', function(){
    var done = this.async()
    var options = this.options()
    var args = [
      'config',
      '--global',
      'core.excludesfile'
    ];

    if (options.force && options.path) {
      args.push(options.path)
      spawn('git', args, {stdio:'inherit'})
        .on('close', function () {
          done()
        })
    } else {
      var currentConfig = ''
      var git = spawn('git', args, {stdio: ['inherit','pipe','inherit']});
      git.stdout.on('data', function (d) {
          currentConfig = (d + '').replace(/\s+$/, '');
        });
      git.on('close', function () {
        if (!currentConfig.length && options.path) {
          args.push(options.path)
          grunt.log.warn('Configuring code.excludefiles git variable ' +
          'to ' + options.path)
          spawn('git', args, {stdio:'inherit'})
            .on('close', function () {
              grunt.log.ok('All done !')
              done()
            })
        } else if(!currentConfig.length && options.required) {
          grunt.log.error('git variable code.excludefiles must be configured, ' +
          'but you have not told me how it should be, ' +
          'please check your configuration!')
          done()
        } else if(!currentConfig.length) {
          grunt.log.warn('fyi, ' +
          'git variable code.excludefiles is not configured.')
          done()
        } else {
          grunt.log.ok('All fine !')
          done()
        }
      })
    }
  })

}
