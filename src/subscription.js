var RHSubscription = require( 'realizehit-subscription' )
var Promise = require( 'bluebird' )

var debug = require( 'debug' )( 'realizehit:server-ws:subscription' )

function Subscription ( pattern ) {
    var self = this

    // Init it with realizehit-subscription
    RHSubscription.call( this, pattern )

    // Count how many payloads have we served
    self.payloads = 0
    this.on( 'payload', function ( payload ) {
        self.payloads++

        // Re-emit payloads to all clients
        Promise.cast( Object.keys( self.clients ) )
        .each(function ( clientId ) {
            var client = self.clients[ clientId ]
            client.payloadDispatcher( self, payload )
        })
    })

    // Prepare object for bindings with clients
    this.clients = {}

    // I'm using a count cache because it will be more efficient compared with
    // having to do Object.keys( self.clients )
    this.clientsCount = 0

    debug( "Subscription initialized with id", this.id )
}

// Mix RHSubscription into Subcription
Subscription.STATUS = RHSubscription.STATUS
Subscription.Pattern = RHSubscription.Pattern
Subscription.prototype = Object.create( RHSubscription.prototype )

module.exports = Subscription

// Prototype methods

Subscription.prototype.redis = function () {
    if ( ! this.server ) {
        this.emit( 'error', new Error(
            'Could not access to server from this context, this should not happen'
        ))
        return
    }

    return this.server.redis
}

Subscription.prototype.subscribe = function () {
    var self = this

    if ( self.status === Subscription.STATUS.SUBSCRIBED ) {
        return Promise.cast()
    }

    self.status = Subscription.STATUS.SUBSCRIBING
    self.emit( 'subscribing' )

    var redis = self.redis()
    var channel = self.pattern.stringify()

    debug( "Subscribing to %s", channel )

    return redis.subscribe( channel )
    .then(function () {
        self.status = Subscription.STATUS.SUBSCRIBED
        self.emit( 'subscribed' )
    })
}

Subscription.prototype.unsubscribe = function () {
    var self = this

    if ( this.status === Subscription.STATUS.UNSUBSCRIBED ) {
        return Promise.cast()
    }

    this.status = Subscription.STATUS.UNSUBSCRIBING
    this.emit( 'unsubscribing' )

    var redis = self.redis()
    var channel = self.pattern.stringify()

    debug( "Unsubscribing from %s", channel )

    return redis.unsubscribe( channel )
    .then(function () {
        self.status = Subscription.STATUS.UNSUBSCRIBED
        self.emit( 'unsubscribed' )
    })
}

Subscription.prototype.destroy = function () {
    var self = this

    for ( var i in this.clients ) {
        if ( ! this.clients.hasOwnProperty( i ) ) {
            continue
        }

        var client = this.clients[ i ]

        self.deattachClient( client )
        client.deattachSubscription( self )
    }

    this.emit( 'destroy' )
}

Subscription.prototype.attachServer = function ( server ) {
    this.server = server
}

Subscription.prototype.deattachServer = function ( server ) {
    delete this.server
}

Subscription.prototype.attachClient = function ( client ) {
    var self = this

    return Promise.try(function () {

        if ( self.subscribed() ) {
            return
        }

        return self.subscribe()
    })
    .then(function () {
        self.clients[ client.id ] = client
        self.clientsCount++
    })
}

Subscription.prototype.deattachClient = function ( client ) {
    var self = this

    return Promise.try(function () {
        if ( self.clientsCount !== 1 || self.unsubscribed() ) {
            return
        }

        return self.unsubscribe()
    })
    .then(function () {
        delete self.clients[ client.id ]
        self.clientsCount--
    })
    .then(function () {
        // This should act a little bit as a garbage collector for subscriptions
        // We will gonna check again if there are no clients and if this is
        // unsubscribed. If yes, means that we should remove it from the server

        if ( self.clientsCount || ! self.unsubscribed() ) {
            return
        }

        // time to self destroy
        self.destroy()
    })
}
