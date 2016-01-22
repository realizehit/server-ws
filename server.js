var WSServer = require( './' )
var env = process.env

var REDIS_URI = env.REDIS_URI || 'redis://localhost:6379'
var HTTP_PORT = env.SERVER_WS_PORT || 8080
var HTTP_HOST = env.SERVER_HOST || '0.0.0.0'
var ENDPOINT = env.ENDPOINT_WS || 'ws://' + HTTP_HOST + ':' + HTTP_PORT + '/ws'

var server = new WSServer({
    httpPort: HTTP_PORT,
    redis: REDIS_URI
})

console.log( 'Server initialized on port ' + HTTP_PORT )
console.log( 'It should be accessed over ' + ENDPOINT )
