var Util = require( 'findhit-util' );
var msgpack = require( 'msgpack' );


function Client ( server, socket ) {

    this.server = server;
    this.socket = socket;
    this.subscriptions = {};

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

        Util.isnt.Array( message.arguments ) ||
        message.arguments.length === 0
    ) {
        // ignore message
        return;
    }

    var method = actions[ message.action ];

    if ( typeof method !== 'function' ) {
        return;
    }

    method.call( this, data );
};

Client.prototype.onDisconnect = function () {
    var client = this;
    var subscriptions = this.subscriptions;

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

actions.subscribe = function ( data ) {

    var getSubscription = this.server.getSubscription( data.pattern );

};


actions.unsubscribe = function ( data ) {

    var subscription = this.server.getSubscription( data.pattern, false );



};
