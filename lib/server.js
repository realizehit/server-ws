var Util = require( 'findhit-util' );
var Class = require( 'findhit-class' );
var Http = require( 'http' );
var Engine = require( 'engine.io' );
var Redis = require( 'redis' );
var Client = require( './client' );
var Subscription = require( './subscription' );
var debug = require( 'debug' )( 'realizehit:socket-server:client' );

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

        redisHost: 'localhost',
        redisPort: 6379,

        endpointHost: undefined,
        endpointPort: undefined,

        // 'http' server instance
        http: undefined, // defaults to new Http.Server()

        // 'engine.io' server instance
        engine: undefined, // defaults to new Engine.Server()

    },

    initialize: function ( options ) {
        options = this.setOptions( options );

        debug( "initializing a new server" );

        this.subscriptions = {};

        // setup things
        this.setHttp();
        this.setEngine();
        this.setRedis();
        this.reconfigure();

        debug( "server initialized with success" );
    },

    setHttp: function ( http ) {
        debug( "setting http server" );

        this.http =
            http instanceof Http.Server && http ||
            this.options.http instanceof Http.Server && http ||
            Http.createServer();

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    setEngine: function ( engine ) {
        debug( "setting socket engine" );

        this.engine =
            engine instanceof Engine.Server && engine ||
            this.options.engine instanceof Engine.Server && engine ||
            new Engine.Server();

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    setRedis: function ( redis ) {
        debug( "setting redis client" );

        this.redis =
            redis instanceof Redis.RedisClient && redis ||
            this.options.redis instanceof Redis.RedisClient && redis ||
            Redis.createClient(
                this.options.redisPort,
                this.options.redisHost
            );

        if ( this.listening() ) {
            this.reconfigure();
        }

        return this;
    },

    getSubscription: function ( pattern, create ) {
        var server = this;

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

    destroyAllSubscriptions: function () {
        debug( "destroying all subscriptions" );

        var subscriptions = this.subscriptions;

        // Remove all subscriptions
        for ( var i in subscriptions ) {
            if ( subscriptions.hasOwnProperty( i ) ) {
                subscriptions[ i ].remove();
            }
        }

        return this;
    },

    reconfigure: function () {
        var http = this.http,
            engine = this.engine,
            redis = this.redis;

        debug( "reconfiguring server" );

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

        debug( "removing listeners from objects" );

        // clean them
        redis.removeAllListeners( 'pmessage' );
        http.removeAllListeners( 'request' );
        engine.removeAllListeners( 'connection' );

        // bind them
        debug( "attaching new listeners on objects" );

            // bind redis subscription pattern messages
            redis.on( 'pmessage', this._onMessageFromRedis.bind( this ) );

            // bind http connections into engine
            engine.attach( http );

            // on each socket
            engine.on( 'connection', this._onClientConnection.bind( this ) );

        debug( "server reconfigured" );

        return this;
    },

    _onClientConnection: function ( socket ) {
        debug( "new connection from io, passing it to client constructor handler" );

        socket.client = new Client( this, socket );
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

        debug( "trying to listen on server" );

        if ( this.listening() ) {
            debug( "server was already listening, closing it first" );
            this.close();
        }

        port = this.options.port = +port || +this.options.port || 8080;
        host = this.options.host = host || this.options.host || '0.0.0.0';

        this.status = Server.STATUS.LISTENING;

        debug( "starting to listen on http://%s:%s", host, port );

        // Listen with provided properties
        this.http.listen( port, host );

        return this;
    },

    close: function () {

        debug( "trying to close server" );

        if ( ! this.listening() ) {
            throw new Error( "cannot close server since it is already closed" );
        }

        this.status = Server.STATUS.CLOSED;

        this.http.close();

        debug( "server closed, removing subscriptions" );

        this.destroyAllSubscriptions();

        return this;
    },

});

Server.Server = Server;

module.exports = Server;
