/**
 * (c) 2014 cepharum GmbH, Berlin, http://cepharum.de
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author: Thomas Urban
 */

// --- loading Jasmine testing framework --------------------------------------

var J = require( "jasmine" );

// --- dependencies to be tested ----------------------------------------------

var PROMISE = require( "promise" );

// --- implementation of test suites ------------------------------------------

J.describe( "Creating promise", function() {
	"use strict";

	J.it( "is returning another instance every time", function() {
		var promise1 = PROMISE.create(),
			promise2 = PROMISE.create();

		J.expect( PROMISE.isPromise( promise1 ) ).toBe( true );
		J.expect( promise1 ).not.toBe( promise2 );
	} );

	J.it( "is returning pending promise", function() {
		var promise = PROMISE.create();

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( false );
		J.expect( promise.isFulfilled() ).toBe( false );
		J.expect( promise.isRejected() ).toBe( false );
	} );

	J.it( "can be fulfilled", function() {
		var promise = PROMISE.create().fulfill( 1 );

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( true );
		J.expect( promise.isRejected() ).toBe( false );
	} );

	J.it( "can be rejected", function() {
		var promise = PROMISE.create().reject( 1 );

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( false );
		J.expect( promise.isRejected() ).toBe( true );
	} );

	J.it( "can't be fulfilled after being rejected", function() {
		var promise = PROMISE.create().reject().fulfill();

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( false );
		J.expect( promise.isRejected() ).toBe( true );
	} );

	J.it( "can't be rejected after being fulfilled", function() {
		var promise = PROMISE.create().fulfill().reject();

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( true );
		J.expect( promise.isRejected() ).toBe( false );
	} );

	J.it( "does not require value on fulfilling", function() {
		var promise = PROMISE.create().fulfill();

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( true );
		J.expect( promise.isRejected() ).toBe( false );
	} );

	J.it( "does not require cause on rejecting", function() {
		var promise = PROMISE.create().reject();

		J.expect( PROMISE.isPromise( promise ) ).toBe( true );
		J.expect( promise.isSettled() ).toBe( true );
		J.expect( promise.isFulfilled() ).toBe( false );
		J.expect( promise.isRejected() ).toBe( true );
	} );

	J.it( "is accepting functions to call on fulfilling/rejecting promise", function() {
		var promise = PROMISE.create();

		J.expect( function() { promise.then(); } ).not.toThrow();
		J.expect( function() { promise.then( function() {} ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, function() {} ); } ).not.toThrow();
		J.expect( function() { promise.then( function() {}, function() {} ); } ).not.toThrow();
	} );

	J.it( "is accepting promises fulfill/reject on fulfilling/rejecting promise", function() {
		var promise = PROMISE.create(),
			argument = PROMISE.create();

		J.expect( function() { promise.then( argument ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, argument ); } ).not.toThrow();
		J.expect( function() { promise.then( argument, argument ); } ).not.toThrow();
	} );

	J.it( "is providing outcome of promise in all immediately attached fulfilled-callback", function( done ) {
		var promise = PROMISE.create().fulfill( 1 ),
			outcome = [];

		function collect( value ) {
			outcome.push( value );
			if ( outcome.length === 5 ) {
				J.expect( outcome ).toEqual( [ 1, 1, 1, 1, 1 ] );
				done();
			}
		}

		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();

		// retry with promise fulfilled after short delay
		promise = PROMISE.create();
		outcome = [];

		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();
		J.expect( function() { promise.then( collect ); } ).not.toThrow();

		setTimeout( function() { promise.fulfill( 1 ); }, 10 );
	} );

	J.it( "is providing cause for rejecting promise in all immediately attached rejected-callback", function( done ) {
		var promise = PROMISE.create().reject( 1 ),
		    outcome = [];

		function collect( value ) {
			outcome.push( value );
			if ( outcome.length === 5 ) {
				J.expect( outcome ).toEqual( [ 1, 1, 1, 1, 1 ] );
				done();
			}
		}

		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();

		// retry with promise rejected after short delay
		promise = PROMISE.create();
		outcome = [];

		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();
		J.expect( function() { promise.then( undefined, collect ); } ).not.toThrow();

		setTimeout( function() { promise.reject( 1 ); }, 10 );
	} );

	J.it( "is passing early outcome of promise through all mediately attached thenables", function( done ) {
		var promise = PROMISE.create().fulfill( 1 );

		J.expect( function() { promise.then().then().then().then().then( function( value ) {
			J.expect( value ).toBe( 1 );

			done();
		} ); } ).not.toThrow();
	} );

	J.it( "is passing late outcome of promise through all mediately attached thenables", function( done ) {
		var promise = PROMISE.create();

		J.expect( function() { promise.then().then().then().then().then( function( value ) {
			J.expect( value ).toBe( 2 );

			done();
		} ); } ).not.toThrow();

		setTimeout( function() { promise.fulfill( 2 ); }, 10 );
	} );

	J.it( "is passing early cause for rejecting promise through all mediately attached thenables", function( done ) {
		var promise = PROMISE.create().reject( 1 );

		J.expect( function() { promise.then().then().then().then().then( undefined, function( cause ) {
			J.expect( cause ).toBe( 1 );

			done();
		} ); } ).not.toThrow();
	} );

	J.it( "is passing late cause for rejecting promise through all mediately attached thenables", function( done ) {
		var promise = PROMISE.create();

		J.expect( function() { promise.then().then().then().then().then( undefined, function( cause ) {
			J.expect( cause ).toBe( 2 );

			done();
		} ); } ).not.toThrow();

		setTimeout( function() { promise.reject( 2 ); }, 10 );
	} );

	J.it( "is accepting a thenable's alternation of a promise's early outcome", function( done ) {
		var promise = PROMISE.create().fulfill( 1 );

		J.expect( function() { promise.then().then().then( function() { return 6; } ).then().then( function( value ) {
			J.expect( value ).toBe( 6 );

			done();
		} ); } ).not.toThrow();
	} );

	J.it( "is accepting a thenable's alternation of a promise's late outcome", function( done ) {
		var promise = PROMISE.create();

		J.expect( function() { promise.then().then().then( function() { return 7; } ).then().then( function( value ) {
			J.expect( value ).toBe( 7 );

			done();
		} ); } ).not.toThrow();

		setTimeout( function() { promise.fulfill( 2 ); }, 10 );
	} );

	J.it( "is accepting a thenable's alternation of cause for early reject of promise", function( done ) {
		var promise = PROMISE.create().reject( 1 );

		J.expect( function() { promise.then().then().then( undefined, function() { throw 4; } ).then().then( undefined, function( cause ) {
			J.expect( cause ).toBe( 4 );

			done();
		} ); } ).not.toThrow();
	} );

	J.it( "is accepting a thenable's alternation of cause for late reject of promise", function( done ) {
		var promise = PROMISE.create();

		J.expect( function() { promise.then().then().then( undefined, function() { throw 5; } ).then().then( undefined, function( cause ) {
			J.expect( cause ).toBe( 5 );

			done();
		} ); } ).not.toThrow();

		setTimeout( function() { promise.reject( 2 ); }, 10 );
	} );

	J.it( "is accepting a thenable's conversion of cause for a promise's early reject into outcome of mediate promise", function( done ) {
		var promise = PROMISE.create().reject( 1 );

		J.expect( function() {
			promise
				.then( undefined, function() { return 4; } )
				.then( function( value ) {
					J.expect( value ).toBe( 4 );

					done();
				} ); } ).not.toThrow();
	} );

	J.it( "is accepting a thenable's conversion of cause for a promise's late reject into outcome of mediate promise", function( done ) {
		var promise = PROMISE.create();

		J.expect( function() {
			promise
				.then( undefined, function() { throw 5; } )
				.then( undefined, function( value ) {
					J.expect( value ).toBe( 5 );

					done();
				} ); } ).not.toThrow();

		setTimeout( function() { promise.reject( 2 ); }, 10 );
	} );
} );
