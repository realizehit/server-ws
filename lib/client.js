var Util = require( 'findhit-util' ),
    msgpack = require( 'msgpack' );

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

    if(
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

    method.apply( this, message.arguments );
};

Client.prototype.onDisconnect = function () {
    var client = this;

    // Unsubscribe all from redis
    // using up redis punsubscribe
    // TODO
    this.server.redis
};

Client.prototype.emit = function ( id ) {

};

// exposed actions
var actions = {};

actions.subscribe = function ( sub_filters ) {
    var subscription = Util.extend(
        new Subscription(),
        {
            server: this.server,
            client: this
        }
    );

    subscription

    return subscription;
};


actions.unsubscribe = function ( subscription ) {

};


// Private methods

function subToString( sub ) {
    return msgpack.pack( sub );
}
