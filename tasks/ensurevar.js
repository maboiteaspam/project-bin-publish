var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  var inquirer = require('inquirer')
  grunt.registerMultiTask('ensurevar', function(){

    var options = this.options();
    var varName = options.var
    var defaultValue = grunt.config.process(options.default)
    var currentValue = grunt.config.get(varName)

    if (!currentValue)  {

      var done = this.async()
      var questions = [
        {
          type: "input",
          name: "value",
          message: "You are required to configure '"+varName+"', please type in its value (defaults to "+defaultValue+") :",
          validate: function( value ) {
            if (!value && !defaultValue) {
              return "You must enter a different value !";
            }
            return true;
          }
        }
      ];

      inquirer.prompt( questions, function( answers ) {
        var answer = answers.value || defaultValue
        grunt.config.set(varName, answer)
        grunt.log.ok('Grunt config "' + varName + '" is set to "' + answer + '" !')
        done()
      });
    } else {
      grunt.log.ok('Grunt config "' + varName + '" is already set to "' + defaultValue + '" !')
    }
  })

}
