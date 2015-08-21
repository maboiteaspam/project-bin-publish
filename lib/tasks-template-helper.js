
var temp = require('temp').track();
var glob = require('glob');
var path = require('path');
var TasksWorkflow = require('./tasks-workflow.js');

var TasksTemplateHelper = function (workflow){
  var self = this
  if (!(self instanceof TasksTemplateHelper)) return new TasksTemplateHelper(workflow)
  this.workflow = workflow || new TasksWorkflow();
}
TasksTemplateHelper.prototype.generateContent = function(name, template, saveTo, refine) {
  // --
  var tempFile = temp.path({suffix: '.mutiline'})
  this.generateFile('mulitline_'+name, template, tempFile)

  // --
  var readfiletoconfigOpts = {
    'options': {
      file: tempFile,
      save_to: saveTo || 'run.content.' + name,
      refine: refine
    }
  }
  this.workflow.registerTask('readfiletoconfig', name, readfiletoconfigOpts)
  return this;
}
TasksTemplateHelper.prototype.generateFile = function(name, template, output) {
  // --
  var templateOpts = {
    'options': {
      data: function(grunt){return grunt.config.get();}
    },
    'files': {}
  }
  templateOpts.files[output] = [template]
  this.workflow.registerTask('template', name, templateOpts)
  // --
  if (output.match(/json$/)) {
    var jsonFormatOpts = {
      'options': {
        infile: output
      }
    }
    this.workflow.registerTask('jsonformat', name, jsonFormatOpts)
  }
  // --
  //taskOpts.run = {
  //  'vcs': {
  //    add: [output]
  //  }
  //}
  //grunt.config.merge(taskOpts)
  return this;
}
TasksTemplateHelper.prototype.generateDir = function(name, fromDir, toDir) {
  var templateOpts = {
    'options': {
      data: function(grunt){return grunt.config.get();}
    },
    'files': {}
  }
  var files = glob.sync('**/**', {dot: true, cwd: fromDir, nodir: true})
  files.forEach(function (f) {
    templateOpts.files[path.join(toDir, f)] = path.join(fromDir, f);
  })
  this.workflow.registerTask('template', name, templateOpts)
  //taskOpts.run = {
  //  'vcs': {
  //    add: files
  //  }
  //}
  //grunt.config.merge(taskOpts)
  return this;
}

module.exports = TasksTemplateHelper;
