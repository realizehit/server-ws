var Chai = require( 'chai' )
var expect = Chai.expect
var Subscription = require( '../../src/subscription' )
var pattern2id = require( '../../src/util/subscription.pattern2id' )

describe( 'util/subscription.pattern2id', function () {

    function testCase ( input, expected ) {
        var result = pattern2id( input )
        expect( result ).to.be.equal( expected )
    }

    it( "test with a pattern string", function () {
        testCase( 'testing:yolasda', '540d034d' )
    })

    it( "test with a Subscription instance", function () {
        testCase( new Subscription({ testing: 'yolasda' }), '540d034d' )
    })

    it( "test with a raw pattern object", function () {
        testCase( { testing: 'yolasda' }, '540d034d' )
    })

})
