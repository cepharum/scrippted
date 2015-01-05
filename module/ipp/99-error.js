/**
 * (c) 2014 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

var IPP = require( "ipp" );


module.exports.registerModule = function( app ) {
	"use strict";

	// catch all requests that haven't been processed with response before
	app.use( function( req, res ) {
		var response = req.ipp.header.deriveResponse( IPP.STATUS.clientErrorNotFound );

		res
			.status( 404 )
			.type( "application/ipp" )
			.send( response.toBuffer() );
	} );

	// handle errors on processing request by responding accordingly
	app.use( function( err, req, res, next ) {  // keep "next" turning this into error handler!
		var httpStatus,
		    ippStatus = parseInt( err.status ) || IPP.STATUS.serverErrorInternalError,
		    response = req.ipp.header.deriveResponse( ippStatus );

		console.error( "IPP processing error (0x" + ( "000" + ippStatus.toString( 16 ) ).substr( -4 ) + "): " + err.message );

		if ( app.get( "env" ) === "development" ) {
			console.error( err.stack );
		}

		// try to derive http status matching best IPP status
		if ( ippStatus < IPP.STATUS.clientErrorBadRequest ) {
			httpStatus = 200;
		} else if ( ippStatus < IPP.STATUS.serverErrorInternalError ) {
			httpStatus = 400;
		} else {
			httpStatus = 500;
		}

		res
			.status( httpStatus )
			.type( "application/ipp" )
			.send( response.toBuffer() );
	} );
};
