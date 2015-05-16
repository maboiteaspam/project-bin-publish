
var fs = require('fs');
var path = require('path');
var Cluc = require('cluc');
var Transport = Cluc.transports.process;

var projectPath = process.cwd();
var pkg = require(path.join(projectPath, 'package.json') );
var gitAuth = require(path.join(projectPath, 'github.json') );
var pubConfig = require(path.join(projectPath, '.pub.json') );

var branch = pubConfig.branch || 'master';
var releaseTypes = listReleaseTypes( pkg.version );
var newRevision;
var releaseType;
var sshUrl = pkg.repository.url.replace(/https?:\/\//,'ssh://git@');

//region Git auth and github release
function sendGhAuth(context){
  context.answer(/^Username/i, gitAuth.username);
  context.answer(/^Password/i, gitAuth.password);
}

function gitHubRelease(branch, reponame, tagname, releaseType, then){

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
    //name: "node-github-name",
    //body: "node-github-body",
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


var line = new Cluc()

  .ensureFileContains('.gitignore', '\n.idea/\n')
  .ensureFileContains('.gitignore', '\ngithub.json\n')

  .then(function(next){
    if(!pkg.name){
      throw 'pkg.name is missing';
    }
    if(!pkg.repository){
      throw 'pkg.repository is missing';
    }
    this.saveValue('pkgName', pkg.name);
    this.saveValue('pkgRepository', pkg.repository);
    this.saveValue('sshUrl', sshUrl);
    this.saveValue('projectPath', projectPath);
    this.saveValue('branch', branch);
    next();

  }).choose('Select a revision type', releaseTypes, function(release){
    releaseType = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[1];
    newRevision = release.match(/^\s*([a-z]+)\s*=>\s*(.+)$/i)[2];
    this.saveValue('releaseType', releaseType);
    this.saveValue('newRevision', newRevision);

  }).title('', 'Release project\non <%=branch%> to <%=releaseType%> <%=newRevision%>')
  .stream('cd <%=projectPath%>', function(){
    this.display();
    this.dieOnError();

  }).stream('git status', function(){
    this.must(/(est propre|is clean)/ig, 'Tree should be clean')
      .or(line.confirmToStop('Tree is unclean, stop now ?', true));

  }).stream('git fetch <%=sshUrl%>', function(){
    sendGhAuth(this);
    this.display();

  }).stream('git checkout <%=branch%>', function(){
    sendGhAuth(this);
    this.display();

  }).then(function(next){
    pkg.version = this.getValue('newRevision');
    var releaseType = this.getValue('releaseType');
    if( releaseType!=='same'){
      fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2)+'\n');
      fs.writeFileSync('./version', releaseType+' '+pkg.version+'\n');
    }
    next();

  }).stream('git pull <%=sshUrl%> <%=branch%>', function(){
    sendGhAuth(this);
    this.display();

  }).stream('git add -A', function(){
    sendGhAuth(this);
    this.display();

  }).stream('git commit -am "Publish <%=releaseType%> <%=newRevision%>"', function(){
    this.success(/\[([\w-]+)\s+([\w-]+)]/i,
      'branch\t\t%s\nnew revision\t%s');
    this.success(/([0-9]+)\s+file[^0-9]+?([0-9]+)?[^0-9]+?([0-9]+)?/i,
      'changed\t%s\nnew\t\t%s\ndeleted\t%s');
    this.warn(/(est propre|is clean)/i, 'Nothing to do');
    sendGhAuth(this);
    this.display();

  }).stream('git -c core.askpass=true push <%= sshUrl %> <%= branch %>', function(){
    this.warn(/fatal:/);
    this.success(/(:<remoteRev>[\w-]+)[.]+(:<localRev>[\w-]+)\s+(:<remoteBranch>[\w-]+)\s+->\s+(:<localBranch>[\w-]+)/,
      'pushed\nlocal\tlocalBranch@localRev\nremote\tremoteBranch@remoteRev');
    this.success('Everything up-to-date');
    sendGhAuth(this);
    this.display();

  }).skip(pkg.private).stream('npm publish', function(){
    this.warn(/fatal:/);
    this.success(/(:<remoteRev>[\w-]+)[.]+(:<localRev>[\w-]+)\s+(:<remoteBranch>[\w-]+)\s+->\s+(:<localBranch>[\w-]+)/,
      'pushed\nlocal\tlocalBranch@localRev\nremote\tremoteBranch@remoteRev');
    this.success('Everything up-to-date');
    sendGhAuth(this);
    this.display();

  }).skip(!pubConfig.github).then(function(then){
    var tagname = this.getValue('newRevision');
    var releaseType = this.getValue('releaseType');
    gitHubRelease(branch, pkg.name, tagname, releaseType, then);

  }).title('', '\nAll done !\n\n' +
  'Published <%=pkgName%>\n' +
  'on <%=branch%> to <%=releaseType%> <%=newRevision%>\n')

  .run(new Transport());
