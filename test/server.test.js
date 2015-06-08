var chai = require( 'chai' );
var expect = chai.expect;
var SocketServer = require( '../' );
var EngineIOClient = require( 'engine.io-client' );
var Promise = require( 'bluebird' );
var msgpack = require( 'msgpack' );
var debug = require( 'debug' )( 'realizehit:socket-server:test:server' );

describe( "socket server", function () {

    beforeEach(function () {
        var self = this;

        // To be sure that the port is not beeing used on test side;
        var port = Math.floor( ( Math.random() * 5000 ) + 15000 );

        self.send = function ( data ) {
            data = msgpack.pack( data );
            self.client.send( data );
        };

        self.waitForMessage = function () {
            return new Promise(function ( fulfill, reject ) {
                self.client.once( 'message', function ( message ) {
                    fulfill( message );
                });
            });
        };

        return Promise.try(function () {
            debug( "constructing an SocketServer" );

            self.server = new SocketServer({ port: port });
            self.server.listen();
        })
        .then(function () {
            debug( "configuring client" );

            return new Promise(function ( fulfill, reject ) {
                self.client = new EngineIOClient( 'ws://localhost:' + port );

                self.client.on( 'error', reject );
                self.client.on( 'open', fulfill );
            });

        })
        .then(function () {
            debug( "server and client are connected" );
        });
    });

    afterEach(function () {
        this.server.close();
    });


    describe( "subscribing process", function () {

        it( "should subscribe flawless", function () {
            var self = this;
            return Promise.try(function () {
                self.send({
                    action: 'subscribe',
                    pattern: 'client:testing',
                });

                return self.waitForMessage();
            })
            .then(function ( message ) {
                expect( message ).to.deep.equal({
                    action: 'subscribe',
                    pattern: 'client:testing',
                    status: 'ok',
                });
            });
        });

        it( "should return an error if we subscribe twice the same pattern", function () {
            var self = this;
            return Promise.try(function () {
                self.send({
                    action: 'subscribe',
                    pattern: 'client:testing',
                });

                return self.waitForMessage();
            })
            .then(function ( message ) {
                expect( message ).to.deep.equal({
                    action: 'subscribe',
                    pattern: 'client:testing',
                    status: true,
                });
            })
            .then(function () {
                self.send({
                    action: 'subscribe',
                    pattern: 'client:testing',
                });

                return self.waitForMessage();
            })
            .then(function ( message ) {
                expect( message ).to.deep.equal({
                    action: 'subscribe',
                    pattern: 'client:testing',
                    status: false,
                });
            });
        });

    });

    describe( "unsubscribing process", function () {

    });
});
