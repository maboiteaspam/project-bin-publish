
var TasksWorkflow = require('./tasks-workflow.js');

var TasksFileHelper = function (workflow){
  var self = this
  if (!(self instanceof TasksFileHelper)) return new TasksFileHelper(workflow)
  this.workflow = workflow || new TasksWorkflow();
}

TasksFileHelper.prototype.ensureGitExcludes = function(name, excludes, global) {
  var ensureGitExcludesOpts = {
    'options': {
      excludes: excludes || [],
      global : !!global
    }
  }
  this.workflow.registerTask('ensuregitexclude', name, ensureGitExcludesOpts)
  return this;
}

TasksFileHelper.prototype.appendToFile = function(name, file, content) {
  var appendToFileOpts = {
    'options': {
      file: file,
      mode: 'append',
      content: content
    }
  }
  this.workflow.registerTask('writefile', name, appendToFileOpts)
  return this;
}
TasksFileHelper.prototype.prependToFile = function(name, file, content) {
  var prependToFileOpts = {
    'options': {
      file: file,
      mode: 'prepend',
      content: content
    }
  }
  this.workflow.registerTask('writefile', name, prependToFileOpts)
  return this;
}
TasksFileHelper.prototype.writeFile = function(name, file, content) {
  var prependToFileOpts = {
    'options': {
      file: file,
      mode: 'replace',
      content: content
    }
  }
  this.workflow.registerTask('writefile', name, prependToFileOpts)
  return this;
}
TasksFileHelper.prototype.mergeJSONFile = function(name, jsonfile, data) {
  var mergeJSONFileOpts = {
    options: {
      file: jsonfile,
      data: data
    }
  }
  this.workflow.registerTask('merge-jsonfile', name, mergeJSONFileOpts)
  return this;
}
TasksFileHelper.prototype.jsonFormat = function(name, jsonfile) {
  var mergeJSONFileOpts = {
    options: {
      infile: jsonfile
    }
  }
  this.workflow.registerTask('jsonformat', name, mergeJSONFileOpts)
  return this;
}

module.exports = TasksFileHelper;
