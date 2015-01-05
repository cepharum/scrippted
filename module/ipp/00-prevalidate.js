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

	app.use( function( req, res, next ) {
		// redirect all non-IPP requests to web UI
		if ( !req.is( "application/ipp" ) ) {
			res.redirect( ( app.get( "ssl-enabled" ) ? "https" : "http" ) + "://" + req.hostname + "/" );
			return;
		}

		// reject all requests mismatching supported IPP version(s)
		if ( req.ipp.header.version > 1.1 ) {
			console.error( "unsupported IPP version " + req.ipp.header.version );
			res.type( "application/ipp" ).send( req.ipp.header.deriveResponse( IPP.STATUS.serverErrorVersionNotSupported ).toBuffer() );
			return;
		}

		next();
	} );
};
