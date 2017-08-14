# Flappy Ascend

This is a stand game to harvest our new recruits for our next years team.

## Explanation

This game reqiures one host server, and a lot of clients. The game works like this:

There are pins, which controlls who is playing where. Like Kahoot!

Go to /view/{pin} to watch the main event.
- Here you can find all players on the same pin.

Go to /play/{pin} to play on specified pin.
- You will not receive other players data as it causes a lot of traffic and delays.

## Setup

Requires Node.js and Redis. Node also requires `webpack` to build, and if you want a smooth development experience, use `webpack-dev-server` too (which allow inline hot reloading, meaning instant refresh in browser). These can be installed by npm (Node Package Manager):

```bash
$ npm install -g webpack webpack-dev-server
```

Before application starts, run the redis server on port 6379 (default). Mostly, redis can be ran with `redis-server` in the terminal, if it is installed.

Then run `node server.js`. If you are developing, we recommend using `webpack -w` to build the client code on save.
