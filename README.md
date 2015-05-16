# project-bin-publish

Bump the version and realize steps to help you to publish your project on github, npm.

# Install

```sh
npm i project-bin-publish -g
```

# Usage

```sh
  Usage: project-publish [env]

  Publish your project

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

# Configuration

Create a ```.local.json``` file on root directory of your project.

```json
{
  "profileData":{
    "github":{
      "username":"TO UPDATE",
      "password":"TO UPDATE"
    },
    "publish":{
      "branch":"TO UPDATE"
    }
  }
}
```

```project-bin-publish``` will ensure ```.local.json``` file 
is added to ```.gitignore``` file.
