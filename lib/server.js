var Util = require( 'findhit-util' ),
    Class = require( 'findhit-class' ),
    Http = require( 'http' ),
    Engine = require( 'engine.io' ),
    Redis = require( 'redis' ),
    Client = require( './client' );

var Server = Class.extend({

    statics: {
        createServer: function () {
            return Server.construct.apply( this, arguments );
        },

        STATUS: {
            CLOSED: 0,
            LISTENING: 1,
        }
    },

    options: {
        host: '0.0.0.0',
        port: 8080,

        redisHost: undefined,
        redisPort: undefined,

        endpointHost: undefined,
        endpointPort: undefined,

        // 'http' server instance
        http: undefined, // defaults to new Http.Server()

        // 'engine.io' server instance
        engine: undefined, // defaults to new Engine.Server()

    },

    initialize: function ( options ) {
        options = this.setOptions( options );

        this.subscriptions = {};

        return this
            .setHttp()
            .setEngine()
            .setRedis();
    },

    setHttp: function ( http ) {

        this.http =
            http instanceof Http.Server && http ||
            this.options.http ||
            new Http.Server();

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    setEngine: function ( engine ) {

        this.io =
            engine instanceof Engine.Server && engine ||
            this.options.engine ||
            new Engine.Server();

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    setRedis: function ( redis ) {

        this.io =
            redis instanceof Engine.Server && redis ||
            this.options.redis ||
            new Engine.Server();

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    getSubscription: function ( pattern, create ) {

        if ( typeof pattern !== 'string' || ! pattern ) {
            throw new TypeError( "invalid pattern provided" );
        }

        if ( typeof create === 'undefined' ) {
            create = true;
        }

        if ( this.subscriptions[ pattern ] ) {
            return this.subscriptions[ pattern ];
        }

        if ( ! create ) {
            return undefined;
        }

        var subscription = new Subscription( server, pattern );

        this.subscriptions[ pattern ] = subscription;

        return subscription;
    },

    reconfigure: function () {
        var http = this.http,
            engine = this.engine,
            redis = this.redis;

        // check if are vali

        if ( ! http ) {
            throw new TypeError( "no http server specified" );
        }

        if ( ! engine ) {
            throw new TypeError( "no engine.io server specified" );
        }

        if ( ! redis ) {
            throw new TypeError( "no redis server specified" );
        }

        // clean them
        redis.removeAllListeners();
        http.removeAllListeners();
        engine.removeAllListeners();

        // bind them

            // bind redis subscription pattern messages
            redis.on( 'pmessage', this._onMessageFromRedis.bind( this ) );

            // bind http connections into engine
            engine.attach( http );

            // on each socket
            engine.on( 'connection', this._onClientConnection.bind( this ) );

        return this;
    },

    _onClientConnection: function ( socket ) {
        socket.client = new Client( server, socket );
    },

    _onMessageFromRedis: function ( pattern, filters, payload ) {
        var subscription = this.getSubscription( pattern, false );

        if ( ! subscription ) {
            throw Error( "subscribed on redis without having subscription" );
        }

        return subscription.onMessage( filters, payload );
    },

    listening: function () {
        return !! this.status;
    },

    listen: function ( port, host ) {

        if ( this.listening() ) {
            this.close();
        }

        this.options.port = Util.is.Number( port ) && +port || this.options.port;
        this.options.host = Util.is.String( host ) && host || this.options.host;

        this.status = Server.STATUS.LISTENING;

        // Listen with provided properties
        this.http.listen(
            this.options.port,
            this.options.host
        );


        return this;
    },

    close: function () {
        var subscriptions = this;

        if ( ! this.listening() ) {
            throw new Error( "cannot close server since it is already closed" );
        }

        this.status = Server.STATUS.CLOSED;

        this.http.close();

        // Remove all subscriptions
        for ( var i in subscriptions ) {
            if ( subscriptions.hasOwnProperty( i ) ) {
                subscriptions[ i ].remove();
            }
        }

        return this;
    },

});

Server.Server = Server;

module.exports = Server;
