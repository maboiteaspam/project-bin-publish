
var temp = require('temp').track();
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var _ = require('underscore');


var TasksHelper = function (grunt){
  var self = this
  if (!(self instanceof TasksHelper)) return new TasksHelper(grunt)

  this.grunt = grunt;
  this.tasks = [];
}
TasksHelper.prototype.replaceTask = function (name, newTasks) {
  this.grunt.registerTask(name, newTasks)
  this.tasks.forEach(function(task){
    if (task.name===name) {
      task.tasks = []
    }
  })
  return this;
}
TasksHelper.prototype.skipTask = function (name, onlyIf) {
  if (onlyIf) {
    var grunt = this.grunt
    var i = -1
    this.tasks.forEach(function(task){
      if (task.name===name) {
        task.tasks = []
      }
    })
    if (i>-1) {
      var task = this.tasks.splice(i, 1)
      delete grunt.task._tasks[task.name]
    }
  }
  return this;
}
TasksHelper.prototype.skipLastTask = function (onlyIf) {
  if (onlyIf) {
    var grunt = this.grunt
    var task = this.tasks.pop()
    delete grunt.task._tasks[task.name]
  }
  return this;
}
TasksHelper.prototype.skipAll = function (onlyIf) {
  if (onlyIf) {
    var grunt = this.grunt
    this.tasks.forEach(function(task){
      delete grunt.task._tasks[task.name]
    })
    this.tasks = []
  }
  return this;
}
TasksHelper.prototype.packToTask = function (name, superTask, description) {
  var grunt = this.grunt
  var tasks = []
  this.tasks.forEach(function(task){
    tasks.push(task.name)
    grunt.registerTask(task.name, task.tasks)
  })
  if (tasks.length) {
    grunt.registerTask(name, tasks)
    superTask.push(name)
  }
  var g = {
    global: {descriptions: {}}
  }
  g.global.descriptions[name] = description || 'description not provided.';
  grunt.config.merge(g)
  this.tasks = []
  return this;
}

TasksHelper.prototype.ensureValues = function(name, vars) {

  var grunt = this.grunt
  var opts = {};
  var tasks = [];

  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    opts[okName] = {
      'options': v
    };
    tasks.push('ensurevar:'+okName)
  })

  grunt.config.merge({
    'ensurevar': opts
  })

  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.ensureValuesDoesNotMatch = function(name, vars) {

  var grunt = this.grunt
  var opts = {};
  var tasks = [];

  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    opts[okName] = {
      'options': v
    };
    tasks.push('ensurevardoesnotmatch:'+okName)
  })

  grunt.config.merge({
    'ensurevardoesnotmatch': opts
  })

  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.ensureValuesMatch = function(name, vars) {

  var grunt = this.grunt
  var opts = {};
  var tasks = [];

  vars.forEach(function(v){
    var okName = v.var.replace(/:/g, '-')
    opts[okName] = {
      'options': v
    };
    tasks.push('ensurevarmatch:'+okName)
  })

  grunt.config.merge({
    'ensurevarmatch': opts
  })

  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}

TasksHelper.prototype.appendToFile = function(name, file, content) {

  var grunt = this.grunt
  var tasks = []

  // --
  var appendToFileOpts = {}
  appendToFileOpts[name] = {
    'options': {
      file: file,
      mode: 'append',
      content: content
    }
  }
  tasks.push('writefile:'+name)

  grunt.config.merge({
    'writefile': appendToFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.prependToFile = function(name, file, content) {

  var grunt = this.grunt
  var tasks = []

  // --
  var prependToFileOpts = {}
  prependToFileOpts[name] = {
    'options': {
      file: file,
      mode: 'prepend',
      content: content
    }
  }
  tasks.push('writefile:'+name)

  grunt.config.merge({
    'writefile': prependToFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.writeFile = function(name, file, content) {

  var grunt = this.grunt
  var tasks = []

  // --
  var prependToFileOpts = {}
  prependToFileOpts[name] = {
    'options': {
      file: file,
      mode: 'replace',
      content: content
    }
  }
  tasks.push('writefile:'+name)

  grunt.config.merge({
    'writefile': prependToFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}

TasksHelper.prototype.generateContent = function(name, template, saveTo, refine) {

  var grunt = this.grunt
  var tasks = []


  // --
  var tempFile = temp.path({suffix: '.mutiline'})
  this.generateFile('mulitline_'+name, template, tempFile)

  // --
  var readfiletoconfigOpts = {}
  readfiletoconfigOpts[name] = {
    'options': {
      file: tempFile,
      save_to: saveTo || 'run.content.' + name,
      refine: refine
    }
  }
  tasks.push('readfiletoconfig:'+name)

  grunt.config.merge({
    'readfiletoconfig': readfiletoconfigOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.generateFile = function(name, template, output) {

  var grunt = this.grunt
  var tasks = []
  var taskOpts = {}

  // --
  var templateOpts = {}
  templateOpts[name] = {
    'options': {
      data: function(){return grunt.config.get();}
    },
    'files': {}
  }
  templateOpts[name].files[output] = [template]
  taskOpts.template = templateOpts

  tasks.push('template:'+name)

  // --
  if (output.match(/json$/)) {
    var jsonFormatOpts = {}
    jsonFormatOpts[name] = {
      'options': {
        infile: output
      }
    }
    taskOpts['jsonformat'] = jsonFormatOpts
    if (output.match(/json$/)) {
      tasks.push('jsonformat:'+name)
    }
  }

  // --
  taskOpts.run = {
    'vcs': {
      add: [output]
    }
  }

  grunt.config.merge(taskOpts)
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.generateDir = function(name, fromDir, toDir) {

  var grunt = this.grunt
  var tasks = []
  var taskOpts = {}

  // --
  var templateOpts = {}
  templateOpts[name] = {
    'options': {
      data: function(){return grunt.config.get();}
    },
    'files': {}
  }
  var files = glob.sync('**/**', {dot: true, cwd: fromDir, nodir: true})
  files.forEach(function (f) {
    templateOpts[name].files[path.join(toDir, f)] = path.join(fromDir, f);
  })
  taskOpts.template = templateOpts
  tasks.push('template:'+name)

  taskOpts.run = {
    'vcs': {
      add: files
    }
  }

  grunt.config.merge(taskOpts)

  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}

TasksHelper.prototype.mergeJSONFile = function(name, jsonfile, data) {

  var grunt = this.grunt
  var tasks = []

  // --
  var mergeJSONFileOpts = {}
  mergeJSONFileOpts[name] = {
    options: {
      file: jsonfile,
      data: data
    }
  }

  tasks.push('merge-jsonfile:' + name)

  grunt.config.merge({
    'merge-jsonfile': mergeJSONFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.jsonFormat = function(name, jsonfile) {

  var grunt = this.grunt
  var tasks = []

  // --
  var mergeJSONFileOpts = {}
  mergeJSONFileOpts[name] = {
    options: {
      infile: jsonfile
    }
  }

  tasks.push('jsonformat:' + name)

  grunt.config.merge({
    'jsonformat': mergeJSONFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.spawnProcess = function(name, cmd, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var spawnProcessOpts = {}
  spawnProcessOpts[name] = {
    options: opts,
    command: cmd
  }

  tasks.push('spawn-process:' + name)

  grunt.config.merge({
    'spawn-process': spawnProcessOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}

TasksHelper.prototype.getGitConfig = function(name, gitentry, gruntvar, global) {

  var grunt = this.grunt
  var tasks = []

  // --
  var getGitConfigOpts = {}
  getGitConfigOpts[name] = {
    'options': {
      entry: gitentry,
      save_to: gruntvar,
      global: !!global
    }
  }

  tasks.push('getgitconfig:' + name)

  grunt.config.merge({
    'getgitconfig': getGitConfigOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitInit = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitInitOpts = {}
  gitInitOpts[name] = {
    'options': opts || {}
  }
  gitInitOpts.gitinit = gitInitOpts

  tasks.push('gitinit:'+name)

  grunt.config.merge({
    'gitinit': gitInitOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitAdd = function(name, files, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitAddOpts = {}
  gitAddOpts[name] = {
    'options': opts || {},
    files: files
  }
  gitAddOpts.gitadd = gitAddOpts

  tasks.push('gitadd:'+name)

  grunt.config.merge({
    'gitadd': gitAddOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitCommit = function(name, msg, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitCommitOpts = {}
  gitCommitOpts[name] = {
    'options': opts || {}
  }
  gitCommitOpts[name].options.message = grunt.config.get(msg)
  gitCommitOpts.gitcommit = gitCommitOpts

  tasks.push('gitcommit:'+name)

  grunt.config.merge({
    'gitcommit': gitCommitOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitPush = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitPushOpts = {}
  gitPushOpts[name] = {
    'options': opts || {}
  }
  gitPushOpts.gitpush = gitPushOpts

  tasks.push('gitpush:'+name)

  grunt.config.merge({
    'gitpush': gitPushOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitTag = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  opts = opts || {}
  var task = {
    config: {},
    name: 'gittag:' + name
  }
  task.config['gittag'] = {}
  task.config['gittag'][name] = {
    'options': opts || {}
  }
  tasks.push(task)

  tasks.forEach(function(task){
    grunt.config.merge(task.config)
  })
  if (tasks.length==1) {
    this.tasks.push(tasks.shift())
  } else {
    this.tasks.push({
      name:name,
      tasks: [].concat(tasks)
    })
  }

  return this;
}
TasksHelper.prototype.gitCheckout = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitPushOpts = {}
  gitPushOpts[name] = {
    'options': opts || {}
  }
  gitPushOpts.gitcheckout = gitPushOpts

  tasks.push('gitcheckout:'+name)

  grunt.config.merge({
    'gitcheckout': gitPushOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitFetch = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitPushOpts = {}
  gitPushOpts[name] = {
    'options': opts || {}
  }
  gitPushOpts.gitfetch = gitPushOpts

  tasks.push('gitfetch:'+name)

  grunt.config.merge({
    'gitfetch': gitPushOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitPull = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitPushOpts = {}
  gitPushOpts[name] = {
    'options': opts || {}
  }
  gitPushOpts.gitpull = gitPushOpts

  tasks.push('gitpull:'+name)

  grunt.config.merge({
    'gitpull': gitPushOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.gitGlobalExcludesFile = function(name, opts) {

  var grunt = this.grunt
  var tasks = []

  // --
  var gitGlobalExcludesFileOpts = {}
  gitGlobalExcludesFileOpts[name] = {
    'options': opts || {}
  }

  tasks.push('gitglobalexcludesfile:'+name)

  grunt.config.merge({
    'gitglobalexcludesfile': gitGlobalExcludesFileOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.ensureGitExcludes = function(name, excludes, global) {

  var grunt = this.grunt
  var tasks = []

  // --
  var ensureGitExcludesOpts = {}
  ensureGitExcludesOpts[name] = {
    'options': {
      excludes: excludes || [],
      global : !!global
    }
  }

  tasks.push('ensuregitexclude:'+name)

  grunt.config.merge({
    'ensuregitexclude': ensureGitExcludesOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.getGitStatus = function(name, saveTo) {
  saveTo = saveTo || 'global.run.git_status'
  this.spawnProcess(name, 'git status', {
    failOnError:true,
    saveTo: saveTo
  })
  return this;
}
TasksHelper.prototype.ghRelease = function(name, repository, tagname, body, opts) {
  opts = opts || {}

  opts.repository = repository
  opts.tagname = tagname
  opts.body = body

  var grunt = this.grunt
  var tasks = []

  // --
  var ghReleaseOpts = {}
  ghReleaseOpts[name] = {
    'options': opts
  }

  grunt.config.merge({
    'githubrelease': ghReleaseOpts
  })
  this.tasks.push({
    name: 'githubrelease:' + name,
    tasks: tasks
  })

  return this;
}

TasksHelper.prototype.editFile = function(name, file, editor) {

  var grunt = this.grunt
  var tasks = []

  // --
  var editorOpts = {}
  editorOpts[name] = {
    'options': {
      file: file,
      editor: editor || null
    }
  }
  tasks.push('edit:'+name)

  grunt.config.merge({
    'edit': editorOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.multiLineInput = function(name, question, save_to, refine, editor) {

  var grunt = this.grunt
  var tasks = []

  question = grunt.config.process(question)

  // --
  var tempFile = temp.path({suffix: '.mutiline'})
  if (fs.existsSync(question)) {
    this.generateFile('mulitline_'+name, question, tempFile)
    tasks.push('mulitline_'+name)
  } else {
    var pQuestion = grunt.config.process(question)
    if (pQuestion===question) {
      pQuestion = '# '+question+'\n\n'
    }
    fs.writeFileSync(tempFile, pQuestion)
  }

  // --
  var editorOpts = {}
  editorOpts[name] = {
    'options': {
      file: tempFile,
      editor: editor || null
    }
  }
  tasks.push('edit:'+name)
  // --
  var readfiletoconfigOpts = {}
  readfiletoconfigOpts[name] = {
    'options': {
      file: tempFile,
      save_to: save_to || 'run.multiline.' + name,
      exclude: /^\s*#/,
      refine: refine
    }
  }
  tasks.push('readfiletoconfig:'+name)

  grunt.config.merge({
    'edit': editorOpts,
    'readfiletoconfig': readfiletoconfigOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}
TasksHelper.prototype.chooseOption = function(name, question, choices, saveTo, refine) {

  var grunt = this.grunt
  var tasks = []

  // --
  var chooseOptionOpts = {}
  chooseOptionOpts[name] = {
    'options': {
      question: question,
      choices: choices,
      saveTo: saveTo,
      refine: refine
    }
  }
  tasks.push('chooseoption:'+name)

  grunt.config.merge({
    'chooseoption': chooseOptionOpts
  })
  this.tasks.push({
    name:name,
    tasks: tasks
  })

  return this;
}

module.exports = TasksHelper;
