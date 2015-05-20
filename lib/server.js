var Util = require( 'findhit-util' ),
    Class = require( 'findhit-class' ),
    Http = require( 'http' ),
    Engine = require( 'engine.io' ),
    Redis = require( 'redis' );

var Server = Class.extend({

    statics: {
        createServer: function () {
            return Server.construct.apply( this, arguments );
        },
    },

    options: {
        host: '0.0.0.0',
        port: 8080,

        endpointHost: undefined,
        endpointPort: undefined,

        // 'http' server instance
        http: undefined, // defaults to new Http.Server()

        // 'engine.io' server instance
        engine: undefined, // defaults to new Engine.Server()

    },

    initialize: function ( options ) {
        options = this.setOptions( options );

        return this
            .setHttp()
            .setEngine()
            .reconfigure();
    },

    setHttp: function ( http ) {

        this.http =
            http instanceof Http.Server && http ||
            this.options.http ||
            new Http.Server();

        return this;
    },

    setEngine: function ( engine ) {

        this.io =
            engine instanceof Engine.Server && engine ||
            this.options.engine ||
            new Engine.Server();

        return this;
    },

    reconfigure: function () {

        var http = this.http,
            engine = this.engine;

        // check if are vali

        if ( ! http ) {
            throw new TypeError( "no http server specified" );
        }

        if ( ! engine ) {
            throw new TypeError( "no engine.io server specified" );
        }

        // clean them
        http.removeAllListeners();
        engine.removeAllListeners();

        // bind them
        engine.attach( http );

        return this;
    },

    listen: function ( port, host ) {

        this.options.port = Util.is.Number( port ) && +port || this.options.port;
        this.options.host = Util.is.String( host ) && host || this.options.host;

        // In case it isn't handled
        if ( ! this.http._handle ) {

            // Listen with provided properties
            this.http.listen(
                this.options.port,
                this.options.host
            );

        }

        return this;
    },

});

Server.Server = Server;

module.exports = Server;
