#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var program = require('commander');
var temp = require('temp');
var _ = require('underscore');
var Config = require("project-bin-config");
var Cluc = require('cluc');
var Transport = Cluc.transports.process;


//region Program

var projectPath = process.cwd();
var pkg = require(path.join(projectPath, 'package.json') );

var releaseTypes = listReleaseTypes( pkg.version );
var newRevision;
var releaseType;
var sshUrl;

program
  .version(require(path.join(__dirname, 'package.json') ).version)
  .usage('[env]')
  .description('Publish your project')
  .arguments('[env]')
  .parse(process.argv);


var env = !program.env?'local':program.env;

(new Config()).load().get(env)
  .forEach(function(machine){

    _.defaults(
      machine.profileData,{
        publish:{
          branch:'master'
        }
      });
    _.defaults(
      machine.profileData.publish,{
        branch:'master'
      });

    var pubConfig = machine.profileData.publish || {};

    var line = new Cluc()

      .then(function(next){
        if(!pkg.name){
          throw 'pkg.name is missing';
        }
        if(!pkg.repository){
          throw 'pkg.repository is missing';
        }
        sshUrl = pkg.repository.url.replace(/https?:\/\//,'ssh://git@');
        this.saveValue('pkgName', pkg.name);
        this.saveValue('pkgRepository', pkg.repository);
        this.saveValue('sshUrl', sshUrl);
        this.saveValue('projectPath', projectPath);
        this.saveValue('branch', pubConfig.branch);
        this.saveValue('gitAuth', machine.profileData.github);
        this.saveValue('tmpReleaseLog', temp.path({suffix: '.releaselog'}));
        this.saveValue('releaseLogTpl', path.join(__dirname,'templates','release_log.ejs'));
        next();
      })

      .title('', 'Release project\non <%=branch%>')
      .stream('cd <%=projectPath%>', function(){
        this.display();
        this.dieOnError();
      })
      .subtitle('', 'Fetching from git')
      .stream('git fetch <%=sshUrl%>', function(){
        sendGhAuth(this);
        this.display();
      }).stream('git checkout <%=branch%>', function(){
        sendGhAuth(this);
        this.display();
      }).stream('git pull <%=sshUrl%> <%=branch%>', function(){
        sendGhAuth(this);
        this.display();
      })

      .subtitle('', 'Gather release information')
      .choose('Select a revision type', releaseTypes, function(release){
        releaseType = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[1];
        newRevision = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[2];
        this.saveValue('releaseType', releaseType);
        this.saveValue('newRevision', newRevision);
      }).exec('changelog-maker', function(err, stdout){
        this.saveValue('releaseCommits', stdout);
      }).generateTemplate('<%=releaseLogTpl%>', '<%=tmpReleaseLog%>', {releaseCommits:'<%=releaseCommits%>'}, function(){
      }).textedit('Write the release log', '<%=tmpReleaseLog%>', function(changelog){
        this.saveValue('releaseLog', changelog+'\n');
      }).stream('git commit -am "<%=quote("releaseLog")%>"', function(){
        this.success(/\[([\w-]+)\s+([\w-]+)]/i,
          'branch\t\t%s\nnew revision\t%s');
        this.success(/([0-9]+)\s+file[^0-9]+?([0-9]+)?[^0-9]+?([0-9]+)?/i,
          'changed\t%s\nnew\t\t%s\ndeleted\t%s');
        this.warn(/(est propre|is clean)/i, 'Nothing to do');
        sendGhAuth(this);
        this.display();
      }).prependFile('CHANGELOG.md', '<%=releaseLog%>\n')

      .subtitle('', 'prepare .gitignore, write version')
      .ensureFileContains('.gitignore', '\n.local.json\n')
      .ensureFileContains('.gitignore', '\n.idea/\n')
      .then(function(next){
        pkg.version = this.getValue('newRevision');
        var releaseType = this.getValue('releaseType');
        if( releaseType!=='same'){
          fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2)+'\n');
          fs.writeFileSync('./version', releaseType+' '+pkg.version+'\n');
        }
        next();
      })

      .subtitle('', 'git add, commit, tag, push')
      .stream('git add -A', function(){
        sendGhAuth(this);
        this.display();
      }).stream('git commit -am "<%=releaseType%> v<%=newRevision%>"', function(){
        this.success(/\[([\w-]+)\s+([\w-]+)]/i,
          'branch\t\t%s\nnew revision\t%s');
        this.success(/([0-9]+)\s+file[^0-9]+?([0-9]+)?[^0-9]+?([0-9]+)?/i,
          'changed\t%s\nnew\t\t%s\ndeleted\t%s');
        this.warn(/(est propre|is clean)/i, 'Nothing to do');
        sendGhAuth(this);
        this.display();
      }).stream('git tag -a <%=newRevision%> -m <%=quote("releaseLog")%>', function(){
        this.display();
      }).stream('git push <%=sshUrl%> <%=newRevision%>', function(){
        this.display();
      }).stream('git -c core.askpass=true push <%= sshUrl %> <%= branch %>', function(){
        this.warn(/fatal:/);
        this.success(/(:<remoteRev>[\w-]+)[.]+(:<localRev>[\w-]+)\s+(:<remoteBranch>[\w-]+)\s+->\s+(:<localBranch>[\w-]+)/,
          'pushed\nlocal\tlocalBranch@localRev\nremote\tremoteBranch@remoteRev');
        this.success('Everything up-to-date');
        sendGhAuth(this);
        this.display();
      })

      .when(!pkg.private, function(line){
        line.stream('npm publish', function(){
          this.display();
        });
      }).when(machine.profileData.github, function(line){
        line.title('', 'Creating github tag')
          .then(function(then){
            var tagname = this.getValue('newRevision');
            var releaseType = this.getValue('releaseType');
            var branch = this.getValue('branch');
            var body = this.getValue('releaseLog')+'';
            gitHubRelease(this, branch, pkg.name, tagname, releaseType, body, then);
          });
      }).title('', '\nAll done !\n\n' +
      'Published <%=pkgName%>\n' +
      'on <%=branch%> to <%=releaseType%> <%=newRevision%>\n')

      .run(new Transport());

  });

//endregion




//region Git auth and github release

function sendGhAuth(context){
  var gitAuth = context.getValue('gitAuth');
  if(gitAuth){
    context.answer(/^Username/i, gitAuth.username);
    context.answer(/^Password/i, gitAuth.password);
  }
}

function gitHubRelease(context, branch, reponame, tagname, releaseType, body, then){
  var gitAuth = context.getValue('gitAuth');
  var ghClient = require('github');

  reponame = reponame || gitAuth.repo;
  var username = gitAuth.owner || gitAuth.username;
  var ghApi = new ghClient({
    version: "3.0.0"
  });
  ghApi.authenticate({
    type: "basic",
    username: username,
    password: gitAuth.password
  });
  ghApi.releases.createRelease({
    owner: username,
    repo: reponame,
    tag_name: tagname,
    target_commitish: branch,
    name: tagname,
    body: '\n'+body,
    //draft: false,
    prerelease: releaseType==='prerelease'
  }, then);
}

//endregion




//region release helper

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

//endregion
