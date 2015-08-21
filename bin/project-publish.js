#!/usr/bin/env node

var util = require("util");
var cliargs = require('cliargs');
var path = require('path');
var _ = require('underscore');
var pkg = require('../package.json');
var Tasks = require('../lib/tasks-helper.js')

var TasksWorkflow = require('../lib/tasks-workflow.js')
var TasksFile = require('../lib/tasks-file-helper.js')
var TasksTemplate = require('../lib/tasks-template-helper.js')
var TasksGit = require('../lib/tasks-git-helper.js')
var TasksGh = require('../lib/tasks-gh-helper.js')
var TasksUtils = require('../lib/tasks-utils-helper.js')

util.inherits(TasksWorkflow, TasksFile);
util.inherits(TasksWorkflow, TasksGit);
util.inherits(TasksWorkflow, TasksGh);
util.inherits(TasksWorkflow, TasksTemplate);
util.inherits(TasksWorkflow, TasksUtils);

var argsObj = cliargs.parse();

if(argsObj.help || argsObj.h){
  // to be done
  process.exit(1 /* ? is correct ? */);
}

if(argsObj.version){
  console.log('%s %s', pkg.name, pkg.version);
  process.exit(1 /* ? is correct ? */);
}

var wdPath = argsObj.path || argsObj.p || process.cwd();
wdPath = path.resolve(wdPath)+'/';

var noCommit = 'nocommit' in argsObj || 'n' in argsObj;
var noPush = 'nopush' in argsObj;
var noVCS = 'novcs' in argsObj;


require('grunt2bin')({
  // -
  config: function(grunt, cwd){
    grunt.loadNpmTasks('grunt-template')
    grunt.loadTasks('tasks')

    var cwdPkg = require(cwd + '/package.json')
    // -
    grunt.initConfig({
      'global': {
        'default_author' : '',
        'author' : '',
        'repository' : '',
        'vcs' : 'git',
        'ci' : 'travis',
        'linter' : 'eslint',
        'projectVersion' : '0.0.1',
        'projectName' : cwdPkg.name || path.basename(wdPath),
        'init_message' : 'init <% global.projectName %> project',
        'description' : '',
        'keywords' : '',
        'node_pkg': {
          'entry': 'main.js',
          'packages':[],
          'devPackages':[]
        },
        'bower': {
          'ignore': []
        },
        'travis': {
          'versions': [process.version]
        }
      },
      'run': {
        'cwd': cwd
      }
    })
    // -
    grunt.setUserGruntfile('project-publish.js')
  },
  // -
  run: function(grunt, cwd){

    var main = new TasksWorkflow()

    var cwdPkg = require(cwd + '/package.json')

    // -------------------------- proper config.
    TasksWorkflow(
    ).getGitConfig('get_vcs_config',
      'user.name', 'global.default_author', true
    ).skipLastTask(grunt.config.get('global.vcs')!=='git'
    ).ensureValues('global_required_config',[
        {var:'global.author', default:'<%=global.default_author%>'},
        {var:'global.repository', default:'http://github.com/<%=global.author%>/<%=global.projectName%>'}
      ]
    ).packToTask('proper_config',
    'Ensure author and repository configuration values exists.'
    ).appendTo(main);

    // -------------------------- vcs is clean
    TasksWorkflow(
    ).getGitStatus('get_git_status', {}
    ).ensureValuesMatch('git_is_clean', [
        {var: 'global.run.git_status', patttern:/git is clean/}
      ]
    ).skipLastTask(grunt.config.get('global.vcs')!=='git'
    ).packToTask('vcs_is_clean',
      'Ensure the status of current vcs is clean (not in progress of merge, or uncommitted changes).'
    ).appendTo(main);

    // -------------------------- vcs setup
    TasksWorkflow(
    ).gitFetch('vcs_fetch', {}
    ).gitCheckout('vcs_checkout', {}
    ).gitPull('vcs_pull', {}
    ).packToTask('vcs_setup',
      'Fetch remote repository, checkout the release branch, pull remote.'
    ).appendTo(main);


    // -------------------------- change log
    TasksWorkflow(
    ).spawnProcess('cl_commits', {
        cmd: 'changlog-maker',
        saveTo: 'global.changelog_commits'
      }
    ).multiLineInput('cl_review', __dirname + '/templates/review_log.tpl',
      'global.changelog_review',
      function (s) {}
    ).chooseOption('cl_revision', listReleaseTypes( cwdPkg.version ), function(release){
        var releaseType = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[1];
        grunt.config.set('global.releaseType', releaseType);
        var newRevision = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[2];
        grunt.config.set('global.newRevision', newRevision);
        grunt.config.set('global.releaseTitle', releaseType + ' ' + newRevision);
      }
    ).generateContent('cl_content', __dirname + '/templates/release_log.tpl',
      'global.changelog_content',
      function (s) {}
    ).prependToFile('cl_write_content', 'CHANGELOG.md', '<%=global.changelog_content%>',
      'global.changelog_content',
      function (s) {}
    ).packToTask('change_log',
      'Generates change log commits, ' +
      'gather change review and revision change, ' +
      'then generates and update CHANGELOG.md file.'
    ).appendTo(main);


    // -------------------------- bump versions
    TasksWorkflow(
    ).mergeJSONFile('bump_node', 'package.json', {
        version: '<%=global.newRevision%>'
      }
    ).mergeJSONFile('bump_bower', 'bower.json', {
        version: '<%=global.newRevision%>'
      }
    ).prependToFile('bump_ver', 'version', '<%=global.releaseTitle%>'
    ).packToTask('bump',
      'Given revision change, update package.json and bower.json file, if they exist.'
    ).appendTo(main);


    // -------------------------- vcs apply
    TasksWorkflow(
    ).gitAdd('vcs_add', '<%=run.vcs.add %>'
    ).gitCommit('vcs_commit', '<%=global.releaseTitle%>'
    ).skipLastTask(!!noCommit
    ).gitTag('vcs_tag', {tag: '<%=global.newRevision%>', message: '<%=global.releaseTitle%>'}
    ).gitPush('vcs_push', {tags:true}
    ).skipLastTask(!!noPush
    ).skipAll(grunt.config.get('global.vcs')!=='git'
    ).skipAll(!!noVCS
    ).packToTask('vcs_apply',
      'Commit the changes, create a new vcs tag, push the changes on the remote.'
    ).appendTo(main);

    // -------------------------- github release
    TasksWorkflow(
    ).ghRelease('svcs_release',
      '<%=global.repository%>',
      '<%=global.newRevision%>',
      '<%=global.releaseTitle%>',
      {password: ''}
    ).skipAll(!!noVCS
    ).packToTask('svcs_release',
      'Create a release on github social network.'
    ).appendTo(main);

    // -------------------------- npm publish
    TasksWorkflow(
    ).spawnProcess('npm_exec',
      'npm publish'
    ).skipAll(!!noVCS
    ).packToTask('npm_publish',
      'Publish package to npm.'
    ).appendTo(main);


    // that s it.
    //grunt.registerTask('default', programTasks)
    return main
  }
})

function listReleaseTypes(currentRevision){

  var semver = require('semver');

  var releaseTypes = [
    "same",
    "major",
    "premajor",
    "minor",
    "preminor",
    "patch",
    "prepatch",
    "prerelease"
  ];
  releaseTypes.forEach(function(t, i){
    var r = t=="same"?currentRevision:semver.inc(currentRevision, t);
    releaseTypes[i] = ("_         " + t).slice(t.length)+' => '+r;
  });
  return releaseTypes;
}
