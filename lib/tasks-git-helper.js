
var TasksUtils = require('./tasks-utils-helper.js');
var TasksWorkflow = require('./tasks-workflow.js');

var TasksGitHelper = function (workflow){
  var self = this
  if (!(self instanceof TasksGitHelper)) return new TasksGitHelper(workflow)
  this.workflow = workflow || new TasksWorkflow();
}

TasksGitHelper.prototype.getGitConfig = function(name, gitentry, gruntvar, global) {
  var getGitConfigOpts = {
    'options': {
      entry: gitentry,
      save_to: gruntvar,
      global: !!global
    }
  }
  this.workflow.registerTask('getgitconfig', name, getGitConfigOpts)
  return this;
}
TasksGitHelper.prototype.gitInit = function(name, opts) {
  var gitInitOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitinit', name, gitInitOpts)
  return this;
}
TasksGitHelper.prototype.gitAdd = function(name, files, opts) {
  var gitAddOpts = {
    'options': opts || {},
    files: files
  }
  this.workflow.registerTask('gitadd', name, gitAddOpts)
  return this;
}
TasksGitHelper.prototype.gitCommit = function(name, msg, opts) {
  var gitCommitOpts = {
    'options': opts || {}
  }
  gitCommitOpts.options.message = function (grunt){
    return grunt.config.get(msg)
  }
  this.workflow.registerTask('gitcommit', name, gitCommitOpts)
  return this;
}
TasksGitHelper.prototype.gitPush = function(name, opts) {
  var gitPushOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitpush', name, gitPushOpts)
  return this;
}
TasksGitHelper.prototype.gitTag = function(name, opts) {
  var gitTagOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gittag', name, gitTagOpts)
  return this;
}
TasksGitHelper.prototype.gitCheckout = function(name, opts) {
  var gitCheckoutOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitcheckout', name, gitCheckoutOpts)
  return this;
}
TasksGitHelper.prototype.gitFetch = function(name, opts) {
  var gitFetchOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitfetch', name, gitFetchOpts)
  return this;
}
TasksGitHelper.prototype.gitPull = function(name, opts) {
  var gitPullOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitpull', name, gitPullOpts)
  return this;
}
TasksGitHelper.prototype.gitGlobalExcludesFile = function(name, opts) {
  var gitGlobalExcludesFileOpts = {
    'options': opts || {}
  }
  this.workflow.registerTask('gitglobalexcludesfile', name, gitGlobalExcludesFileOpts)
  return this;
}
TasksGitHelper.prototype.ensureGitExcludes = function(name, excludes, global) {
  var ensureGitExcludesOpts = {
    'options': {
      excludes: excludes || [],
      global : !!global
    }
  }
  this.workflow.registerTask('ensuregitexclude', name, ensureGitExcludesOpts)
  return this;
}
TasksGitHelper.prototype.getGitStatus = function(name, saveTo) {
  saveTo = saveTo || 'global.run.git_status'
  TasksUtils(this.workflow)
    .spawnProcess(name, 'git status', {
      failOnError:true,
      saveTo: saveTo
    })
  return this;
}

module.exports = TasksGitHelper;
