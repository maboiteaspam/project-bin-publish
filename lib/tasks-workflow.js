
var TasksWorkflow = function (){
  var self = this
  if (!(self instanceof TasksWorkflow)) return new TasksWorkflow()

  this.tasks = [];
}
TasksWorkflow.prototype.replaceTask = function (name, newTasks, newConfig) {
  this.tasks.forEach(function(task){
    if (task.name===name) {
      task.tasks = newTasks
      task.config = newConfig
    }
  })
  return this;
}
TasksWorkflow.prototype.skipTask = function (name, onlyIf) {
  if (onlyIf) {
    var i = -1
    this.tasks.forEach(function(task){
      if (task.name===name) {
        task.tasks = []
      }
    })
    if (i>-1) {
      var task = this.tasks.splice(i, 1)
    }
  }
  return this;
}
TasksWorkflow.prototype.skipLastTask = function (onlyIf) {
  if (onlyIf) {
    this.tasks.pop()
  }
  return this;
}
TasksWorkflow.prototype.skipAll = function (onlyIf) {
  if (onlyIf) {
    this.tasks = []
  }
  return this;
}
TasksWorkflow.prototype.registerTask = function (task, target, opts) {
  var gruntconfig = {}
  gruntconfig[task] = {}
  gruntconfig[task][target] = opts
  return this.appendTask({
    name: task+':' + target,
    config: gruntconfig,
    tasks: []
  });
}
TasksWorkflow.prototype.appendTask = function (task) {
  if (!task.tasks) task.tasks = []
  if (!task.config) task.config = {}
  this.tasks.push(task)
  return this;
}

TasksWorkflow.prototype.packToTask = function (name, description) {
  var tasks = [].concat(this.tasks)
  var g = {
    global: {descriptions: {}}
  }
  g.global.descriptions[name] = description || 'description not provided.';
  this.tasks = [{
    name: name,
    tasks: tasks,
    config: g
  }]
  return this;
}
TasksWorkflow.prototype.appendTo = function (workflow) {
  this.tasks.forEach(function(task){
    workflow.appendTask(task)
  })
  return this;
}

TasksWorkflow.prototype.unwindTasks = function () {
  var flatternTasks = []
  var unwind = function(task){
    task.tasks.forEach(function(task){
      unwind(task)
      flatternTasks.push({name: task.name, config:task.config})
    })
  }
  this.tasks.forEach(function(task){
    unwind(task)
  })
  return flatternTasks;
}
TasksWorkflow.prototype.tasksName = function () {
  var names = []
  this.tasks.forEach(function(task){
    names.push(task.name)
  })
  return names;
}
TasksWorkflow.prototype.registerTo = function (grunt, mainTask) {
  this.unwindTasks().forEach(function(task){
    grunt.config.merge(task.config)
    grunt.registerTask(task.name, task.tasks)
  })
  grunt.registerTask(mainTask, this.tasksName())
  return this;
}

module.exports = TasksWorkflow;
