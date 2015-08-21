
var TasksWorkflow = require('./tasks-workflow.js');

var TasksGhHelper = function (workflow){
  var self = this
  if (!(self instanceof TasksGhHelper)) return new TasksGhHelper(workflow)
  this.workflow = workflow || new TasksWorkflow();
}
TasksGhHelper.prototype.ghRelease = function(name, repository, tagname, body, opts) {
  opts = opts || {}

  opts.repository = repository
  opts.tagname = tagname
  opts.body = body

  var ghReleaseOpts = {
    'options': opts
  }
  this.workflow.registerTask('githubrelease', name, ghReleaseOpts)
  return this;
}

module.exports = TasksGhHelper;
