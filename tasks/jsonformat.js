var fs = require('fs')

module.exports = function (grunt){
  grunt.registerMultiTask('jsonformat', function(){
    var options = this.options()
    var infile = options.infile
    if (fs.readFileSync(infile)) {
      var k = fs.readFileSync(infile)
      k = JSON.parse(k)
      k = JSON.stringify(k, null, 4)
      fs.writeFileSync(infile, k)
      grunt.log.ok('File is clean !')
    } else {
      grunt.log.warn('This file does not exists ' + infile + ', skipped!')
    }
  })
}
