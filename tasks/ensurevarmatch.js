var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  grunt.registerMultiTask('ensurevarmatch', function(){

    var options = this.options();
    var varName = options.var
    var pattern = grunt.config.process(options.pattern)
    var currentValue = grunt.config.get(varName)

    if (!currentValue.match(pattern)) {
      grunt.log.error(currentValue)
      grunt.fail.fatal('"'+varName+'" must match "'+pattern+'"')
    }
  })

}
