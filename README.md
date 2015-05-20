# realizehit-socket-server

realizehit socket server


## Installation

#### NPM
```bash
npm i -g realizehit-socket-server
DEBUG=* realizehit-socket-server
```

#### Docker
```bash
docker build -t realizehit/socket-server .
docker run -d -p 80:8080 81:3000 realizehit/socket-server
```

## Environment Variables

So here is a list of appliable variables:

`SERVER_HOST` - Defaults to `0.0.0.0`

`SERVER_SOCKET_PORT`- Defaults to `8080`

`ENDPOINT_HOST`- Defaults to `localhost`

Here you should define the host of the public accessible endpoint, in our case
its our load-balancer's hostname.

`ENDPOINT_SOCKET_PORT` - Defaults to `SERVER_SOCKET_PORT`

Here you should define the configured port of the public accessible endpoint, in
our case its... I won't tell! :)
