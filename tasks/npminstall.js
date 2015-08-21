var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('npminstall', function(){
    var done = this.async()
    var options = this.options()
    var args = ['install'];
    ('pkgs' in options)&& (args = args.concat(options.pkgs));
    ('mode' in options)&& args.push('--' + options.mode);
    spawn('npm', args, {stdio:'inherit'})
      .on('close', function () {
        done()
      })
  })

}
