var Chai = require( 'chai' )
var expect = Chai.expect
var http = require( 'http' )
var WSServer = require( '../' )
var Promise = require( 'bluebird' )
var EngineIOClient = require( 'engine.io-client' )
var uniqid = require( 'uniqid' )

// generate an ephemeral port between 30000 and 40000
var httpPort = Math.floor( Math.random() * 10000 ) + 30000

describe( 'WSServer', function () {

    beforeEach(function () {
        var context = this

        var httpServer = context.httpServer = http.createServer().listen( httpPort )

        var server = context.server = new WSServer({
            httpServer: httpServer
        })

        var client = context.client = new EngineIOClient( 'ws://localhost:' + httpPort )

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
        .delay( 35 )
        .then(function () {
            expect( Object.keys( server.clients ) ).to.have.length( 0 )
        })
    })

    it( "should reply with the same provided id", function () {
        var id = uniqid()

        return Promise.cast({ id: id })
        .then( sendAndWaitForMessage.bind( this ) )
        .then(function ( res ) {
            expect( typeof res ).to.be.equal( 'object' )
            expect( res.id ).to.be.equal( id )
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
        })
    })

})
