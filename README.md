# Flappy Ascend

This is a stand game to harvest our new recruits for our next years team.

## Setup

### With docker-compose

```bash
# Will install dependencies into ./node_modules and build app
$ docker-compose run build

# Runs both redis and the app. Data is stored in the ./data folder
$ docker-compose up app

# You can choose port by adding DOCKER_PORT=4321 to the ./.env file
# or by writing `DOCKER_PORT=4321 docker-compose up app`.
```

See the `docker-compose.yml` file for further details.

### With docker

```bash
$ docker build -t flappy_ascend_image .
$ docker run -d -p 8080:8080 --name flappy_ascend flappy_ascend_image
```

### Without docker (preferred in development)

Requires Node.js and Redis locally.

Before application starts, run the redis server on port 6379 (default). Mostly, Redis can be ran with `redis-server` in the terminal, if it is installed.

Then run `node server.js`. If you are developing, we recommend using `webpack -w` to build the client code on save. If you want to use one command for everything, install `npm-run-all` through `npm`, and run:

```
$ npm-run-all --parallell server watch
```
