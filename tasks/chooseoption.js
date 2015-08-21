var child_process = require('child_process')
var spawn = child_process.spawn;

module.exports = function (grunt){

  var inquirer = require('inquirer')
  grunt.registerMultiTask('chooseoption', function(){

    var options = this.options();
    var question = options.question
    var choices = options.choices
    var def = items.indexOf(options.defVal)
    var saveTo = options.saveTo
    var refine = options.refine

    var done = this.async()
    var questions = [
      {
        type: "list",
        name: "value",
        message: question,
        choices: choices,
        default: def,
        filter: refine
      }
    ];

    inquirer.prompt( questions, function( answers ) {
      grunt.config.set(saveTo, answers.value)
      grunt.log.ok('Grunt config "' + saveTo + '" is set to "' + answers.value + '" !')
      done()
    });
  })

}
