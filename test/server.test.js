var chai = require( 'chai' );
var expect = chai.expect;
var SocketServer = require( '../' );
var EngineIO = require( 'engine.io-client' );
var Promise = require( 'bluebird' );

var port = 8000;

describe( "socket server", function () {

    describe( "testing initialization", function () {

        beforeEach(function () {
            this.server = new SocketServer();
        });

        it( "should initialize flawless", function () {
            this.server.listen( port );
        });

        it( "should accept socket connection", function () {
            var io = new EngineIO( 'ws://localhost:' + port );

            return new Promise(function ( fulfill, reject ) {
                io.on( 'error', reject );
                io.on( 'open', fulfill );
            });
        });

        it( "should allow us to subscribe easily", function () {
            var io = new EngineIO( 'ws://localhost:' + port );

            return new Promise(function ( fulfill, reject ) {
                io.on( 'error', reject );
                io.on( 'open', function () {
                    io.on( 'message', function ( data ) {
                        expect( data.action ).to.be.equal( 'subscribe' );
                        expect( data.subscription ).to.be.equal( 'channel:testing' );
                        expect( data.status ).to.be.ok;
                    });
                    io.emit( 'message', {
                        action: 'subscribe',
                        subscription: 'channel:testing',
                    });
                });
            });
        });

        it( "should receive ", function () {
            var io = new EngineIO( 'ws://localhost:' + port );

            return new Promise(function ( fulfill, reject ) {
                io.on( 'error', reject );
                io.on( 'open', function () {
                    io.on( 'message', function ( data ) {
                        expect( data.action ).to.be.equal( 'subscribe' );
                        expect( data.subscription ).to.be.equal( 'channel:testing' );
                        expect( data.status ).to.be.ok;
                    });
                    io.emit( 'message', {
                        action: 'subscribe',
                        subscription: 'channel:testing',
                    });
                });
            });
        });
    });

});
