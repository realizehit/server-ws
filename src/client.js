var EventEmitter = require( 'events' ).EventEmitter
var uniqid = require( 'uniqid' )
var Promise = require( 'bluebird' )
var pattern2id = require( 'realizehit-pattern-to-id' )

var debug = require( 'debug' )( 'realizehit:server-ws:client' )

function Client ( socket ) {
    var self = this

    this.socket = socket
    this.id = socket.id

    // Setup holder for subscriptions
    this.subscriptions = {}

    // Message actionDispatcher
    socket.on( 'message', function ( rawMessage ) {
        var id // this should stick as closure for beeing used inside the promise

        Promise.cast( rawMessage )
        .then( JSON.parse )
        .tap(function ( parsedMessage ) {
            id = parsedMessage.id || uniqid()
        })
        .then( self.actionDispatcher.bind( self ) )
        .then(
            function ( value ) {
                return {
                    id: id,
                    ret: value || undefined,
                }
            },
            function ( err ) {
                return {
                    id: id,
                    err: err && err.message || undefined,
                }
            }
        )
        .then( JSON.stringify )
        .then( socket.send.bind( socket ) )
    })

    // unsubscribe from all subscriptions
    socket.on( 'close', function () {
        Object.keys( self.subscriptions )
        .forEach(function ( id ) {
            var subscription = self.subscriptions[ id ]

            self.unsubscribe( subscription )
        })
    })

    debug( "Client initialized with id", this.id )
}

Client.prototype = Object.create( EventEmitter.prototype )
module.exports = Client


Client.prototype.actionDispatcher = function ( message ) {
    switch( message.act ) {
        case 'sub':
            return this.subscribe( message.pat )

        case 'unsub':
            return this.unsubscribe( message.pat )

        case 'ping':
            return 'pong'
    }

    return Promise.reject( new Error( "Unable to attend request" ) )
}

Client.prototype.payloadDispatcher = function ( subscription, payload ) {
    this.socket.send(
        subscription.id +
        this.server.options.subpayJoinerChar +
        payload
    )
}

Client.prototype.subscribe = function ( pattern ) {
    var self = this

    // this should first stick / trigger a subscription
    var subscription = this.server.getSubscription( pattern )

    // call for attachClient on it
    return subscription.attachClient( self )

    // if it was successful, attatchSubscription here
    .then(function () {
        return self.attachSubscription( subscription )
    })
}

Client.prototype.unsubscribe = function ( pattern ) {
    var self = this
    var _id = pattern2id( pattern )

    // this should fetch an already subscribed on self.subscriptions
    var subscription = self.subscriptions[ _id ]

    return Promise.try(function () {
        if ( ! subscription ) {
            throw new Error( 'We did not found a subscription on this client' )
        }
    })

    // call for deattachClient on it
    .then(function () {
        return subscription.deattachClient( self )
    })

    // if it was successful, deattatchSubscription from here
    .then(function () {
        return self.attachSubscription( subscription )
    })
}

Client.prototype.disconnect = function () {
    this.socket.end()
}

Client.prototype.attachServer = function ( server ) {
    this.server = server
}

Client.prototype.deattachServer = function ( server ) {
    delete this.server
}

Client.prototype.attachSubscription = function ( subscription ) {
    this.subscriptions[ subscription.id ] = subscription
}

Client.prototype.deattachSubscription = function ( subscription ) {
    delete this.subscriptions[ subscription.id ]
}
