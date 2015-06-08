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

Client.prototype.onMessage = function ( data ) {
    var message = msgpack.unpack( data );

    if (
        // Action validation
        Util.isnt.String( message.action ) ||
        ! actions[ message.action ] ||

        // check if we have all params
        actions[ message.action ].checkParams( message )
    ) {
        // ignore message
        debug( "client %s sent a message but it was ignored", this.socket.id, message );
        return;
    }

    debug( "client %s sent a message", this.socket.id, message );

    var method = actions[ message.action ];

    if ( typeof method !== 'function' ) {
        return;
    }

    method.call( this, data );
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

// TODO
// replace after https://github.com/findhit/util/issues/40
function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

// exposed actions
var actions = {};

function registerAction ( action, fn ) {
    actions[ action ] = fn;

    var actionParams = Util.Function.getParamNames( fn );
    actionParams.sort();

    fn.checkParams = function ( message ) {

        var messageParams = Object.keys( message );
        messageParams.sort();

        return arraysEqual( actionParams, messageParams );
    };
}

registerAction( 'subscribe', function ( data ) {

    var getSubscription = this.server.getSubscription( data.pattern );

    // TODO
});


registerAction( 'unsubscribe', function ( data ) {

    var subscription = this.server.getSubscription( data.pattern, false );

    // TODO

});
