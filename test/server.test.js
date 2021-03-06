var Chai = require( 'chai' )
var expect = Chai.expect
var http = require( 'http' )
var WSServer = require( '../' )
var Promise = require( 'bluebird' )
var EngineIOClient = require( 'engine.io-client' )
var uniqid = require( 'uniqid' )
var pattern2id = require( 'realizehit-pattern-to-id' )
var Publisher = require( 'realizehit-publisher' )

// generate an ephemeral port between 30000 and 40000
var httpPort = Math.floor( Math.random() * 10000 ) + 30000

describe( 'WSServer', function () {

    beforeEach(function () {
        var context = this

        var httpServer = context.httpServer = http.createServer().listen( httpPort )

        var server = context.server = new WSServer({
            httpServer: httpServer
        })

        var client = context.client = new EngineIOClient(
            'ws://localhost:' + httpPort,
            { path: '/ws' }
        )

        return Promise.all([
            new Promise(function ( fulfill, reject ) {
                client.on( 'open', fulfill )
            })
        ])
    })

    afterEach(function () {
        var context = this

        context.client.close()
        context.server.destroy()
    })

    function sendAndWaitForMessage ( payload ) {
        var client = this.client

        return Promise.cast( payload )
        .then( JSON.stringify )
        .then(function ( stringifiedPayload ) {
            client.send( stringifiedPayload )
            return new Promise(function ( fulfill, reject ) {
                client.on( 'message', fulfill )
            })
        })
        .then( JSON.parse )
    }

    it( "should have correct clients count after connect and disconnect", function () {
        var context = this
        var server = context.server
        var client = context.client

        expect( Object.keys( server.clients ) ).to.have.length( 1 )

        return (new Promise(function ( fulfill, reject ) {
            client.on( 'close', fulfill )
            client.close()
        }))
        .delay( 50 )
        .then(function () {
            expect( Object.keys( server.clients ) ).to.have.length( 0 )
        })
    })

    it( "should reply with the same provided id", function () {
        var id = uniqid()

        return Promise.cast({ id: id, act: 'ping' })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.id ).to.be.equal( id )
            expect( res.err ).to.be.equal( undefined )
        })
    })

    it( "should reply to a subscription with same id", function () {
        var context = this
        var client = context.client

        return Promise.cast({
            act: 'sub',
            pat: {
                tvshow: 'simpsons',
                channel: 'cnn'
            }
        })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.err ).to.be.equal( undefined )
        })
    })

    it( "should passthrough the payload after a subscription response", function () {
        var context = this
        var client = context.client
        var pattern = {
                tvshow: 'simpsons',
                channel: 'cnn'
            }
        var payload = 'hello'
        var subpayJoinerChar = this.server.options.subpayJoinerChar

        return Promise.cast({
            act: 'sub',
            pat: pattern
        })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.err ).to.be.equal( undefined )
        })
        .then(function () {
            var publisher = new Publisher()

            return new Promise(function ( fulfill, reject ) {
                client.on( 'message', function ( subpay ) {
                    // Divide subpay to test if they're correct
                    fulfill( subpay.split( subpayJoinerChar, 2 ) )
                })

                publisher.publish( pattern, payload )
            })
        })
        .spread(function ( rcvdSubscriptionId, rcvdPayload ) {
            expect( rcvdSubscriptionId ).to.be.equal( pattern2id( pattern ) )
            expect( rcvdPayload ).to.be.equal( JSON.stringify( payload ) )
        })
    })

    it( "should NOT passthrough the payload after a unsubscription response", function () {
        var context = this
        var client = context.client
        var pattern = {
                tvshow: 'simpsons',
                channel: 'cnn'
            }
        var payload = 'hello'
        var subpayJoinerChar = this.server.options.subpayJoinerChar

        return Promise.cast({
            act: 'sub',
            pat: pattern
        })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.err ).to.be.equal( undefined )
            expect( Object.keys( context.server.subscriptions ) ).to.have.length( 1 )
        })
        .then(function () {
            return {
                act: 'unsub',
                pat: pattern
            }
        })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.err ).to.be.equal( undefined )
            expect( Object.keys( context.server.subscriptions ) ).to.have.length( 0 )
        })
        .then(function () {
            var publisher = new Publisher()

            return new Promise(function ( fulfill, reject ) {
                client.on( 'message', function ( subpay ) {
                    reject( new Error( "Shouldn't have received this message" ) )
                })

                // Fulfill in case we don't receive the message in half a sec
                setTimeout( fulfill, 500 )

                publisher.publish( pattern, payload )
            })
        })
    })

})
