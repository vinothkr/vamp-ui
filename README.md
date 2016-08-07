# Vamp UI

[![Build Status](https://travis-ci.org/magneticio/vamp-ui.svg?branch=master)](https://travis-ci.org/magneticio/vamp-ui)

## How to start up Vamp frontend

First clone the frontend with git. Master branch should be checked out.

### Development

1) Install all the dependencies using bower and npm:

```sh
$ npm install -g gulp gulp-cli
$ npm install
$ bower install
```

2) First set the environment variables. [baseURL] should be the url that the frontend is running on.

```sh
$ ./setEnvironment.sh [baseUrl]

# example

$ ./setEnvironment.sh 192.168.99.100:8080
```

3) Then serve the frontend with gulp. Gulp will set up a web server with all the goodies like `browsersync` etc.

```sh
$ gulp serve
```

### Release

1) Install all the dependencies using bower and npm:

```sh
$ npm install -g gulp gulp-cli
$ npm install
$ bower install
```

2) First set the environment variables. By default `window.location.origin` will be used for backend endpoint which makes sense because UI files are served by Vamp itself.

```sh
$ ./setEnvironment.sh
```

3) Then build the frontend with gulp. Gulp will make a `build` directory and all the files can be found there.

```sh
$ gulp build
```

### Building Docker image with Vamp and Vamp UI

```sh
$ git clone https://github.com/magneticio/vamp-docker.git
$ cd vamp-docker
$ ./build.sh -c -b -i=quick-start

# let's run it

$ ./run.sh quick-start
```