
var temp = require('temp').track();
var fs = require('fs');
var path = require('path');

var TasksTemplate = require('./tasks-template-helper.js');
var TasksWorkflow = require('./tasks-workflow.js');

var TasksUtilHelper = function (workflow){
  var self = this
  if (!(self instanceof TasksUtilHelper)) return new TasksUtilHelper(workflow)
  this.workflow = workflow || new TasksWorkflow();
}
TasksUtilHelper.prototype.spawnProcess = function(name, cmd, opts) {
  var spawnProcessOpts = {
    options: opts,
    command: cmd
  }
  this.workflow.registerTask('spawn-process', name, spawnProcessOpts)
  return this;
}
TasksUtilHelper.prototype.ensureValues = function(name, vars) {
  var that = this
  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    var opts = {
      'options': v
    };
    that.workflow.registerTask('ensurevar', okName, opts)
  })
  return this;
}
TasksUtilHelper.prototype.ensureValuesDoesNotMatch = function(name, vars) {
  var that = this
  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    var opts = {
      'options': v
    };
    that.workflow.registerTask('ensurevardoesnotmatch', okName, opts)
  })
  return this;
}
TasksUtilHelper.prototype.ensureValuesMatch = function(name, vars) {
  var that = this
  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    var opts = {
      'options': v
    };
    that.workflow.registerTask('ensurevarmatch', okName, opts)
  })
  return this;
}
TasksUtilHelper.prototype.editFile = function(name, file, editor) {
  var editorOpts = {
    'options': {
      file: file,
      editor: editor || null
    }
  }
  this.workflow.registerTask('edit', name, editorOpts)
  return this;
}
TasksUtilHelper.prototype.multiLineInput = function(name, question, save_to, refine, editor) {
  //var q = grunt.config.process(question)
  var tempFile = temp.path({suffix: '.mutiline'})
  if (fs.existsSync(question)) {
    TasksTemplate(this.workflow).generateFile('mulitline_'+name, question, tempFile)
  } else {
    TasksTemplate(this.workflow).writeFile('mulitline_'+name, tempFile, function (grunt) {
      var pQuestion = grunt.config.process(question)
      if (pQuestion===question) {
        pQuestion = '# '+question+'\n\n'
      }
      return pQuestion
    })
  }
  // --
  var editorOpts = {
    'options': {
      file: tempFile,
      editor: editor || null
    }
  }
  this.workflow.registerTask('edit', name, editorOpts)
  // --
  var readfiletoconfigOpts = {
    'options': {
      file: tempFile,
      save_to: save_to || 'run.multiline.' + name,
      exclude: /^\s*#/,
      refine: refine
    }
  }
  this.workflow.registerTask('readfiletoconfig', name, readfiletoconfigOpts)
  return this;
}
TasksUtilHelper.prototype.chooseOption = function(name, question, choices, saveTo, refine) {
  var chooseOptionOpts = {
    'options': {
      question: question,
      choices: choices,
      saveTo: saveTo,
      refine: refine
    }
  }
  this.workflow.registerTask('chooseoption', name, chooseOptionOpts)
  return this;
}



module.exports = TasksUtilHelper;
