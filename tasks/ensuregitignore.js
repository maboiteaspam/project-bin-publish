var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('gitinit', function(){
    var done = this.async()
    var options = this.options()
    var args = ['init'];
    ('path' in options)&& args.push(options.path);
    ('shared' in options)&& args.push('--shared', options.shared);
    ('template' in options)&& args.push('--template', options.template);
    ('gitDir' in options)&& args.push('--separate-git-dir', options.gitDir);
    ('bare' in options)&& args.push('--bare ');
    ('quiet' in options)&& args.push('--quiet ');
    spawn('git', args, {stdio:'inherit'})
      .on('close', function () {
        done()
      })
  })

}
