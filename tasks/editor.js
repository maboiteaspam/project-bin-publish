
var editor = require('editors');

module.exports = function(grunt) {

  grunt.registerMultiTask('edit', 'Open an editor', function() {

    var options = this.options(),
      done = this.async();

    function editFile(file, callback) {
      editor(file, options, function () {
        grunt.log.ok('Got it !')
        callback();
      });
    }
    editFile(options.file, done)
  });

};
