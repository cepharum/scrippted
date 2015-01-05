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

var IPP      = require( "ipp" );
var PRINTERS = require( "../../lib/printers-pool" );


var uris = {},
	ptn  = /^\w+:\/\/[^\/]+\//;

PRINTERS.eachPrinter( function( name, printer ) {
	"use strict";

	printer.uris.forEach( function( uri ) {
		"use strict";

		uri = uri.replace( ptn, "/" );

		if ( uri in uris ) {
			throw new Error( "ambigious URI configuration on printers " + uris[uri] + " and " + name );
		}

		uris[uri] = name;
	} );
} );

uris = Object.keys( uris );



module.exports.registerModule = function( app ) {
	"use strict";

	app.post( uris, function( req, res, next ) {
		"use strict";

//		req.ipp.body.pipe( FS.createWriteStream( PATH.join( require.main.filename, "../ipp-body.dump" ) ) );

		var printer;

		// select printer according to actually requested URI
		try {
			if ( req.params.printer ) {
				// framework was extracting printer's name from URI already ...
				printer = PRINTERS.selectPrinterByName( req.params.printer );
			} else {
				// there is no extracted name of printer
				// -> check all registered printers for the one matching requested printer-uri
				printer = PRINTERS.selectPrinterByUri( req.ipp.header.attributes.operation["printer-uri"][0].value );
			}
		} catch ( e ) {
			if ( app.get( "env" ) === "development" ) { throw e; }

			next( new Error( "selecting printer failed: " + e.message ) );
			return;
		}

		// get name of requested operation
		var opName = null, n, ops = IPP.OPERATION;

		for ( n in ops ) {
			if ( ops.hasOwnProperty( n ) && ops[n] === req.ipp.header.code ) {
				opName = n;
				break;
			}
		}

		// check if printer is supporting requested operation
		if ( opName ) {
			if ( !printer.supportsOperation( opName ) ) {
				// nope, it isn't ...
				next( new Error( "printer is not supporting operation " + opName ) );
				return;
			}

			// prepare IPP response related to IPP request
			var response = req.ipp.header.deriveResponse();

			var sendResponse = function() {
				"use strict";

				// handler wasn't sending response
				// -> send now
				try {
					response = response.toBuffer();
				} catch ( e ) {
					if ( app.get( "env" ) === "development" ) { throw e; }

					next( new Error( "failed to compile response: " + e.message ) );
					return;
				}

				res.type( "application/ipp" ).send( response );
			};


			// invoke handler provided by printer model instance
			try {
				if ( printer.perform( opName, req.ipp.header, response, req.ipp.body, sendResponse ) ) {
					// handler informs to invoke provided callback asynchronously
					// -> don't instantly send response below
					return;
				}
			} catch ( e ) {
				if ( app.get( "env" ) === "development" ) { throw e; }

				next( new Error( "performing " + opName + " on printer " + printer.name + " failed: " + e.message ) );
				return;
			}

			// instantly send response
			sendResponse();
		}
	} );
};
