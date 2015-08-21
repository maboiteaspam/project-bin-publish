var fs = require('fs')
var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('readfiletoconfig', function(){
    var options = this.options()
    var file = options.file
    var save_to = options.save_to
    var exclude = options.exclude || null
    var refine = options.refine || function(v){return v;}

    var content = ''
    if (fs.existsSync(file)) content += ''+fs.readFileSync(file);
    content.split('\n').forEach(function(line, i){
      if (!i) content = ''
      if (!exclude || !line.match(exclude)) content+=line+'\n'
    })

    content = refine(content)

    grunt.config.set(save_to, content)

  })

}
