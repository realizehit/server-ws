# realizehit-websocket-server

realizehit websocket server


## Installation

#### NPM
```bash
$ npm i -g realizehit-websocket-server
$ DEBUG=* realizehit-websocket-server

realizehit:WebSocketServer: listening on port 8080
realizehit:RestServer: listening on port 3000
```

#### Docker
```bash
$ docker build -t realizehit/websocket-server .
$ docker run -d -p 80:8080 81:3000 realizehit/websocket-server
```

## Environment Variables

So here is a list of appliable variables:

`SERVER_HOST` - Defaults to `0.0.0.0`

`SERVER_WEBSOCKET_PORT`- Defaults to `8080`

`ENDPOINT_HOST`- Defaults to `localhost`

Here you should define the host of the public accessible endpoint, in our case
its our load-balancer's hostname.

`ENDPOINT_WEBSOCKET_PORT` - Defaults to `SERVER_WEBSOCKET_PORT`

Here you should define the configured port of the public accessible endpoint, in
our case its... I won't tell! :)
