var EventEmitter = require( 'events' ).EventEmitter
var Redis = require( 'ioredis' )
var assign = require( 'object-assign' )
var http = require( 'http' )
var Subscription = require( './subscription' )
var Client = require( './client' )
var Pattern = Subscription.Pattern
var Promise = require( 'bluebird' )
var EngineIO = require( 'engine.io' )
var pattern2id = require( 'realizehit-pattern-to-id' )

var debug = require( 'debug' )( 'realizehit:ws:server' )

var defaultOptions = {
    httpServer: false,
    httpPort: 8080,
    httpPrefix: '/',
    redis: 'redis://localhost:6379',
}

function WSServer ( options ) {
    if ( ! ( this instanceof WSServer ) ) {
        throw new Error( "Subscription is a constructor, call with `new`" )
    }

    var self = this

    // Setup holders for subscriptions and clients
    this.subscriptions = {}
    this.clients = {}

    options = typeof options === 'object' && options || {}
    options = assign( {}, defaultOptions, options )

    // Setup HTTP server
    this.http =
        options.httpServer ||
        http.createServer().listen( options.httpPort )

    // Setup engine.io server
    var engine = this.engine = EngineIO.attach( this.http, { path: '/ws' })
    engine.on( 'connection', function ( socket ) {
        var client = new Client( socket, self )
        self.emit( 'connection', client )

        client.attachServer( self )
        self.clients[ client.id ] = client

        socket.on( 'close', function () {
            client.deattachServer( self )
            delete self.clients[ client.id ]
        })
    })

    // Setup Redis sub client
    var redis = this.redis = new Redis( options.redis )
    redis.on( 'message', function ( channel, message ) {
        var _id = pattern2id( channel )
        var subscription = this.subscriptions[ _id ]

        if ( ! subscription ) {
            return self.emit( 'error', new Error(
                'Received a redis message and such subscription does not exist'
            ))
        }

        // dispatch to subscription
        subscription.emit( 'message' )
    })

    debug( "Server initialized with options", options )
}

module.exports = WSServer

WSServer.prototype = Object.create( EventEmitter.prototype )

WSServer.prototype.getSubscription = function ( pattern ) {
    var self = this
    var _id = pattern2id( pattern )

    debug( "Gathering subscription for id %s", _id )

    if ( this.subscriptions[ _id ] ) {
        return this.subscriptions[ _id ]
    }

    // seems there's not a subscription, lets create one
    var subscription = new Subscription( pattern )
    subscription.attachServer( self )
    self.subscriptions[ subscription.id ] = subscription

    subscription.on( 'destroy', function () {
        subscription.deattachServer( self )
        delete self.subscriptions[ subscription.id ]
    })

    return subscription
}

WSServer.prototype.getClient = function ( id ) {
    debug( "Gathering client for id %s", id )
    return this.clients[ id ] || false
}

WSServer.prototype.destroy =
WSServer.prototype.close =
WSServer.prototype.terminate =
    function WSServer$destroy () {

        debug( "Attempting to destroy the server" )

        // Change this to `http.listening` once node supports it
        // nodejs/node#4735
        if ( this.http._handle ) {
            this.http.close()
        }

        // Destroy subscriptions
        for ( var i in this.subscriptions ) {
            if ( ! this.subscriptions.hasOwnProperty( i ) ) {
                continue
            }

            var subscription = this.subscriptions[ i ]
            subscription.destroy()
        }

        // Now we can disconnect Redis
        this.redis.disconnect()

        // NOTE: don't know if we really need to destroy clients as we did
        // internaly, so gonna leave this note instead.
    }
