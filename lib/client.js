var Util = require( 'findhit-util' );
var msgpack = require( 'msgpack' );
var debug = require( 'debug' )( 'realizehit:socket-server:client' );

function Client ( server, socket ) {
    var client = this;

    this.server = server;
    this.socket = socket;
    this.subscriptions = {};

    debug( 'client %s connected', client.socket.id );

    // TODO
    // mechanism for smart filters

    // Bind client messages to onMassage
    socket.on( 'message', this.onMessage.bind( this ) );

    // Bind disconnect logic method
    socket.on( 'disconnect', this.onDisconnect.bind( this ) );

}

module.exports = Client;

Client.prototype.onMessage = function ( message ) {
    message = msgpack.unpack( message );

    if (
        // Action validation
        Util.isnt.String( message.action ) ||
        typeof actions[ message.action ] !== 'function' ||

        // check if we have all params
        ! actions[ message.action ].checkParams( message )
    ) {
        // ignore message
        debug( "client %s sent a message but it was ignored", this.socket.id, message );
        return;
    }

    debug( "client %s sent a message", this.socket.id, message );

    return actions[ message.action ].run( this, message );
};

Client.prototype.onDisconnect = function () {
    var client = this;
    var subscriptions = this.subscriptions;

    debug( 'client %s disconnected', client.socket.id );

    // remove client from all subscriptions
    for ( var i in subscriptions ) {
        subscriptions[ i ].unbindClient( this );
    }
};

Client.prototype.emit = function ( data ) {
    this.socket.send( data );
};


// exposed actions
var actions = {};

function registerAction ( action, fn ) {
    actions[ action ] = fn;

    var actionParams = Util.Function.getParamNames( fn );

    fn.run = function ( context, message ) {

        debug( "running up action %s", action, message );

        var args = actionParams.map(function ( arg ) {
            return message[ arg ];
        });

        return fn.apply( context, args );
    };

    fn.checkParams = function ( message ) {

        if ( typeof message !== 'object' ) {
            return false;
        }

        var messageParams = Object.keys( message );

        if ( ( messageParams.length - 1 ) !== actionParams.length ) {
            return false;
        }

        for( var i in message ) {
            if ( i === 'action' ) {
                continue;
            }

            if ( actionParams.indexOf( i ) === -1 ) {
                return false;
            }
        }

        return true;
    };
}

registerAction( 'subscribe', function ( pattern ) {

    console.log( pattern );

    var getSubscription = this.server.getSubscription( pattern );

    // TODO
});


registerAction( 'unsubscribe', function ( pattern ) {

    var subscription = this.server.getSubscription( pattern, false );

    // TODO

});
