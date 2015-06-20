# project-bin-publish

Bump the version and realize steps to help you to publish your project on github, npm.

#### In details

- Fetch `repository.url`
- Checkout `publish.branch`
- Gather version upgrade
- Gather release log
- Update `CHANGELOG.md`
- Ensure `.gitingore` is correct
- Git commit with `<%=releaseType%> v<%=newRevision%>`
- Git tag with `<%=newRevision%> -m <%=releaseLog%>`
- Git push
- Npm publish, if the package is not private
- If `github` auth is provided, create a github tag

## Installation

```sh
$ npm i project-bin-publish -g
```

## Usage

```
    # Publish a node project.
    project-publish
    
    # Version
    project-publish -v
    
    # Help
    project-publish -h
```

## Configuration

On __Project Root__ directory or within your __User Home__ directory.

Or both to override some settings.

Create a new file ```.local.json``` and adjust this content.

```json
{
	"profileData":{
        "github":{
          "username":"TO UPDATE",
          "password":"TO UPDATE"
        },
        "publish":{
          "branch":"master"
        }
	}
}
```

## TODO

- add bitbucket support
- add new-relic support
- add automatic test validation prior to release updgrade procedure support

## How to contribute

1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
