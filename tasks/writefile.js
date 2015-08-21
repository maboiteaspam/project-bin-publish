var fs = require('fs')

module.exports = function (grunt){
  grunt.registerMultiTask('writefile', function(){
    var options = this.options()
    var infile = options.file
    var mode = options.mode || 'replace'
    var content = grunt.config.process(options.content)
    if (fs.readFileSync(infile)) {
      var k = fs.readFileSync(infile)
      if (mode.match(/append/)) k = k + content
      if (mode.match(/prepend/)) k = content + k
      if (mode.match(/replace/)) k = content
      fs.writeFileSync(infile, k)
      grunt.log.ok('File is updated !')
    } else {
      grunt.log.warn('This file does not exists ' + infile + ', skipped!')
    }
  })
}
